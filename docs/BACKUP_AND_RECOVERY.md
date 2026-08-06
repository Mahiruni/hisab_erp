# Backup and recovery

Hisab ERP must not rely on browser storage or the production Supabase project as its only copy of business records.

## Active controls

1. `scripts/backup-postgres.sh` creates a PostgreSQL custom-format dump, compresses it, encrypts it with AES-256-CBC/PBKDF2, writes a SHA-256 checksum and removes files older than the configured retention period.
2. `.github/workflows/production-backup.yml` can run the encrypted backup daily and retain the encrypted artifact in GitHub Actions when the required repository secrets exist.
3. `scripts/verify-restore.sh` refuses to restore unless the target is explicitly marked as an isolated test database and differs from the source database.
4. The `/security` control center records backup checksums, encrypted-storage references and restore-test evidence in the immutable authentication audit stream.
5. PostgreSQL runs a daily health check at 02:15 UTC and reports stale backup evidence or overdue restore tests.

## Required GitHub repository secrets

- `SUPABASE_DATABASE_URL`: a direct PostgreSQL connection string suitable for `pg_dump`; never use a browser/public key.
- `BACKUP_ENCRYPTION_PASSPHRASE`: a strong unique passphrase stored only as a secret.

The workflow skips the backup with a warning when either secret is absent, rather than exposing or inventing credentials.

## Manual encrypted backup

```bash
DATABASE_URL='postgresql://...' \
BACKUP_ENCRYPTION_PASSPHRASE='strong-secret-from-a-vault' \
BACKUP_DIR='./backups' \
BACKUP_RETENTION_DAYS=35 \
./scripts/backup-postgres.sh
```

## Isolated restore drill

```bash
RESTORE_DATABASE_URL='postgresql://isolated-test-database/...' \
DATABASE_URL='postgresql://production-source/...' \
BACKUP_FILE='./backups/hisab-erp-YYYYMMDDTHHMMSSZ.dump.gz.enc' \
BACKUP_ENCRYPTION_PASSPHRASE='strong-secret-from-a-vault' \
ALLOW_RESTORE_TEST='ISOLATED_TEST_DATABASE' \
./scripts/verify-restore.sh
```

The restore script verifies the backup checksum, decrypts and restores it, then checks organization and audit counts, posted-journal balance and RLS coverage. Record the outcome in `/security`.

## Retention and platform recovery

- Target at least 35 days of daily encrypted backups.
- Keep monthly and annual financial snapshots according to the company’s legal retention policy.
- Test restoration at least quarterly and after material schema changes.
- The connected Supabase project is currently on the Free plan, so point-in-time recovery is not marked ready. Upgrade the project and enable PITR before treating it as an active production control.

Never commit database URLs, passphrases, decrypted dumps or backup archives to GitHub.
