#!/bin/bash

# =============================================================================
# Server Setup Script for Leilão Imóveis
# =============================================================================
# Run as root: sudo bash setup-server.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo bash setup-server.sh"
    exit 1
fi

echo ""
echo "=============================================="
echo "  Leilão Imóveis - Server Setup"
echo "=============================================="
echo ""

# =============================================================================
# System Update
# =============================================================================
log_info "Updating system packages..."
apt update && apt upgrade -y
log_success "System updated"

# =============================================================================
# Install Essential Tools
# =============================================================================
log_info "Installing essential tools..."
apt install -y curl wget git htop ufw fail2ban

# =============================================================================
# Configure Firewall
# =============================================================================
log_info "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
log_success "Firewall configured"

# =============================================================================
# Configure Fail2ban
# =============================================================================
log_info "Configuring Fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban
log_success "Fail2ban configured"

# =============================================================================
# Create Deploy User
# =============================================================================
log_info "Creating deploy user..."
if id "deploy" &>/dev/null; then
    log_warning "User 'deploy' already exists"
else
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy
    log_success "User 'deploy' created"
fi

# =============================================================================
# Install Node.js 20
# =============================================================================
log_info "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
log_success "Node.js $(node -v) installed"

# =============================================================================
# Install PM2
# =============================================================================
log_info "Installing PM2..."
npm install -g pm2
pm2 startup systemd -u deploy --hp /home/deploy
log_success "PM2 installed"

# =============================================================================
# Install PostgreSQL
# =============================================================================
log_info "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
log_success "PostgreSQL installed"

# =============================================================================
# Install Nginx
# =============================================================================
log_info "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log_success "Nginx installed"

# =============================================================================
# Install Certbot
# =============================================================================
log_info "Installing Certbot..."
apt install -y certbot python3-certbot-nginx
log_success "Certbot installed"

# =============================================================================
# Create Application Directories
# =============================================================================
log_info "Creating application directories..."
mkdir -p /var/www/leilao-imoveis
mkdir -p /var/backups/leilao-imoveis
mkdir -p /var/log/leilao-imoveis
chown -R deploy:deploy /var/www/leilao-imoveis
chown -R deploy:deploy /var/backups/leilao-imoveis
chown -R deploy:deploy /var/log/leilao-imoveis
log_success "Directories created"

# =============================================================================
# Configure PostgreSQL
# =============================================================================
log_info "Configuring PostgreSQL..."
read -p "Enter database password for leilao_user: " DB_PASSWORD
sudo -u postgres psql -c "CREATE USER leilao_user WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE leilao_imoveis OWNER leilao_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE leilao_imoveis TO leilao_user;"
log_success "PostgreSQL configured"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "Installed:"
echo "  - Node.js $(node -v)"
echo "  - PM2 $(pm2 -v)"
echo "  - PostgreSQL $(psql --version | head -1)"
echo "  - Nginx $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "  - Certbot"
echo ""
echo "Created:"
echo "  - User: deploy"
echo "  - Directory: /var/www/leilao-imoveis"
echo "  - Database: leilao_imoveis"
echo "  - DB User: leilao_user"
echo ""
echo "Next Steps:"
echo "  1. Copy your SSH key: ssh-copy-id deploy@$(hostname -I | awk '{print $1}')"
echo "  2. Login as deploy: ssh deploy@$(hostname -I | awk '{print $1}')"
echo "  3. Clone repository: cd /var/www && git clone <your-repo>"
echo "  4. Follow DEPLOY.md for remaining steps"
echo ""
log_success "Server is ready for deployment!"
