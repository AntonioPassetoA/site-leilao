#!/bin/bash

# =============================================================================
# Deploy Script for Leilão Imóveis
# =============================================================================
# Usage: ./deploy.sh [environment]
# Environments: production, staging
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="leilao-imoveis"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
ENVIRONMENT="${1:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as correct user
check_user() {
    if [ "$EUID" -eq 0 ]; then
        log_error "Please don't run as root. Run as deploy user."
        exit 1
    fi
}

# Create backup before deploy
create_backup() {
    log_info "Creating backup..."
    mkdir -p "$BACKUP_DIR"

    # Backup database
    if command -v pg_dump &> /dev/null; then
        pg_dump -h localhost -U leilao_user leilao_imoveis > "$BACKUP_DIR/db_$TIMESTAMP.sql"
        log_success "Database backup created"
    fi

    # Backup .env files
    cp "$APP_DIR/backend/.env" "$BACKUP_DIR/backend_env_$TIMESTAMP" 2>/dev/null || true
    cp "$APP_DIR/frontend/.env" "$BACKUP_DIR/frontend_env_$TIMESTAMP" 2>/dev/null || true

    log_success "Backup completed: $BACKUP_DIR"
}

# Pull latest code
pull_code() {
    log_info "Pulling latest code from git..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
    log_success "Code updated"
}

# Install backend dependencies
install_backend() {
    log_info "Installing backend dependencies..."
    cd "$APP_DIR/backend"
    npm ci --production
    log_success "Backend dependencies installed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    cd "$APP_DIR/backend"
    npx prisma migrate deploy
    npx prisma generate
    log_success "Migrations completed"
}

# Build frontend
build_frontend() {
    log_info "Building frontend..."
    cd "$APP_DIR/frontend"
    npm ci
    npm run build
    log_success "Frontend built"
}

# Restart application
restart_app() {
    log_info "Restarting application..."
    cd "$APP_DIR"

    # Check if PM2 process exists
    if pm2 describe "$APP_NAME-api" > /dev/null 2>&1; then
        pm2 reload ecosystem.config.js --env $ENVIRONMENT
    else
        pm2 start ecosystem.config.js --env $ENVIRONMENT
    fi

    pm2 save
    log_success "Application restarted"
}

# Health check
health_check() {
    log_info "Running health check..."
    sleep 5

    HEALTH_URL="http://localhost:3001/api/health"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

    if [ "$HTTP_STATUS" -eq 200 ]; then
        log_success "Health check passed!"
    else
        log_error "Health check failed! HTTP Status: $HTTP_STATUS"
        log_warning "Rolling back..."
        pm2 reload ecosystem.config.js --env $ENVIRONMENT
        exit 1
    fi
}

# Cleanup old backups (keep last 7)
cleanup_backups() {
    log_info "Cleaning up old backups..."
    cd "$BACKUP_DIR"
    ls -t db_*.sql 2>/dev/null | tail -n +8 | xargs -r rm --
    log_success "Cleanup completed"
}

# Main deploy process
main() {
    echo ""
    echo "=============================================="
    echo "  Deploying $APP_NAME to $ENVIRONMENT"
    echo "=============================================="
    echo ""

    check_user
    create_backup
    pull_code
    install_backend
    run_migrations
    build_frontend
    restart_app
    health_check
    cleanup_backups

    echo ""
    log_success "Deploy completed successfully!"
    echo ""
    echo "Application Status:"
    pm2 status
}

# Run main function
main
