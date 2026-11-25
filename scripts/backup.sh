#!/usr/bin/env bash
# Runs on an ephemeral trusted runner; never print environment values or database content.
set -euo pipefail
umask 077
: "${CLOUDFLARE_API_TOKEN:?}" "${CLOUDFLARE_ACCOUNT_ID:?}" "${R2_ENDPOINT:?}" "${R2_ACCESS_KEY_ID:?}" "${R2_SECRET_ACCESS_KEY:?}" "${BACKUP_REPOSITORY:?}" "${BACKUP_ACCESS_KEY_ID:?}" "${BACKUP_SECRET_ACCESS_KEY:?}" "${RESTIC_PASSWORD:?}"
case "$R2_ENDPOINT" in https://*.r2.cloudflarestorage.com) ;; *) echo 'Endpoint R2 inválido.' >&2; exit 1;; esac
case "$BACKUP_REPOSITORY" in *'@'*|s3:https://*.r2.cloudflarestorage.com/*|s3:http://*|*localhost*|*127.0.0.1*) echo 'Destino de backup inválido ou não independente.' >&2; exit 1;; s3:https://*/*) ;; *) echo 'Configure um repositório S3 HTTPS independente.' >&2; exit 1;; esac
workdir=$(mktemp -d)
trap 'rm -rf -- "$workdir"' EXIT
mkdir -p "$workdir/photos"
npx --no-install wrangler d1 export azmora-inventario --remote --output "$workdir/database.sql"
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" aws s3 sync s3://azmora-fotos "$workdir/photos" --endpoint-url "$R2_ENDPOINT" --no-progress --only-show-errors
python3 scripts/backup_verify.py "$workdir/database.sql" "$workdir/photos"
export RESTIC_REPOSITORY="$BACKUP_REPOSITORY" AWS_ACCESS_KEY_ID="$BACKUP_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$BACKUP_SECRET_ACCESS_KEY"
restic backup --quiet --host azmora --tag daily "$workdir/database.sql" "$workdir/photos"
restic check --quiet --read-data
# Pruning permanently deletes snapshots; it is explicitly opt-in after recovery testing.
if [ "${BACKUP_ALLOW_PRUNE:-0}" = 1 ]; then
  restic forget --host azmora --tag daily --group-by host,tags --keep-daily 30 --keep-monthly 12 --prune
  restic check --quiet
fi
echo 'Backup e verificação estrutural concluídos.'
