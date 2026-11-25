import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { validateReleaseId } from './deploy-release.mjs';

const root = process.cwd();
const id = validateReleaseId(process.env.ROSE_RELEASE_ID);
const revision = process.env.ROSE_RELEASE_SHA;
if (revision !== id.slice(0, 40)) throw new Error('Release and commit do not match');
if (process.platform !== 'linux' || process.arch !== 'x64') throw new Error('Krystal release artifacts must be built on Linux x64');
const build = path.join(root, 'build');
await mkdir(build, { recursive: true });
const staging = await mkdtemp(path.join(build, '.release-'));
const archive = path.join(build, id + '.tar.gz');
try {
  const standalone = path.join(root, '.next/standalone');
  // An allowlist prevents Next's traced .env files from entering the artifact.
  // Dereferencing also makes the archive portable and prevents symlink traversal.
  for (const name of ['server.js', 'package.json', '.next', 'node_modules']) {
    await cp(path.join(standalone, name), path.join(staging, name), { recursive: true, dereference: true });
  }
  await cp(path.join(root, '.next/static'), path.join(staging, '.next/static'), { recursive: true, dereference: true });
  await cp(path.join(root, 'public'), path.join(staging, 'public'), { recursive: true, dereference: true });
  await writeFile(path.join(staging, 'release.json'), JSON.stringify({
    id, revision, platform: process.platform, arch: process.arch, node: process.version,
    buildId: (await readFile(path.join(staging, '.next/BUILD_ID'), 'utf8')).trim(),
    createdAt: new Date().toISOString(),
  }, null, 2));
  execFileSync('tar', ['-czf', archive, '-C', staging, '.']);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(archive)) hash.update(chunk);
  await writeFile(archive + '.sha256', hash.digest('hex') + '\n');
  console.log('Packaged release ' + id);
} finally {
  await rm(staging, { recursive: true, force: true });
}
