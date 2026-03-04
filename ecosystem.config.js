// PM2 Ecosystem Configuration
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'leilao-api',
      script: './backend/src/server.js',
      cwd: __dirname,
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Logging
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/leilao-imoveis.git',
      path: '/var/www/leilao-imoveis',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server-ip'],
      ref: 'origin/develop',
      repo: 'git@github.com:seu-usuario/leilao-imoveis.git',
      path: '/var/www/leilao-imoveis-staging',
      'post-deploy': 'cd backend && npm install && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
