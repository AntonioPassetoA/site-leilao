const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Scheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = {};
    this.lastRun = {};
    this.stats = {};
  }

  // Initialize all scheduled jobs
  init() {
    console.log('[Scheduler] Initializing scheduled tasks...');

    // Clean expired properties - Every hour
    this.scheduleJob('cleanExpired', '0 * * * *', this.cleanExpiredProperties.bind(this), 'A cada hora');

    // Update property statuses - Every 30 minutes
    this.scheduleJob('updateStatus', '*/30 * * * *', this.updatePropertyStatuses.bind(this), 'A cada 30 min');

    // Run Caixa scraper - Daily at 2:00 AM
    this.scheduleJob('scrapeCaixa', '0 2 * * *', this.runCaixaScraperJob.bind(this), 'Diário às 02:00');

    // Run Banco do Brasil scraper - Daily at 3:00 AM
    this.scheduleJob('scrapeBB', '0 3 * * *', this.runBBScraperJob.bind(this), 'Diário às 03:00');

    // Run Multi-bank scrapers - Daily at 4:00 AM
    this.scheduleJob('scrapeMulti', '0 4 * * *', this.runMultiBankScraperJob.bind(this), 'Diário às 04:00');

    // Run Leiloeiros scrapers - Daily at 5:00 AM
    this.scheduleJob('scrapeLeiloeiros', '0 5 * * *', this.runLeiloeirosScraperJob.bind(this), 'Diário às 05:00');

    // Run Leiloeiros adicionais - Daily at 6:00 AM
    this.scheduleJob('scrapeLeiloeirosAdicionais', '0 6 * * *', this.runLeiloeirosAdicionaisJob.bind(this), 'Diário às 06:00');

    // Run Bancos adicionais (BRB, Banrisul) - Daily at 7:00 AM
    this.scheduleJob('scrapeBancosAdicionais', '0 7 * * *', this.runBancosAdicionaisJob.bind(this), 'Diário às 07:00');

    // Run Governamentais (EMGEA, Receita) - Daily at 8:00 AM
    this.scheduleJob('scrapeGovernamentais', '0 8 * * *', this.runGovernamentaisJob.bind(this), 'Diário às 08:00');

    // Log scheduler stats - Every 6 hours
    this.scheduleJob('logStats', '0 */6 * * *', this.logStats.bind(this), 'A cada 6 horas');

    console.log('[Scheduler] All tasks scheduled successfully');
    this.logNextExecutions();
  }

  scheduleJob(name, cronExpression, task, description) {
    const job = cron.schedule(cronExpression, async () => {
      if (this.isRunning[name]) {
        console.log(`[Scheduler] Task "${name}" is already running, skipping...`);
        return;
      }

      this.isRunning[name] = true;
      const startTime = Date.now();
      console.log(`[Scheduler] Starting task "${name}"...`);

      try {
        const result = await task();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        this.lastRun[name] = new Date();
        this.stats[name] = { success: true, duration, result, timestamp: new Date() };
        console.log(`[Scheduler] Task "${name}" completed in ${duration}s`);
      } catch (error) {
        console.error(`[Scheduler] Task "${name}" failed:`, error.message);
        this.stats[name] = { success: false, error: error.message, timestamp: new Date() };
      } finally {
        this.isRunning[name] = false;
      }
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.push({ name, job, cronExpression, description });
  }

  logNextExecutions() {
    console.log('\n[Scheduler] Tarefas agendadas:');
    console.log('─'.repeat(60));
    this.jobs.forEach(({ name, description }) => {
      console.log(`  • ${name}: ${description}`);
    });
    console.log('─'.repeat(60) + '\n');
  }

  // Clean expired properties (auction ended)
  async cleanExpiredProperties() {
    const now = new Date();

    // Mark properties with ended auctions as CANCELLED
    const updated = await prisma.property.updateMany({
      where: {
        auctionEnd: { lt: now },
        status: { notIn: ['CANCELLED', 'SOLD'] }
      },
      data: { status: 'CANCELLED' }
    });

    if (updated.count > 0) {
      console.log(`[Scheduler] Marked ${updated.count} expired properties as CANCELLED`);
    }

    // Delete very old cancelled properties (> 30 days old)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.property.deleteMany({
      where: {
        status: 'CANCELLED',
        auctionEnd: { lt: thirtyDaysAgo }
      }
    });

    if (deleted.count > 0) {
      console.log(`[Scheduler] Deleted ${deleted.count} old cancelled properties (>30 days)`);
    }

    return { marked: updated.count, deleted: deleted.count };
  }

  // Update property statuses based on auction dates
  async updatePropertyStatuses() {
    const now = new Date();

    // Activate pending properties whose auction has started
    const activated = await prisma.property.updateMany({
      where: {
        status: 'PENDING',
        auctionStart: { lte: now },
        auctionEnd: { gt: now }
      },
      data: { status: 'ACTIVE' }
    });

    if (activated.count > 0) {
      console.log(`[Scheduler] Activated ${activated.count} properties`);
    }

    return { activated: activated.count };
  }

  // Run Caixa scraper
  async runCaixaScraperJob() {
    console.log('[Scheduler] Running Caixa scraper...');
    let totalImported = 0;

    try {
      const { runCaixaScraper } = require('./scraperCaixa');
      // Run for main states
      const states = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'DF', 'PE', 'CE'];

      for (const state of states) {
        try {
          console.log(`[Scheduler] Scraping Caixa - ${state}...`);
          const result = await runCaixaScraper(state);
          totalImported += result?.imported || 0;
        } catch (err) {
          console.error(`[Scheduler] Caixa scraper failed for ${state}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Caixa scraper job failed:', error.message);
    }

    return { totalImported };
  }

  // Run Banco do Brasil scraper
  async runBBScraperJob() {
    console.log('[Scheduler] Running BB scraper...');
    try {
      const { runBBScraper } = require('./scraperBB');
      const result = await runBBScraper();
      return result;
    } catch (error) {
      console.error('[Scheduler] BB scraper job failed:', error.message);
      return { error: error.message };
    }
  }

  // Run multi-bank scrapers (Santander, Itaú, etc.)
  async runMultiBankScraperJob() {
    console.log('[Scheduler] Running multi-bank scrapers...');
    const results = {};

    try {
      const { runMultiBankScraper } = require('./scraperMultiBancos');
      const banks = ['santander', 'itau', 'zuk'];

      for (const bank of banks) {
        try {
          console.log(`[Scheduler] Scraping ${bank}...`);
          const result = await runMultiBankScraper(bank);
          results[bank] = result;
        } catch (error) {
          console.error(`[Scheduler] ${bank} scraper failed:`, error.message);
          results[bank] = { error: error.message };
        }
      }
    } catch (error) {
      console.error('[Scheduler] Multi-bank scraper job failed:', error.message);
    }

    return results;
  }

  // Run leiloeiros scrapers (Bradesco, Sold, Mega Leilões, etc.)
  async runLeiloeirosScraperJob() {
    console.log('[Scheduler] Running leiloeiros scrapers...');
    const results = {};

    try {
      const scraperLeiloeiros = require('./scraperLeiloeiros');
      const leiloeiros = [
        { name: 'bradesco', fn: scraperLeiloeiros.scrapeBradesco },
        { name: 'sold', fn: scraperLeiloeiros.scrapeSold },
        { name: 'megaLeiloes', fn: scraperLeiloeiros.scrapeMegaLeiloes },
        { name: 'lanceNoLeilao', fn: scraperLeiloeiros.scrapeLanceNoLeilao },
        { name: 'superbid', fn: scraperLeiloeiros.scrapeSuperbid }
      ];

      for (const leiloeiro of leiloeiros) {
        try {
          console.log(`[Scheduler] Scraping ${leiloeiro.name}...`);
          const result = await leiloeiro.fn();
          results[leiloeiro.name] = result;
        } catch (error) {
          console.error(`[Scheduler] ${leiloeiro.name} scraper failed:`, error.message);
          results[leiloeiro.name] = { error: error.message };
        }
      }
    } catch (error) {
      console.error('[Scheduler] Leiloeiros scraper job failed:', error.message);
    }

    return results;
  }

  // Run leiloeiros adicionais scrapers
  async runLeiloeirosAdicionaisJob() {
    console.log('[Scheduler] Running leiloeiros adicionais scrapers...');
    const results = {};

    try {
      const scraperLeiloeiros = require('./scraperLeiloeiros');
      const leiloeiros = [
        { name: 'biasi', fn: scraperLeiloeiros.scrapeBiasi },
        { name: 'frazao', fn: scraperLeiloeiros.scrapeFrazao },
        { name: 'vipLeiloes', fn: scraperLeiloeiros.scrapeVipLeiloes },
        { name: 'pestana', fn: scraperLeiloeiros.scrapePestana },
        { name: 'kronberg', fn: scraperLeiloeiros.scrapeKronberg },
        { name: 'sato', fn: scraperLeiloeiros.scrapeSato },
        { name: 'lut', fn: scraperLeiloeiros.scrapeLut },
        { name: 'sodreSantoro', fn: scraperLeiloeiros.scrapeSodreSantoro },
        { name: 'zukerman', fn: scraperLeiloeiros.scrapeZukerman },
        { name: 'brado', fn: scraperLeiloeiros.scrapeBrado },
        { name: 'freitag', fn: scraperLeiloeiros.scrapeFreitag }
      ];

      for (const leiloeiro of leiloeiros) {
        try {
          console.log(`[Scheduler] Scraping ${leiloeiro.name}...`);
          const result = await leiloeiro.fn();
          results[leiloeiro.name] = result;
        } catch (error) {
          console.error(`[Scheduler] ${leiloeiro.name} scraper failed:`, error.message);
          results[leiloeiro.name] = { error: error.message };
        }
      }
    } catch (error) {
      console.error('[Scheduler] Leiloeiros adicionais scraper job failed:', error.message);
    }

    return results;
  }

  // Run bancos adicionais scrapers (BRB, Banrisul)
  async runBancosAdicionaisJob() {
    console.log('[Scheduler] Running bancos adicionais scrapers...');
    const results = {};

    try {
      const scraperLeiloeiros = require('./scraperLeiloeiros');
      const bancos = [
        { name: 'brb', fn: scraperLeiloeiros.scrapeBRB },
        { name: 'banrisul', fn: scraperLeiloeiros.scrapeBanrisul }
      ];

      for (const banco of bancos) {
        try {
          console.log(`[Scheduler] Scraping ${banco.name}...`);
          const result = await banco.fn();
          results[banco.name] = result;
        } catch (error) {
          console.error(`[Scheduler] ${banco.name} scraper failed:`, error.message);
          results[banco.name] = { error: error.message };
        }
      }
    } catch (error) {
      console.error('[Scheduler] Bancos adicionais scraper job failed:', error.message);
    }

    return results;
  }

  // Run governamentais scrapers (EMGEA, Receita Federal)
  async runGovernamentaisJob() {
    console.log('[Scheduler] Running governamentais scrapers...');
    const results = {};

    try {
      const scraperLeiloeiros = require('./scraperLeiloeiros');
      const fontes = [
        { name: 'emgea', fn: scraperLeiloeiros.scrapeEmgea },
        { name: 'receitaFederal', fn: scraperLeiloeiros.scrapeReceitaFederal }
      ];

      for (const fonte of fontes) {
        try {
          console.log(`[Scheduler] Scraping ${fonte.name}...`);
          const result = await fonte.fn();
          results[fonte.name] = result;
        } catch (error) {
          console.error(`[Scheduler] ${fonte.name} scraper failed:`, error.message);
          results[fonte.name] = { error: error.message };
        }
      }
    } catch (error) {
      console.error('[Scheduler] Governamentais scraper job failed:', error.message);
    }

    return results;
  }

  // Log database statistics
  async logStats() {
    const [total, active, pending, cancelled, byBank, leads, recentLeads] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: 'ACTIVE' } }),
      prisma.property.count({ where: { status: 'PENDING' } }),
      prisma.property.count({ where: { status: 'CANCELLED' } }),
      prisma.property.groupBy({
        by: ['bank'],
        _count: { id: true },
        where: { status: { in: ['ACTIVE', 'PENDING'] } }
      }),
      prisma.lead.count(),
      prisma.lead.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      })
    ]);

    const stats = {
      properties: { total, active, pending, cancelled },
      byBank: byBank.reduce((acc, b) => { acc[b.bank || 'Outros'] = b._count.id; return acc; }, {}),
      leads: { total: leads, last24h: recentLeads }
    };

    console.log('\n[Scheduler] ═══════════════════════════════════════');
    console.log('[Scheduler] ESTATÍSTICAS DO SISTEMA');
    console.log('[Scheduler] ═══════════════════════════════════════');
    console.log(`[Scheduler] Imóveis: ${total} total | ${active} ativos | ${pending} pendentes | ${cancelled} encerrados`);
    console.log(`[Scheduler] Leads: ${leads} total | ${recentLeads} últimas 24h`);
    console.log('[Scheduler] Por banco:');
    Object.entries(stats.byBank).forEach(([bank, count]) => {
      console.log(`[Scheduler]   • ${bank}: ${count}`);
    });
    console.log('[Scheduler] ═══════════════════════════════════════\n');

    return stats;
  }

  // Manual trigger for any task
  async runTask(taskName) {
    const tasks = {
      cleanExpired: this.cleanExpiredProperties.bind(this),
      updateStatus: this.updatePropertyStatuses.bind(this),
      scrapeCaixa: this.runCaixaScraperJob.bind(this),
      scrapeBB: this.runBBScraperJob.bind(this),
      scrapeMulti: this.runMultiBankScraperJob.bind(this),
      scrapeLeiloeiros: this.runLeiloeirosScraperJob.bind(this),
      scrapeLeiloeirosAdicionais: this.runLeiloeirosAdicionaisJob.bind(this),
      scrapeBancosAdicionais: this.runBancosAdicionaisJob.bind(this),
      scrapeGovernamentais: this.runGovernamentaisJob.bind(this),
      logStats: this.logStats.bind(this)
    };

    if (!tasks[taskName]) {
      throw new Error(`Unknown task: ${taskName}. Available: ${Object.keys(tasks).join(', ')}`);
    }

    if (this.isRunning[taskName]) {
      throw new Error(`Task "${taskName}" is already running`);
    }

    this.isRunning[taskName] = true;
    try {
      const result = await tasks[taskName]();
      this.lastRun[taskName] = new Date();
      return result;
    } finally {
      this.isRunning[taskName] = false;
    }
  }

  // Get status of all jobs
  getStatus() {
    return {
      jobs: this.jobs.map(j => ({
        name: j.name,
        description: j.description,
        schedule: j.cronExpression,
        isRunning: this.isRunning[j.name] || false,
        lastRun: this.lastRun[j.name] || null,
        lastResult: this.stats[j.name] || null
      })),
      timezone: 'America/Sao_Paulo'
    };
  }

  // Stop all jobs
  stop() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`[Scheduler] Stopped task "${name}"`);
    });
  }
}

// Singleton instance
const scheduler = new Scheduler();

// Legacy exports for compatibility
module.exports = {
  scheduler,
  startScheduler: () => {
    scheduler.init();
    return { status: 'started' };
  },
  stopScheduler: () => {
    scheduler.stop();
    return { status: 'stopped' };
  },
  getSchedulerStatus: () => scheduler.getStatus(),
  runNow: (task) => scheduler.runTask(task || 'scrapeCaixa'),
  runTask: (task) => scheduler.runTask(task),
  cleanExpiredProperties: () => scheduler.cleanExpiredProperties(),
  DEFAULT_INTERVAL: 6 * 60 * 60 * 1000
};
