// Render the exact production 3D rig into lightweight fallbacks for WebGL-less devices.
// Run with Node 22+, installed development dependencies and ffmpeg on PATH.
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const workspace = resolve(import.meta.dirname, "..");
const output = join(workspace, "public/images/cleaner");
const frames = await mkdtemp(join(tmpdir(), "rose-cleaner-render-"));
await mkdir(output, { recursive: true });
const bundle = await build({
  stdin: {
    contents: `import {createCleanerRenderer} from './lib/client/cleaner-renderer';
      const variant = new URLSearchParams(location.search).get('variant') || 'companion';
      const scene = createCleanerRenderer(document.querySelector('canvas'), variant, {stationary:true});
      window.renderCleaner = time => scene.renderAt(time);
      window.ready = true;`,
    resolveDir: workspace,
    loader: "ts",
  },
  bundle: true,
  write: false,
  format: "iife",
  minify: true,
});
const server = createServer((request, response) => {
  if (request.url.startsWith("/scene.js")) {
    response.setHeader("Content-Type", "application/javascript");
    response.end(bundle.outputFiles[0].contents);
  } else
    response.end(
      '<!doctype html><style>html,body{margin:0;background:transparent}canvas{display:block;width:280px;height:360px}</style><canvas></canvas><script src="/scene.js"></script>',
    );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 280, height: 360 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (error) => {
    throw error;
  });
  const port = server.address().port;
  for (const [variant, duration] of [
    ["companion", 24],
    ["loading", 2.4],
  ]) {
    const selectedVariant = process.argv
      .find((arg) => arg.startsWith("--variant="))
      ?.split("=")[1];
    if (selectedVariant && selectedVariant !== variant) continue;
    await page.goto(`http://127.0.0.1:${port}/?variant=${variant}`);
    await page.waitForFunction(() => window.ready);
    await page.evaluate(() => window.renderCleaner(4));
    const preview = await page.screenshot({ omitBackground: true });
    await sharp(preview)
      .webp({ quality: 94 })
      .toFile(join(output, `${variant}.webp`));
    if (process.argv.includes("--poster-only")) continue;
    const folder = join(frames, variant);
    await mkdir(folder);
    const fps = 20;
    for (let frame = 0; frame < Math.round(duration * fps); frame++) {
      await page.evaluate((time) => window.renderCleaner(time), frame / fps);
      await page.screenshot({
        path: join(folder, `${String(frame).padStart(4, "0")}.png`),
        omitBackground: true,
      });
      if (frame % 100 === 0)
        process.stdout.write(
          `${variant}: ${frame}/${Math.round(duration * fps)} frames\n`,
        );
    }
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-framerate",
      String(fps),
      "-i",
      join(folder, "%04d.png"),
      "-c:v",
      "libvpx-vp9",
      "-pix_fmt",
      "yuva420p",
      "-crf",
      "34",
      "-b:v",
      "0",
      "-an",
      join(output, `${variant}.webm`),
    ]);
  }
  await writeFile(
    join(output, "README.txt"),
    "Original Rose 3D character. Generated from lib/client/cleaner-model.ts by scripts/render-cleaner-assets.mjs. WebM has alpha transparency; WebP posters cover reduced motion and video failures. No third-party character assets or textures.\n",
  );
  process.stdout.write(`Assets saved to ${output}\n`);
} finally {
  await browser.close();
  server.close();
  await rm(frames, { recursive: true, force: true });
}
