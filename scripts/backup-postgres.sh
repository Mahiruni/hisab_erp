#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-35}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/hisab-erp-$STAMP.dump.gz.enc"
TEMP_FILE="$(mktemp "$BACKUP_DIR/.hisab-backup.XXXXXX")"
trap 'rm -f "$TEMP_FILE"' EXIT

pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" \
  | gzip -9 \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  > "$TEMP_FILE"

chmod 600 "$TEMP_FILE"
mv "$TEMP_FILE" "$FILE"
sha256sum "$FILE" > "$FILE.sha256"
chmod 600 "$FILE.sha256"

find "$BACKUP_DIR" -type f \( -name 'hisab-erp-*.dump.gz.enc' -o -name 'hisab-erp-*.dump.gz.enc.sha256' \) -mtime "+$RETENTION_DAYS" -delete

echo "Encrypted backup written to $FILE"
echo "Checksum written to $FILE.sha256"
