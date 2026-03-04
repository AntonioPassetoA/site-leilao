const scraper = require('../services/scraper');
const scheduler = require('../services/scheduler');
const scraperBB = require('../services/scraperBB');
const scraperMulti = require('../services/scraperMultiBancos');
const scraperLeiloeiros = require('../services/scraperLeiloeiros');

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

// ==================== NOVOS LEILOEIROS ====================

// Scrape Bradesco
const scrapeBradesco = async (req, res) => {
  try {
    res.json({ message: 'Scraping Bradesco iniciado', source: 'BRADESCO' });
    scraperLeiloeiros.scrapeBradesco().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Bradesco' });
  }
};

// Scrape Sold
const scrapeSold = async (req, res) => {
  try {
    res.json({ message: 'Scraping Sold Leilões iniciado', source: 'SOLD' });
    scraperLeiloeiros.scrapeSold().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Sold' });
  }
};

// Scrape Mega Leilões
const scrapeMegaLeiloes = async (req, res) => {
  try {
    res.json({ message: 'Scraping Mega Leilões iniciado', source: 'MEGA_LEILOES' });
    scraperLeiloeiros.scrapeMegaLeiloes().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Mega Leilões' });
  }
};

// Scrape Lance no Leilão
const scrapeLanceNoLeilao = async (req, res) => {
  try {
    res.json({ message: 'Scraping Lance no Leilão iniciado', source: 'LANCE_NO_LEILAO' });
    scraperLeiloeiros.scrapeLanceNoLeilao().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Lance no Leilão' });
  }
};

// Scrape Superbid
const scrapeSuperbid = async (req, res) => {
  try {
    res.json({ message: 'Scraping Superbid iniciado', source: 'SUPERBID' });
    scraperLeiloeiros.scrapeSuperbid().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Superbid' });
  }
};

// Scrape all leiloeiros
const scrapeAllLeiloeiros = async (req, res) => {
  try {
    res.json({ message: 'Scraping de todos os leiloeiros iniciado' });
    scraperLeiloeiros.scrapeAllLeiloeiros().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping dos leiloeiros' });
  }
};

// Get leiloeiros stats
const getLeiloeirosStats = async (req, res) => {
  try {
    const stats = await scraperLeiloeiros.getLeiloeirosStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas dos leiloeiros' });
  }
};

// ==================== LEILOEIROS ADICIONAIS ====================

// Scrape Biasi
const scrapeBiasi = async (req, res) => {
  try {
    res.json({ message: 'Scraping Biasi Leilões iniciado', source: 'BIASI' });
    scraperLeiloeiros.scrapeBiasi().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Biasi' });
  }
};

// Scrape Frazão
const scrapeFrazao = async (req, res) => {
  try {
    res.json({ message: 'Scraping Frazão Leilões iniciado', source: 'FRAZAO' });
    scraperLeiloeiros.scrapeFrazao().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Frazão' });
  }
};

// Scrape VIP Leilões
const scrapeVipLeiloes = async (req, res) => {
  try {
    res.json({ message: 'Scraping VIP Leilões iniciado', source: 'VIP_LEILOES' });
    scraperLeiloeiros.scrapeVipLeiloes().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping VIP Leilões' });
  }
};

// Scrape Pestana
const scrapePestana = async (req, res) => {
  try {
    res.json({ message: 'Scraping Pestana Leilões iniciado', source: 'PESTANA' });
    scraperLeiloeiros.scrapePestana().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Pestana' });
  }
};

// Scrape Kronberg
const scrapeKronberg = async (req, res) => {
  try {
    res.json({ message: 'Scraping Kronberg Leilões iniciado', source: 'KRONBERG' });
    scraperLeiloeiros.scrapeKronberg().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Kronberg' });
  }
};

// Scrape Sato
const scrapeSato = async (req, res) => {
  try {
    res.json({ message: 'Scraping Sato Leilões iniciado', source: 'SATO' });
    scraperLeiloeiros.scrapeSato().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Sato' });
  }
};

