import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const build = path.join(root, 'build');
const runtime = path.join(build, 'rose-cpanel');
const destination = path.join(build, 'public_html');
const archive = path.join(build, 'rose-public-html.zip');
await mkdir(build, { recursive: true });
const staging = await mkdtemp(path.join(build, '.public-html-'));
const stagedArchive = staging + '.zip';

try {
  // Only files intended for visitors belong in Apache's public document root.
  await cp(path.join(runtime, 'public'), staging, { recursive: true });
  await cp(path.join(runtime, '.next/static'), path.join(staging, '_next/static'), { recursive: true });
  for (const [command, args] of [
    ['zip', ['-q', '-r', stagedArchive, '.']],
    ['unzip', ['-tq', stagedArchive]],
  ]) {
    const result = spawnSync(command, args, { cwd: staging, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(command + ' failed.');
  }
  await rm(destination, { recursive: true, force: true });
  await rename(staging, destination);
  await rm(archive, { force: true });
  await rename(stagedArchive, archive);
  console.log('Public web-root assets: ' + archive);
} finally {
  await rm(staging, { recursive: true, force: true });
  await rm(stagedArchive, { force: true });
}
