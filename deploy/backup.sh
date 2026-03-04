#!/bin/bash

# =============================================================================
# Backup Script for Leilão Imóveis
# =============================================================================
# Usage: ./backup.sh
# Add to crontab: 0 2 * * * /var/www/leilao-imoveis/deploy/backup.sh
# =============================================================================

set -e

# Configuration
APP_NAME="leilao-imoveis"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Database configuration (from environment or defaults)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-leilao_imoveis}"
DB_USER="${DB_USER:-leilao_user}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"

# Determine backup type
DAY_OF_WEEK=$(date +%u)
DAY_OF_MONTH=$(date +%d)

if [ "$DAY_OF_MONTH" == "01" ]; then
    BACKUP_TYPE="monthly"
elif [ "$DAY_OF_WEEK" == "7" ]; then
    BACKUP_TYPE="weekly"
else
    BACKUP_TYPE="daily"
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_TYPE"

log "Starting $BACKUP_TYPE backup..."

# =============================================================================
# Database Backup
# =============================================================================
log "Backing up database..."

DB_BACKUP_FILE="$BACKUP_PATH/db_${TIMESTAMP}.sql.gz"

PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    | gzip > "$DB_BACKUP_FILE"

if [ -f "$DB_BACKUP_FILE" ]; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    log "${GREEN}Database backup completed: $DB_BACKUP_FILE ($DB_SIZE)${NC}"
else
    log "${RED}Database backup failed!${NC}"
    exit 1
fi

# =============================================================================
# Uploads Backup
# =============================================================================
log "Backing up uploads..."

UPLOADS_BACKUP_FILE="$BACKUP_PATH/uploads_${TIMESTAMP}.tar.gz"

if [ -d "$APP_DIR/backend/uploads" ]; then
    tar -czf "$UPLOADS_BACKUP_FILE" -C "$APP_DIR/backend" uploads 2>/dev/null || true
    UPLOADS_SIZE=$(du -h "$UPLOADS_BACKUP_FILE" | cut -f1)
    log "${GREEN}Uploads backup completed: $UPLOADS_BACKUP_FILE ($UPLOADS_SIZE)${NC}"
else
    log "No uploads directory found, skipping..."
fi

# =============================================================================
# Environment Files Backup
# =============================================================================
log "Backing up environment files..."

ENV_BACKUP_FILE="$BACKUP_PATH/env_${TIMESTAMP}.tar.gz"

tar -czf "$ENV_BACKUP_FILE" \
    -C "$APP_DIR" \
    backend/.env \
    frontend/.env \
    2>/dev/null || true

log "${GREEN}Environment backup completed${NC}"

# =============================================================================
# Cleanup Old Backups
# =============================================================================
log "Cleaning up old backups..."

# Daily: keep 7 days
find "$BACKUP_DIR/daily" -type f -mtime +7 -delete 2>/dev/null || true

# Weekly: keep 4 weeks
find "$BACKUP_DIR/weekly" -type f -mtime +28 -delete 2>/dev/null || true

# Monthly: keep 12 months
find "$BACKUP_DIR/monthly" -type f -mtime +365 -delete 2>/dev/null || true

log "${GREEN}Cleanup completed${NC}"

# =============================================================================
# Summary
# =============================================================================
log "=============================================="
log "Backup Summary"
log "=============================================="
log "Type: $BACKUP_TYPE"
log "Database: $DB_BACKUP_FILE"
log "Uploads: $UPLOADS_BACKUP_FILE"
log "Environment: $ENV_BACKUP_FILE"
log "=============================================="

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
log "Total backup size: $TOTAL_SIZE"

# =============================================================================
# Optional: Upload to S3 or remote storage
# =============================================================================
# Uncomment and configure if using AWS S3
#
# if command -v aws &> /dev/null; then
#     log "Uploading to S3..."
#     aws s3 cp "$DB_BACKUP_FILE" "s3://your-bucket/backups/$BACKUP_TYPE/"
#     aws s3 cp "$UPLOADS_BACKUP_FILE" "s3://your-bucket/backups/$BACKUP_TYPE/"
#     log "S3 upload completed"
# fi

log "${GREEN}Backup completed successfully!${NC}"
