#!/usr/bin/env bash
set -euo pipefail
# A disposable database is created and removed. No existing application database is reset.
rose_base_url="${TEST_DATABASE_URL:-postgresql://127.0.0.1:55438/postgres}"
rose_test_name="rose_test_$(date +%s)_$$"
rose_test_url="${rose_base_url%/*}/${rose_test_name}"
rose_log_dir=$(mktemp -d)
psql "$rose_base_url" -v ON_ERROR_STOP=1 -c "create database ${rose_test_name}" >/dev/null
trap 'psql "$rose_base_url" -c "drop database if exists ${rose_test_name} with (force)" >/dev/null; rm -rf "$rose_log_dir"' EXIT
rose_migration_args=()
for rose_migration in supabase/migrations/*.sql; do rose_migration_args+=(-f "$rose_migration"); done
psql "$rose_test_url" -v ON_ERROR_STOP=1 -f tests/db/bootstrap.sql "${rose_migration_args[@]}" -f supabase/seed.sql -f tests/db/assertions.sql > "$rose_log_dir/assertions.log" 2>&1 || { cat "$rose_log_dir/assertions.log"; exit 1; }
# Race two independent transactions against the same capacity unit.
psql "$rose_test_url" -v ON_ERROR_STOP=1 -c "begin; select transition_booking('10000000-0000-4000-8000-000000000003',(select id from bookings where idempotency_key='20000000-0000-4000-8000-000000000003'),1,'confirm'); select pg_sleep(1); commit;" > "$rose_log_dir/one.log" 2>&1 &
rose_pid_one=$!
psql "$rose_test_url" -v ON_ERROR_STOP=1 -c "begin; select transition_booking('10000000-0000-4000-8000-000000000003',(select id from bookings where idempotency_key='20000000-0000-4000-8000-000000000004'),1,'confirm'); select pg_sleep(1); commit;" > "$rose_log_dir/two.log" 2>&1 &
rose_pid_two=$!
rose_one=0; rose_two=0
wait "$rose_pid_one" || rose_one=$?
wait "$rose_pid_two" || rose_two=$?
if [ "$rose_one" -eq 0 ] && [ "$rose_two" -eq 0 ]; then echo 'FAIL: both conflicting confirmations succeeded'; exit 1; fi
if [ "$rose_one" -ne 0 ] && [ "$rose_two" -ne 0 ]; then cat "$rose_log_dir/one.log" "$rose_log_dir/two.log"; exit 1; fi
rg -q CAPACITY_CONFLICT "$rose_log_dir" || { cat "$rose_log_dir/one.log" "$rose_log_dir/two.log"; exit 1; }
psql "$rose_test_url" -v ON_ERROR_STOP=1 -c "select test_assert((select count(*) from bookings where idempotency_key in ('20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004') and status='confirmed')=1,'Exactly one competing confirmation wins');" >/dev/null
echo 'PASS: schema, RLS, ownership, staff permissions, duplicate protection, quote versions, transitions, proposals and concurrent capacity conflict.'
