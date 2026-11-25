#!/usr/bin/env bash
set -euo pipefail

rose_command="${1:-}"
rose_release="${2:-}"
[[ "$rose_command" == deploy || "$rose_command" == rollback ]] || { echo 'Use deploy or rollback'; exit 1; }
[[ "$rose_release" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || { echo 'Invalid release identifier'; exit 1; }
: "${KRYSTAL_SSH_PRIVATE_KEY:?Set the KRYSTAL_SSH_PRIVATE_KEY repository secret}"
: "${KRYSTAL_SSH_KNOWN_HOSTS:?Set the independently verified KRYSTAL_SSH_KNOWN_HOSTS repository variable}"

umask 077
rose_temporary=$(mktemp -d "${RUNNER_TEMP:-/tmp}/rose-ssh.XXXXXX")
trap 'rm -rf "$rose_temporary"' EXIT
printf '%s\n' "$KRYSTAL_SSH_PRIVATE_KEY" > "$rose_temporary/key"
printf '%s\n' "$KRYSTAL_SSH_KNOWN_HOSTS" > "$rose_temporary/known_hosts"
unset KRYSTAL_SSH_PRIVATE_KEY
# Independently confirmed by Krystal support in ticket 72384945 on 2026-11-25.
# A host-key rotation requires a new independent verification before updating this pin.
rose_expected_fingerprint='SHA256:waIsiPHfDkWW+sghHq4tE7U0evykwR19x96jYEM/pAg'
rose_fingerprint=$(ssh-keygen -lf "$rose_temporary/known_hosts" -E sha256 2>/dev/null | awk '{print $2}') || { echo 'Invalid SSH known-hosts data' >&2; exit 1; }
[[ "$rose_fingerprint" == "$rose_expected_fingerprint" ]] || { echo 'SSH host key does not match the Krystal-verified fingerprint' >&2; exit 1; }
rose_options=(-o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o HostKeyAlgorithms=ssh-ed25519 -o GlobalKnownHostsFile=/dev/null -o "UserKnownHostsFile=$rose_temporary/known_hosts" -o ConnectTimeout=20 -i "$rose_temporary/key")
rose_server='roseclea@s98.lon.krystal.io'
rose_incoming='/home/roseclea/rose-deploy/incoming'

ssh -T -p 722 "${rose_options[@]}" "$rose_server" "umask 077; mkdir -p $rose_incoming"
scp -P 722 "${rose_options[@]}" scripts/deploy-release.mjs "$rose_server:$rose_incoming/$rose_release.mjs"
if [[ "$rose_command" == deploy ]]; then
  rose_digest=$(tr -d '\n\r' < "build/$rose_release.tar.gz.sha256")
  [[ "$rose_digest" =~ ^[a-f0-9]{64}$ ]] || { echo 'Invalid artifact checksum'; exit 1; }
  printf '%s  %s\n' "$rose_digest" "build/$rose_release.tar.gz" | sha256sum --check --status
  scp -P 722 "${rose_options[@]}" "build/$rose_release.tar.gz" "$rose_server:$rose_incoming/$rose_release.tar.gz"
else
  rose_digest=''
fi
# Arguments are fixed literals or validated hex/digit identifiers. No eval.
ssh -T -p 722 "${rose_options[@]}" "$rose_server" \
  "source /home/roseclea/nodevenv/rose-app/22/bin/activate && node $rose_incoming/$rose_release.mjs $rose_command $rose_release $rose_digest"
