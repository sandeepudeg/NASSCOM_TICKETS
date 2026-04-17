#!/bin/bash
# PostgreSQL backup script for tickets-folder feature
# Runs daily at 2 AM via cron, stores dumps in MinIO backups/ bucket, retains for 30 days

set -euo pipefail

# Configuration from environment variables
PGHOST="${PGHOST:-postgres}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-tickets_db}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-minio:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Generate timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="tickets_db_backup_${TIMESTAMP}.sql.gz"
TEMP_DIR="/tmp/postgres_backups"

# Ensure temp directory exists
mkdir -p "${TEMP_DIR}"

echo "[$(date)] Starting PostgreSQL backup: ${BACKUP_FILE}"

# Create database dump with compression
pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" \
  --format=plain \
  --no-owner \
  --no-acl \
  --verbose \
  2>&1 | gzip > "${TEMP_DIR}/${BACKUP_FILE}"

if [ ! -f "${TEMP_DIR}/${BACKUP_FILE}" ]; then
  echo "[$(date)] ERROR: Backup file not created"
  exit 1
fi

BACKUP_SIZE=$(du -h "${TEMP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Configure MinIO client
mc alias set minio "http://${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"

# Create backups bucket if it doesn't exist
mc mb --ignore-existing minio/backups

# Upload backup to MinIO
echo "[$(date)] Uploading backup to MinIO..."
mc cp "${TEMP_DIR}/${BACKUP_FILE}" "minio/backups/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup uploaded successfully to minio/backups/${BACKUP_FILE}"
else
  echo "[$(date)] ERROR: Failed to upload backup to MinIO"
  rm -f "${TEMP_DIR}/${BACKUP_FILE}"
  exit 1
fi

# Clean up local temp file
rm -f "${TEMP_DIR}/${BACKUP_FILE}"

# Remove backups older than retention period
echo "[$(date)] Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."
CUTOFF_DATE=$(date -d "${BACKUP_RETENTION_DAYS} days ago" +%Y%m%d)

mc ls minio/backups/ | while read -r line; do
  BACKUP_NAME=$(echo "${line}" | awk '{print $NF}')
  if [[ "${BACKUP_NAME}" =~ tickets_db_backup_([0-9]{8})_ ]]; then
    BACKUP_DATE="${BASH_REMATCH[1]}"
    if [ "${BACKUP_DATE}" -lt "${CUTOFF_DATE}" ]; then
      echo "[$(date)] Removing old backup: ${BACKUP_NAME}"
      mc rm "minio/backups/${BACKUP_NAME}"
    fi
  fi
done

echo "[$(date)] Backup process completed successfully"
