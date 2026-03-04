const scraper = require('../services/scraper');
const scheduler = require('../services/scheduler');
const scraperBB = require('../services/scraperBB');
const scraperMulti = require('../services/scraperMultiBancos');

// Start scraping all states
const scrapeAll = async (req, res) => {
  try {
    // Start scraping in background
    res.json({
      message: 'Scraping iniciado em background para todos os estados',
      estados: scraper.ESTADOS
    });

    // Run scraping asynchronously
    scraper.scrapeAllStates()
      .then(result => {
        console.log('Scraping completo:', result);
      })
      .catch(error => {
        console.error('Erro no scraping:', error);
      });
  } catch (error) {
    console.error('Erro ao iniciar scraping:', error);
    res.status(500).json({ error: 'Erro ao iniciar scraping' });
  }
};

// Start scraping for a single state
const scrapeState = async (req, res) => {
  const { estado } = req.params;

  if (!scraper.ESTADOS.includes(estado.toUpperCase())) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    res.json({
      message: `Scraping iniciado para ${estado.toUpperCase()}`,
      estado: estado.toUpperCase()
    });

    // Run scraping asynchronously
    scraper.scrapeState(estado.toUpperCase())
      .then(result => {
        console.log(`Scraping ${estado} completo:`, result);
      })
      .catch(error => {
        console.error(`Erro no scraping de ${estado}:`, error);
      });
  } catch (error) {
    console.error('Erro ao iniciar scraping:', error);
    res.status(500).json({ error: 'Erro ao iniciar scraping' });
  }
};

// Get scraping logs
const getLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await scraper.getScrapingLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro ao buscar logs de scraping' });
  }
};

// Get scraping stats
const getStats = async (req, res) => {
  try {
    const stats = await scraper.getScrapingStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// Get available states
const getEstados = async (req, res) => {
  res.json({
    estados: scraper.ESTADOS,
    total: scraper.ESTADOS.length
  });
};

// Get scheduler status
const getSchedulerStatus = async (req, res) => {
  try {
    const status = scheduler.getSchedulerStatus();
    res.json(status);
  } catch (error) {
    console.error('Erro ao buscar status do scheduler:', error);
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
};

// Start scheduler
const startScheduler = async (req, res) => {
  try {
    const { interval } = req.body; // interval in hours
    const intervalMs = interval ? interval * 60 * 60 * 1000 : scheduler.DEFAULT_INTERVAL;
    const result = scheduler.startScheduler(intervalMs);
    res.json(result);
  } catch (error) {
    console.error('Erro ao iniciar scheduler:', error);
    res.status(500).json({ error: 'Erro ao iniciar scheduler' });
  }
};

// Stop scheduler
const stopScheduler = async (req, res) => {
  try {
    const result = scheduler.stopScheduler();
    res.json(result);
  } catch (error) {
    console.error('Erro ao parar scheduler:', error);
    res.status(500).json({ error: 'Erro ao parar scheduler' });
  }
};

// Run a specific scheduler task
const runSchedulerTask = async (req, res) => {
  try {
    const { task } = req.params;
    const result = await scheduler.runTask(task);
    res.json({ success: true, task, result });
  } catch (error) {
    console.error('Erro ao executar tarefa:', error);
    res.status(500).json({ error: error.message });
  }
};

// Clean expired properties
const cleanupExpired = async (req, res) => {
  try {
    const result = await scheduler.cleanExpiredProperties();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Erro ao limpar expirados:', error);
    res.status(500).json({ error: 'Erro ao limpar imóveis expirados' });
  }
};

// Start scraping Banco do Brasil
const scrapeBB = async (req, res) => {
  try {
    res.json({
      message: 'Scraping do Banco do Brasil iniciado em background',
      source: 'BANCO_DO_BRASIL'
    });

    // Run scraping asynchronously
    scraperBB.scrapeBancoDoBrasil()
      .then(result => {
        console.log('Scraping BB completo:', result);
      })
      .catch(error => {
        console.error('Erro no scraping BB:', error);
      });
  } catch (error) {
    console.error('Erro ao iniciar scraping BB:', error);
    res.status(500).json({ error: 'Erro ao iniciar scraping do Banco do Brasil' });
  }
};

// Get BB stats
const getBBStats = async (req, res) => {
  try {
    const stats = await scraperBB.getBBStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas BB:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// Scrape Santander
const scrapeSantander = async (req, res) => {
  try {
    res.json({ message: 'Scraping Santander iniciado', source: 'SANTANDER' });
    scraperMulti.scrapeSantander().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Santander' });
  }
};

// Scrape Itaú
const scrapeItau = async (req, res) => {
  try {
    res.json({ message: 'Scraping Itaú iniciado', source: 'ITAU' });
    scraperMulti.scrapeItau().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Itaú' });
  }
};

// Scrape Portal Zuk
const scrapePortalZuk = async (req, res) => {
  try {
    res.json({ message: 'Scraping Portal Zuk iniciado', source: 'PORTAL_ZUK' });
    scraperMulti.scrapePortalZuk().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Portal Zuk' });
  }
};

// Scrape all banks
const scrapeAllBanks = async (req, res) => {
  try {
    res.json({ message: 'Scraping de todos os bancos iniciado' });
    scraperMulti.scrapeAllBanks().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping' });
  }
};

// Get multi-bank stats
const getMultiBankStats = async (req, res) => {
  try {
    const stats = await scraperMulti.getMultiBankStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

module.exports = {
  scrapeAll,
  scrapeState,
  getLogs,
  getStats,
  getEstados,
  getSchedulerStatus,
  startScheduler,
  stopScheduler,
  runSchedulerTask,
  cleanupExpired,
  scrapeBB,
  getBBStats,
  scrapeSantander,
  scrapeItau,
  scrapePortalZuk,
  scrapeAllBanks,
  getMultiBankStats
};
