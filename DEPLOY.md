# Guia de Deploy - Leilão Imóveis

Este guia cobre duas opções de deploy: **VPS tradicional** e **Docker**.

---

## Requisitos do Servidor

### Mínimo Recomendado
- **CPU:** 2 vCPUs
- **RAM:** 4GB
- **Disco:** 40GB SSD
- **OS:** Ubuntu 22.04 LTS

### Provedores Sugeridos
- **DigitalOcean:** $24/mês (Droplet 2GB)
- **Contabo:** €6/mês (VPS S)
- **Hostinger:** R$30/mês (VPS 1)
- **AWS Lightsail:** $20/mês

---

## Opção 1: Deploy com Docker (Recomendado)

### 1.1 Instalar Docker no Servidor

```bash
# Conectar no servidor
ssh root@seu-servidor-ip

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Adicionar usuário ao grupo docker
usermod -aG docker $USER
```

### 1.2 Clonar o Projeto

```bash
# Criar diretório
mkdir -p /var/www
cd /var/www

# Clonar repositório
git clone https://github.com/seu-usuario/leilao-imoveis.git
cd leilao-imoveis
```

### 1.3 Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
cat > .env << 'EOF'
# Database
DB_USER=leilao_user
DB_PASSWORD=SenhaSegura123!
DB_NAME=leilao_imoveis

# JWT
JWT_SECRET=sua-chave-jwt-super-secreta-aqui
JWT_EXPIRES_IN=7d

# URLs
FRONTEND_URL=https://seusite.com.br
SITE_URL=https://seusite.com.br

# reCAPTCHA (opcional)
RECAPTCHA_SECRET_KEY=sua-chave-recaptcha

# Scheduler
ENABLE_SCHEDULER=true
EOF
```

### 1.4 Build e Start

```bash
# Build das imagens
docker compose build

# Iniciar em background
docker compose up -d

# Ver logs
docker compose logs -f

# Verificar status
docker compose ps
```

### 1.5 Configurar SSL com Let's Encrypt

```bash
# Instalar certbot
apt install certbot -y

# Parar nginx temporariamente
docker compose stop nginx

# Gerar certificado
certbot certonly --standalone -d seusite.com.br -d www.seusite.com.br

# Reiniciar nginx
docker compose up -d nginx

# Configurar renovação automática
echo "0 0 * * * certbot renew --quiet && docker compose restart nginx" | crontab -
```

---

## Opção 2: Deploy Tradicional (VPS)

### 2.1 Preparar o Servidor

```bash
# Conectar no servidor
ssh root@seu-servidor-ip

# Criar usuário de deploy
adduser deploy
usermod -aG sudo deploy

# Configurar SSH key (no seu computador local)
ssh-copy-id deploy@seu-servidor-ip

# Trocar para usuário deploy
su - deploy
```

### 2.2 Instalar Dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2
sudo npm install -g pm2

# Instalar Git
sudo apt install -y git
```

### 2.3 Configurar PostgreSQL

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar usuário e banco
CREATE USER leilao_user WITH PASSWORD 'SenhaSegura123!';
CREATE DATABASE leilao_imoveis OWNER leilao_user;
GRANT ALL PRIVILEGES ON DATABASE leilao_imoveis TO leilao_user;
\q
```

### 2.4 Clonar e Configurar o Projeto

```bash
# Criar diretório
sudo mkdir -p /var/www/leilao-imoveis
sudo chown deploy:deploy /var/www/leilao-imoveis

# Clonar
cd /var/www
git clone https://github.com/seu-usuario/leilao-imoveis.git
cd leilao-imoveis

# Configurar backend
cd backend
cp .env.example .env
nano .env  # Editar com suas configurações

# Instalar dependências
npm install

# Rodar migrations
npx prisma migrate deploy
npx prisma generate

# Configurar frontend
cd ../frontend
cp .env.example .env
nano .env  # Editar com suas configurações

# Build frontend
npm install
npm run build
```

### 2.5 Configurar PM2

```bash
cd /var/www/leilao-imoveis

# Criar diretório de logs
mkdir -p logs

# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Configurar startup automático
pm2 startup
# Execute o comando que aparecer
```

### 2.6 Configurar Nginx

```bash
# Copiar configuração
sudo cp deploy/nginx.conf /etc/nginx/sites-available/leilao-imoveis

# Editar domínio
sudo nano /etc/nginx/sites-available/leilao-imoveis
# Alterar "seusite.com.br" para seu domínio

