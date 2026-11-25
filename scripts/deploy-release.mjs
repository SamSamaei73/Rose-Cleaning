import { appendFile, cp, mkdir, mkdtemp, readFile, readdir, readlink, rename, rm, stat, symlink, writeFile, access } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateReleaseId(id) {
  if (!/^[a-f0-9]{40}-[0-9]+-[0-9]+$/.test(id || '')) throw new Error('Invalid release identifier');
  return id;
}

export function validateArchiveEntries(entries) {
  for (const entry of entries) {
    const parts = entry.replace(/^\.\//, '').split('/');
    if (entry.startsWith('/') || entry.includes('\\') || parts.includes('..') ||
        parts.some(part => part === '.git' || part === '.env' || part.startsWith('.env.'))) {
      throw new Error('Unsafe archive path');
    }
  }
}

async function exists(file) {
  try { await access(file); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function atomicWrite(file, content) {
  const temporary = file + '.' + randomUUID();
  await writeFile(temporary, content, { mode: 0o600 });
  await rename(temporary, file);
}

async function setCurrent(app, release) {
  const current = path.join(app, 'current');
  if (!release) {
    await rm(current, { force: true }); // Only the deployment-owned symlink.
    return;
  }
  const temporary = current + '.' + randomUUID();
  await symlink(release, temporary);
  await rename(temporary, current);
}

async function publishAssets(release, web) {
  const entries = await readdir(path.join(release, 'public'));
  for (const name of entries) {
    if (name.startsWith('.') || ['cgi-bin', '_next', 'index.html', 'index.php'].includes(name)) {
      throw new Error('Reserved public asset: ' + name);
    }
  }
  // Keep .htaccess, ACME validation, unrelated files and old hashed chunks intact.
  for (const name of entries) await cp(path.join(release, 'public', name), path.join(web, name), { recursive: true });
  await cp(path.join(release, '.next/static'), path.join(web, '_next/static'), { recursive: true });
}

function bootstrap(base) {
  return `'use strict';\nconst fs = require('node:fs');\nconst path = require('node:path');\nconst shared = ${JSON.stringify(path.join(base, 'rose-deploy/shared/production.env'))};\nif (fs.existsSync(shared)) process.loadEnvFile(shared);\nprocess.env.HOSTNAME = '127.0.0.1';\nconst current = path.join(__dirname, 'current');\nconst release = fs.existsSync(current) ? fs.realpathSync(current) : __dirname;\nrequire(path.join(release, 'server.js'));\n`;
}

async function restart(app) {
  await mkdir(path.join(app, 'tmp'), { recursive: true });
  await writeFile(path.join(app, 'tmp/restart.txt'), new Date().toISOString());
}

async function readCurrent(base) {
  try {
    const target = await readlink(path.join(base, 'rose-app/current'));
    const id = validateReleaseId(path.basename(target));
    if (target !== path.join(base, 'rose-deploy/releases', id)) throw new Error('Unexpected current symlink target');
    return id;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function log(root, event, details) {
  await appendFile(path.join(root, 'deployments.jsonl'), JSON.stringify({ at: new Date().toISOString(), event, ...details }) + '\n', { mode: 0o600 });
}

export async function activateRelease({ base, id, probe }) {
  validateReleaseId(id);
  const root = path.join(base, 'rose-deploy');
  const app = path.join(base, 'rose-app');
  const web = path.join(base, 'public_html');
  const release = path.join(root, 'releases', id);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const lock = path.join(root, 'deploy.lock');
  try { await mkdir(lock); } catch { throw new Error('Deployment lock exists; inspect the active job before retrying'); }
  let previous;
  let altered = false;
  try {
    previous = await readCurrent(base);
    const metadata = JSON.parse(await readFile(path.join(release, 'release.json'), 'utf8'));
    if (metadata.id !== id || metadata.revision !== id.slice(0, 40)) throw new Error('Release metadata mismatch');
    await access(path.join(release, 'server.js'));
    const publicNames = await readdir(path.join(release, 'public'));
    if (publicNames.some(name => name.startsWith('.') || ['cgi-bin', '_next', 'index.html', 'index.php'].includes(name))) {
      throw new Error('Reserved public asset');
    }
    const legacy = path.join(root, 'legacy');
    if (!(await exists(path.join(legacy, 'app.js')))) {
      await mkdir(legacy, { recursive: true, mode: 0o700 });
      await cp(path.join(app, 'app.js'), path.join(legacy, 'app.js'));
      await cp(web, path.join(legacy, 'public_html'), { recursive: true });
    }
    await log(root, 'activating', { id, previous });
    altered = true;
    await publishAssets(release, web);
    await atomicWrite(path.join(app, 'app.js'), bootstrap(base));
    await setCurrent(app, release);
    await restart(app);
    await probe(id);
    await atomicWrite(path.join(root, 'state.json'), JSON.stringify({ current: id, previous, verifiedAt: new Date().toISOString() }, null, 2));
    await log(root, 'succeeded', { id, previous });
  } catch (error) {
    if (altered) {
      await setCurrent(app, previous ? path.join(root, 'releases', previous) : null);
      if (previous) await publishAssets(path.join(root, 'releases', previous), web);
      else {
        await cp(path.join(root, 'legacy/app.js'), path.join(app, 'app.js'));
        // Restores existing files; never deletes mail, databases or unrelated files.
        await cp(path.join(root, 'legacy/public_html'), web, { recursive: true });
      }
      await restart(app);
      try { await probe(previous); } catch (rollbackError) {
        await log(root, 'rollback-verification-failed', { id, previous });
        throw new AggregateError([error, rollbackError], 'Release failed and rollback needs operator verification');
      }
      await log(root, 'rolled-back', { id, previous });
    } else await log(root, 'rejected', { id });
    throw error;
  } finally {
    await rm(lock, { recursive: true });
  }
}

export async function probeRelease(origin, id, { attempts = 30, interval = 2000 } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      if (!id) {
        const response = await fetch(origin, { signal: AbortSignal.timeout(5000), redirect: 'error' });
        if (response.ok) return;
      } else {
        const health = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(5000), cache: 'no-store', redirect: 'error' });
        const data = await health.json();
        if (health.ok && data.release === id && data.revision === id.slice(0, 40)) {
          const ready = await fetch(origin + '/api/ready', { signal: AbortSignal.timeout(5000), cache: 'no-store', redirect: 'error' });
          if (ready.ok && (await ready.json()).status === 'ready') return;
        }
      }
    } catch { /* Retry cold starts, but never log credentials or response bodies. */ }
    if (attempt + 1 < attempts) await delay(interval);
  }
  throw new Error('Production health/readiness verification failed for ' + (id || 'legacy release'));
}

async function preflight(base, release, id) {
  const envFile = path.join(base, 'rose-deploy/shared/production.env');
  const mode = (await stat(envFile)).mode & 0o777;
  if (mode & 0o077) throw new Error('production.env must be readable only by its owner (0600)');
  const child = spawn(process.execPath, ['--env-file=' + envFile, path.join(release, 'server.js')], {
    cwd: release,
    env: { ...process.env, HOSTNAME: '127.0.0.1', PORT: '3087', NODE_ENV: 'production' },
    stdio: 'ignore',
  });
  let startupError;
  child.on('error', error => { startupError = error; });
  try {
    await probeRelease('http://127.0.0.1:3087', id, { attempts: 15, interval: 1000 });
    if (startupError || child.exitCode !== null) throw new Error('Preflight server failed to start');
  } finally {
    child.kill('SIGTERM');
    await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
}

async function extractRelease(base, id, expectedDigest) {
  if (!/^[a-f0-9]{64}$/.test(expectedDigest || '')) throw new Error('Invalid archive checksum');
  const root = path.join(base, 'rose-deploy');
  const archive = path.join(root, 'incoming', id + '.tar.gz');
  if ((await stat(archive)).size > 250 * 1024 * 1024) throw new Error('Release archive is too large');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(archive)) hash.update(chunk);
  if (hash.digest('hex') !== expectedDigest) throw new Error('Archive checksum mismatch');
  const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim().split('\n');
  validateArchiveEntries(entries);
  const types = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim().split('\n');
  if (types.some(line => !['d', '-'].includes(line[0]))) throw new Error('Archive must contain regular files and directories only');
  const releases = path.join(root, 'releases');
  await mkdir(releases, { recursive: true, mode: 0o700 });
  const release = path.join(releases, id);
  if (await exists(release)) throw new Error('Immutable release already exists; re-run the workflow with a new attempt number');
  const staging = await mkdtemp(path.join(releases, '.staging-'));
  try {
    execFileSync('tar', ['-xzf', archive, '--no-same-owner', '--no-same-permissions', '-C', staging]);
    const metadata = JSON.parse(await readFile(path.join(staging, 'release.json'), 'utf8'));
    if (metadata.id !== id || metadata.revision !== id.slice(0, 40) || metadata.platform !== process.platform || metadata.arch !== process.arch) {
      throw new Error('Archive identity/platform mismatch');
    }
    await preflight(base, staging, id);
    await rename(staging, release);
  } finally { await rm(staging, { recursive: true, force: true }); }
}

async function main() {
  const [command, id, digest] = process.argv.slice(2);
  validateReleaseId(id);
  const base = '/home/roseclea';
  if (command === 'deploy') await extractRelease(base, id, digest);
  else if (command !== 'rollback') throw new Error('Use deploy or rollback');
  await activateRelease({ base, id, probe: release => probeRelease('https://rosecleaning.uk', release) });
  console.log('Verified production release: ' + id);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
