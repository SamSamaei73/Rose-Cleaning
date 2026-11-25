import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readlink, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { activateRelease, validateArchiveEntries, validateReleaseId } from './deploy-release.mjs';

const first = 'a'.repeat(40) + '-1-1';
const second = 'b'.repeat(40) + '-2-1';

test('release identifiers and archive paths cannot escape the deployment directory', () => {
  assert.equal(validateReleaseId(first), first);
  for (const id of ['main', '../outside', first + ';id', 'a'.repeat(40)]) {
    assert.throws(() => validateReleaseId(id));
  }
  validateArchiveEntries(['./', './server.js', './.next/BUILD_ID', './node_modules/next/package.json']);
  for (const entry of ['/etc/passwd', '../secret', './public/../../secret', './.env.local', './public/.git/config']) {
    assert.throws(() => validateArchiveEntries([entry]), entry);
  }
});

async function fixture(t) {
  const base = await mkdtemp(path.join(tmpdir(), 'rose-deploy-test-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  await mkdir(path.join(base, 'rose-app'), { recursive: true });
  await mkdir(path.join(base, 'public_html/.well-known'), { recursive: true });
  await writeFile(path.join(base, 'rose-app/app.js'), 'legacy startup');
  await writeFile(path.join(base, 'public_html/.htaccess'), 'Passenger configuration');
  await writeFile(path.join(base, 'public_html/.well-known/keep'), 'certificate validation');
  await writeFile(path.join(base, 'public_html/robots.txt'), 'existing robots');
  for (const id of [first, second]) {
    const release = path.join(base, 'rose-deploy/releases', id);
    await mkdir(path.join(release, 'public/images'), { recursive: true });
    await mkdir(path.join(release, '.next/static'), { recursive: true });
    await writeFile(path.join(release, 'release.json'), JSON.stringify({ id, revision: id.slice(0, 40) }));
    await writeFile(path.join(release, 'server.js'), 'fixture server');
    await writeFile(path.join(release, 'public/images/current.txt'), id);
    await writeFile(path.join(release, '.next/static', id + '.js'), 'immutable browser asset');
  }
  return base;
}

test('a successful release preserves host configuration and records a reversible deployment', async t => {
  const base = await fixture(t);
  const checked = [];
  await activateRelease({ base, id: first, probe: async id => checked.push(id) });
  assert.deepEqual(checked, [first]);
  assert.equal(await readlink(path.join(base, 'rose-app/current')), path.join(base, 'rose-deploy/releases', first));
  assert.equal(await readFile(path.join(base, 'public_html/.htaccess'), 'utf8'), 'Passenger configuration');
  assert.equal(await readFile(path.join(base, 'public_html/.well-known/keep'), 'utf8'), 'certificate validation');
  assert.equal(await readFile(path.join(base, 'public_html/robots.txt'), 'utf8'), 'existing robots');
  assert.equal(await readFile(path.join(base, 'rose-deploy/legacy/app.js'), 'utf8'), 'legacy startup');
  const state = JSON.parse(await readFile(path.join(base, 'rose-deploy/state.json'), 'utf8'));
  assert.equal(state.current, first);
  assert.equal(state.previous, null);
});

test('failed production verification restores the previous release and its public assets', async t => {
  const base = await fixture(t);
  await activateRelease({ base, id: first, probe: async () => {} });
  const checked = [];
  await assert.rejects(activateRelease({ base, id: second, probe: async id => {
    checked.push(id);
    if (id === second) throw new Error('backend unavailable');
  } }), /backend unavailable/);
  assert.deepEqual(checked, [second, first]);
  assert.equal(await readlink(path.join(base, 'rose-app/current')), path.join(base, 'rose-deploy/releases', first));
  assert.equal(await readFile(path.join(base, 'public_html/images/current.txt'), 'utf8'), first);
  await access(path.join(base, 'public_html/_next/static', first + '.js'));
  await access(path.join(base, 'public_html/_next/static', second + '.js'));
  const state = JSON.parse(await readFile(path.join(base, 'rose-deploy/state.json'), 'utf8'));
  assert.equal(state.current, first);
});

test('a failed first deployment restores the original startup file', async t => {
  const base = await fixture(t);
  await assert.rejects(activateRelease({ base, id: first, probe: async id => {
    if (id) throw new Error('unhealthy release');
  } }), /unhealthy release/);
  assert.equal(await readFile(path.join(base, 'rose-app/app.js'), 'utf8'), 'legacy startup');
  await assert.rejects(access(path.join(base, 'rose-app/current')));
});

test('an existing deployment lock prevents concurrent changes', async t => {
  const base = await fixture(t);
  await mkdir(path.join(base, 'rose-deploy/deploy.lock'));
  await assert.rejects(activateRelease({ base, id: first, probe: async () => {} }), /lock/);
  assert.equal(await readFile(path.join(base, 'rose-app/app.js'), 'utf8'), 'legacy startup');
});

test('release assets cannot replace Passenger settings or certificate validation files', async t => {
  const base = await fixture(t);
  await writeFile(path.join(base, 'rose-deploy/releases', first, 'public/.htaccess'), 'bad override');
  await assert.rejects(activateRelease({ base, id: first, probe: async () => {} }), /public asset/);
  assert.equal(await readFile(path.join(base, 'public_html/.htaccess'), 'utf8'), 'Passenger configuration');
});

const verifiedKnownHosts = '[s98.lon.krystal.io]:722 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHjj0JbKDtOw/fPHeEuYOYEOtkuVB03+XuC3ViHek+Ph';

async function sshFixture(t) {
  const base = await mkdtemp(path.join(tmpdir(), 'rose-ssh-test-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const log = path.join(base, 'connections');
  // Substitute only the network commands. The real ssh-keygen verifies each key.
  for (const command of ['ssh', 'scp']) {
    await writeFile(path.join(base, command), '#!/bin/sh\nprintf "%s\\n" "$@" >> "$ROSE_TEST_SSH_LOG"\n', { mode: 0o700 });
  }
  return {
    log,
    run(knownHosts) {
      return spawnSync('bash', [fileURLToPath(new URL('./deploy-via-ssh.sh', import.meta.url)), 'rollback', first], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${base}:${process.env.PATH}`,
          RUNNER_TEMP: base,
          ROSE_TEST_SSH_LOG: log,
          KRYSTAL_SSH_PRIVATE_KEY: 'test fixture; not a private key',
          KRYSTAL_SSH_KNOWN_HOSTS: knownHosts,
        },
      });
    },
  };
}

test('SSH deployment accepts the verified host only with strict ED25519 checks', async t => {
  const ssh = await sshFixture(t);
  const result = ssh.run(verifiedKnownHosts);
  assert.equal(result.status, 0, result.stderr);
  const argumentsSent = (await readFile(ssh.log, 'utf8')).split('\n');
  for (const option of ['StrictHostKeyChecking=yes', 'HostKeyAlgorithms=ssh-ed25519', 'GlobalKnownHostsFile=/dev/null']) {
    assert.equal(argumentsSent.filter(argument => argument === option).length, 3, option);
  }
});

test('SSH deployment refuses malformed, different or additional keys before connecting', async t => {
  const ssh = await sshFixture(t);
  const differentKey = verifiedKnownHosts.replace('ViHek+Ph', 'ViHek+Pg');
  for (const knownHosts of ['invalid', differentKey, `${verifiedKnownHosts}\n${differentKey}`]) {
    const result = ssh.run(knownHosts);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid SSH known-hosts data|does not match the Krystal-verified fingerprint/);
    await assert.rejects(access(ssh.log), { code: 'ENOENT' });
  }
});