# Ativar site
sudo ln -s /etc/nginx/sites-available/leilao-imoveis /etc/nginx/sites-enabled/

# Remover default
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 2.7 Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado
sudo certbot --nginx -d seusite.com.br -d www.seusite.com.br

# Renovação automática (já configurado pelo certbot)
sudo systemctl status certbot.timer
```

### 2.8 Configurar Backup Automático

```bash
# Dar permissão ao script
chmod +x /var/www/leilao-imoveis/deploy/backup.sh

# Criar diretório de backup
sudo mkdir -p /var/backups/leilao-imoveis
sudo chown deploy:deploy /var/backups/leilao-imoveis

# Adicionar ao crontab (backup diário às 2h)
crontab -e
# Adicionar linha:
0 2 * * * /var/www/leilao-imoveis/deploy/backup.sh >> /var/log/backup.log 2>&1
```

---

## Configurar Domínio

### DNS Records (no seu registrador)

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | IP-DO-SERVIDOR | 3600 |
| A | www | IP-DO-SERVIDOR | 3600 |
| CNAME | api | seusite.com.br | 3600 |

---

## Variáveis de Ambiente - Produção

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://leilao_user:SenhaSegura123!@localhost:5432/leilao_imoveis?schema=public"

# JWT (gere uma chave segura: openssl rand -base64 64)
JWT_SECRET="sua-chave-muito-segura-aqui"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=production

# URLs
FRONTEND_URL="https://seusite.com.br"
SITE_URL="https://seusite.com.br"

# reCAPTCHA
RECAPTCHA_SECRET_KEY="sua-chave-secreta"

# Scheduler
ENABLE_SCHEDULER=true
```

### Frontend (.env)

```env
VITE_API_URL=https://seusite.com.br/api
VITE_RECAPTCHA_SITE_KEY=sua-chave-site
VITE_SITE_URL=https://seusite.com.br
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

---

## Comandos Úteis

### PM2
```bash
pm2 status              # Ver status
pm2 logs                # Ver logs
pm2 restart all         # Reiniciar
pm2 reload all          # Reload sem downtime
pm2 monit               # Monitor em tempo real
```

### Docker
```bash
docker compose ps       # Ver containers
docker compose logs -f  # Ver logs
docker compose restart  # Reiniciar
docker compose down     # Parar tudo
docker compose up -d    # Iniciar
```

### Nginx
```bash
sudo nginx -t                    # Testar config
sudo systemctl restart nginx     # Reiniciar
sudo tail -f /var/log/nginx/error.log  # Ver erros
```

### Database
```bash
# Backup manual
pg_dump -U leilao_user leilao_imoveis > backup.sql

# Restore
psql -U leilao_user leilao_imoveis < backup.sql
```

---

## Monitoramento

### Logs
```bash
# PM2 logs
pm2 logs leilao-api

# Nginx logs
tail -f /var/log/nginx/leilao-imoveis.access.log
tail -f /var/log/nginx/leilao-imoveis.error.log

# System logs
journalctl -u nginx -f
```

### Health Check
```bash
# Verificar API
curl https://seusite.com.br/api/health

# Verificar sitemap
curl https://seusite.com.br/sitemap.xml
```

---

## Troubleshooting

### API não inicia
```bash
# Verificar logs
pm2 logs leilao-api --lines 100

# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão com banco
psql -U leilao_user -h localhost -d leilao_imoveis
```

### Erro 502 Bad Gateway
```bash
# Verificar se API está rodando
pm2 status

# Verificar porta
netstat -tlnp | grep 3001

# Reiniciar
pm2 restart all
```

### SSL não funciona
```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Verificar Nginx
sudo nginx -t
```

---

## Checklist de Deploy

- [ ] Servidor configurado
- [ ] PostgreSQL instalado e configurado
- [ ] Node.js 20 instalado
- [ ] Código clonado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations executadas
- [ ] Frontend buildado
- [ ] PM2 configurado e iniciado
- [ ] Nginx configurado
- [ ] SSL/HTTPS configurado
- [ ] DNS apontando para servidor
- [ ] Backup automático configurado
- [ ] Health check funcionando
- [ ] reCAPTCHA configurado (opcional)
- [ ] Google Analytics configurado (opcional)

---

## Suporte

Em caso de problemas:
1. Verifique os logs (`pm2 logs`, nginx logs)
2. Verifique se todos os serviços estão rodando
3. Teste a conexão com o banco de dados
4. Verifique as variáveis de ambiente
