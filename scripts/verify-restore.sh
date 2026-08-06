#!/usr/bin/env bash
set -euo pipefail

: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"
: "${ALLOW_RESTORE_TEST:?Set ALLOW_RESTORE_TEST=ISOLATED_TEST_DATABASE}"

if [[ "$ALLOW_RESTORE_TEST" != "ISOLATED_TEST_DATABASE" ]]; then
  echo "Refusing restore: ALLOW_RESTORE_TEST must equal ISOLATED_TEST_DATABASE" >&2
  exit 2
fi
if [[ -n "${DATABASE_URL:-}" && "$RESTORE_DATABASE_URL" == "${DATABASE_URL:-}" ]]; then
  echo "Refusing restore: restore target matches the source database" >&2
  exit 2
fi

TEMP_DUMP="$(mktemp)"
trap 'rm -f "$TEMP_DUMP"' EXIT

sha256sum --check "$BACKUP_FILE.sha256"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_PASSPHRASE -in "$BACKUP_FILE" \
  | gzip -d > "$TEMP_DUMP"

pg_restore --clean --if-exists --no-owner --no-acl --dbname "$RESTORE_DATABASE_URL" "$TEMP_DUMP"

psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
select case when count(*)=0 then true else false end as no_unbalanced_posted_journals
from (
  select je.id
  from public.journal_entries je
  join public.journal_lines jl on jl.journal_entry_id=je.id
  where je.status='posted'
  group by je.id
  having round(sum(jl.debit),2)<>round(sum(jl.credit),2)
) invalid;
select count(*) as organizations_restored from public.organizations;
select count(*) as audit_events_restored from public.audit_events;
select count(*) as public_tables_without_rls
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;
SQL

echo "Restore drill completed against the explicitly isolated target. Record the result in /security."