// Scrape Lut
const scrapeLut = async (req, res) => {
  try {
    res.json({ message: 'Scraping Lut Leilões iniciado', source: 'LUT' });
    scraperLeiloeiros.scrapeLut().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Lut' });
  }
};

// Scrape Sodré Santoro
const scrapeSodreSantoro = async (req, res) => {
  try {
    res.json({ message: 'Scraping Sodré Santoro iniciado', source: 'SODRE_SANTORO' });
    scraperLeiloeiros.scrapeSodreSantoro().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Sodré Santoro' });
  }
};

// Scrape Zukerman
const scrapeZukerman = async (req, res) => {
  try {
    res.json({ message: 'Scraping Zukerman Leilões iniciado', source: 'ZUKERMAN' });
    scraperLeiloeiros.scrapeZukerman().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Zukerman' });
  }
};

// Scrape Brado
const scrapeBrado = async (req, res) => {
  try {
    res.json({ message: 'Scraping Brado Leilões iniciado', source: 'BRADO' });
    scraperLeiloeiros.scrapeBrado().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Brado' });
  }
};

// Scrape Freitag
const scrapeFreitag = async (req, res) => {
  try {
    res.json({ message: 'Scraping Freitag Leilões iniciado', source: 'FREITAG' });
    scraperLeiloeiros.scrapeFreitag().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Freitag' });
  }
};

// ==================== BANCOS ADICIONAIS ====================

// Scrape BRB
const scrapeBRB = async (req, res) => {
  try {
    res.json({ message: 'Scraping BRB iniciado', source: 'BRB' });
    scraperLeiloeiros.scrapeBRB().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping BRB' });
  }
};

// Scrape Banrisul
const scrapeBanrisul = async (req, res) => {
  try {
    res.json({ message: 'Scraping Banrisul iniciado', source: 'BANRISUL' });
    scraperLeiloeiros.scrapeBanrisul().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Banrisul' });
  }
};

// Scrape all additional banks
const scrapeAllBancosAdicionais = async (req, res) => {
  try {
    res.json({ message: 'Scraping de bancos adicionais iniciado' });
    scraperLeiloeiros.scrapeAllBancosAdicionais().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping dos bancos adicionais' });
  }
};

// ==================== GOVERNAMENTAIS ====================

// Scrape EMGEA
const scrapeEmgea = async (req, res) => {
  try {
    res.json({ message: 'Scraping EMGEA iniciado', source: 'EMGEA' });
    scraperLeiloeiros.scrapeEmgea().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping EMGEA' });
  }
};

// Scrape Receita Federal
const scrapeReceitaFederal = async (req, res) => {
  try {
    res.json({ message: 'Scraping Receita Federal iniciado', source: 'RECEITA_FEDERAL' });
    scraperLeiloeiros.scrapeReceitaFederal().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping Receita Federal' });
  }
};

// Scrape all governamentais
const scrapeAllGovernamentais = async (req, res) => {
  try {
    res.json({ message: 'Scraping de fontes governamentais iniciado' });
    scraperLeiloeiros.scrapeAllGovernamentais().catch(console.error);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar scraping governamental' });
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
  getMultiBankStats,
  // Leiloeiros principais
  scrapeBradesco,
  scrapeSold,
  scrapeMegaLeiloes,
  scrapeLanceNoLeilao,
  scrapeSuperbid,
  scrapeAllLeiloeiros,
  getLeiloeirosStats,
  // Leiloeiros adicionais
  scrapeBiasi,
  scrapeFrazao,
  scrapeVipLeiloes,
  scrapePestana,
  scrapeKronberg,
  scrapeSato,
  scrapeLut,
  scrapeSodreSantoro,
  scrapeZukerman,
  scrapeBrado,
  scrapeFreitag,
  // Bancos adicionais
  scrapeBRB,
  scrapeBanrisul,
  scrapeAllBancosAdicionais,
  // Governamentais
  scrapeEmgea,
  scrapeReceitaFederal,
  scrapeAllGovernamentais
};
