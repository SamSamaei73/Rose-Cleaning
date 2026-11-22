import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const build = path.join(root, 'build');
const destination = path.join(build, 'rose-cpanel');
const archive = path.join(build, 'rose-cpanel.zip');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(command + ' failed (' + (result.signal || result.status) + ').');
  }
}

async function json(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

// Use Next's generated production server; preserve the ordinary build/start workflow.
run(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
  env: { ...process.env, ROSE_BUILD_TARGET: 'cpanel' },
});

await mkdir(build, { recursive: true });
const staging = await mkdtemp(path.join(build, '.cpanel-'));
const stagedArchive = staging + '.zip';

try {
  const standalone = path.join(root, '.next/standalone');
  // Explicit allowlist: local credentials, source and Mac dependencies stay local.
  await cp(path.join(standalone, '.next'), path.join(staging, '.next'), { recursive: true });
  await cp(path.join(standalone, 'server.js'), path.join(staging, 'server.js'));
  await cp(path.join(root, '.next/static'), path.join(staging, '.next/static'), { recursive: true });
  await cp(path.join(root, 'public'), path.join(staging, 'public'), { recursive: true });
  await cp(path.join(root, '.env.example'), path.join(staging, '.env.example'));
  await cp(path.join(root, 'docs/CPANEL.md'), path.join(staging, 'READ-ME-FIRST.md'));

  await writeFile(path.join(staging, 'app.js'), [
    '"use strict";',
    '// Passenger expects app.js. Avoid inheriting the hosting server HOSTNAME.',
    'process.env.HOSTNAME = process.env.ROSE_BIND_HOST || "127.0.0.1";',
    'require("./server.js");',
    '',
  ].join('\n'));

  const source = await json(path.join(root, 'package.json'));
  const runtime = {
    name: source.name,
    version: source.version,
    private: true,
    scripts: { start: 'node app.js' },
    dependencies: source.dependencies,
    engines: source.engines,
    overrides: source.overrides,
  };
  const lock = await json(path.join(root, 'package-lock.json'));
  lock.packages[''] = {
    name: runtime.name,
    version: runtime.version,
    dependencies: runtime.dependencies,
    engines: runtime.engines,
  };
  await writeFile(path.join(staging, 'package.json'), JSON.stringify(runtime, null, 2) + '\n');
  await writeFile(path.join(staging, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n');
  // Retain locked runtime versions; remove development-only packages.
  run(npm, ['install', '--package-lock-only', '--ignore-scripts', '--omit=dev', '--no-audit', '--no-fund'], { cwd: staging });

  const buildId = (await readFile(path.join(staging, '.next/BUILD_ID'), 'utf8')).trim();
  await writeFile(path.join(staging, 'BUILD-INFO.json'), JSON.stringify({
    name: runtime.name,
    version: runtime.version,
    buildId,
    createdAt: new Date().toISOString(),
    node: process.version,
    startupFile: 'app.js',
    dependencyInstallation: 'Run NPM Install in cPanel before starting the application.',
  }, null, 2) + '\n');

  run('zip', ['-q', '-r', stagedArchive, '.'], { cwd: staging });
  run('unzip', ['-tq', stagedArchive]);
  await rm(destination, { recursive: true, force: true });
  await rename(staging, destination);
  await rm(archive, { force: true });
  await rename(stagedArchive, archive);
  const size = ((await stat(archive)).size / 1024 / 1024).toFixed(1);
  console.log('\nDeployment ZIP: ' + archive + ' (' + size + ' MB)');
  console.log('Unpacked files: ' + destination);
  console.log('Install dependencies on the hosting server, then select app.js as the startup file.');
  run(process.execPath, [path.join(root, 'scripts/package-cpanel-public.mjs')]);
} finally {
  await rm(staging, { recursive: true, force: true });
  await rm(stagedArchive, { force: true });
}
