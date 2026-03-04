const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// All scraper routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// GET /api/scraper/estados - List available states
router.get('/estados', scraperController.getEstados);

// GET /api/scraper/stats - Get scraping statistics
router.get('/stats', scraperController.getStats);

// GET /api/scraper/logs - Get scraping logs
router.get('/logs', scraperController.getLogs);

// POST /api/scraper/all - Start scraping all states
router.post('/all', scraperController.scrapeAll);

// Scheduler routes
// GET /api/scraper/scheduler/status - Get scheduler status
router.get('/scheduler/status', scraperController.getSchedulerStatus);

// POST /api/scraper/scheduler/start - Start scheduler
router.post('/scheduler/start', scraperController.startScheduler);

// POST /api/scraper/scheduler/stop - Stop scheduler
router.post('/scheduler/stop', scraperController.stopScheduler);

// POST /api/scraper/scheduler/run/:task - Run a specific task
router.post('/scheduler/run/:task', scraperController.runSchedulerTask);

// POST /api/scraper/cleanup - Clean expired properties
router.post('/cleanup', scraperController.cleanupExpired);

// Banco do Brasil routes (MUST be before :estado route)
// GET /api/scraper/bb/stats - Get BB statistics
router.get('/bb/stats', scraperController.getBBStats);

// POST /api/scraper/bb - Start BB scraping
router.post('/bb', scraperController.scrapeBB);

// Multi-bank routes
// GET /api/scraper/banks/stats - Get all banks stats
router.get('/banks/stats', scraperController.getMultiBankStats);

// POST /api/scraper/santander - Scrape Santander
router.post('/santander', scraperController.scrapeSantander);

// POST /api/scraper/itau - Scrape Itaú
router.post('/itau', scraperController.scrapeItau);

// POST /api/scraper/zuk - Scrape Portal Zuk
router.post('/zuk', scraperController.scrapePortalZuk);

// POST /api/scraper/banks/all - Scrape all banks
router.post('/banks/all', scraperController.scrapeAllBanks);

// ==================== NOVOS LEILOEIROS ====================

// GET /api/scraper/leiloeiros/stats - Get leiloeiros stats
router.get('/leiloeiros/stats', scraperController.getLeiloeirosStats);

// POST /api/scraper/bradesco - Scrape Bradesco
router.post('/bradesco', scraperController.scrapeBradesco);

// POST /api/scraper/sold - Scrape Sold Leilões
router.post('/sold', scraperController.scrapeSold);

// POST /api/scraper/mega - Scrape Mega Leilões
router.post('/mega', scraperController.scrapeMegaLeiloes);

// POST /api/scraper/lance - Scrape Lance no Leilão
router.post('/lance', scraperController.scrapeLanceNoLeilao);

// POST /api/scraper/superbid - Scrape Superbid
router.post('/superbid', scraperController.scrapeSuperbid);

// POST /api/scraper/leiloeiros/all - Scrape all leiloeiros
router.post('/leiloeiros/all', scraperController.scrapeAllLeiloeiros);

// ==================== LEILOEIROS ADICIONAIS ====================

// POST /api/scraper/biasi - Scrape Biasi Leilões
router.post('/biasi', scraperController.scrapeBiasi);

// POST /api/scraper/frazao - Scrape Frazão Leilões
router.post('/frazao', scraperController.scrapeFrazao);

// POST /api/scraper/vip - Scrape VIP Leilões
router.post('/vip', scraperController.scrapeVipLeiloes);

// POST /api/scraper/pestana - Scrape Pestana Leilões
router.post('/pestana', scraperController.scrapePestana);

// POST /api/scraper/kronberg - Scrape Kronberg Leilões
router.post('/kronberg', scraperController.scrapeKronberg);

// POST /api/scraper/sato - Scrape Sato Leilões
router.post('/sato', scraperController.scrapeSato);

// POST /api/scraper/lut - Scrape Lut Leilões
router.post('/lut', scraperController.scrapeLut);

// POST /api/scraper/sodre - Scrape Sodré Santoro
router.post('/sodre', scraperController.scrapeSodreSantoro);

// POST /api/scraper/zukerman - Scrape Zukerman Leilões
router.post('/zukerman', scraperController.scrapeZukerman);

// POST /api/scraper/brado - Scrape Brado Leilões
router.post('/brado', scraperController.scrapeBrado);

// POST /api/scraper/freitag - Scrape Freitag Leilões
router.post('/freitag', scraperController.scrapeFreitag);

// ==================== BANCOS ADICIONAIS ====================

// POST /api/scraper/brb - Scrape BRB
router.post('/brb', scraperController.scrapeBRB);

// POST /api/scraper/banrisul - Scrape Banrisul
router.post('/banrisul', scraperController.scrapeBanrisul);

// POST /api/scraper/bancos-adicionais/all - Scrape all additional banks
router.post('/bancos-adicionais/all', scraperController.scrapeAllBancosAdicionais);

// ==================== GOVERNAMENTAIS ====================

// POST /api/scraper/emgea - Scrape EMGEA
router.post('/emgea', scraperController.scrapeEmgea);

// POST /api/scraper/receita - Scrape Receita Federal
router.post('/receita', scraperController.scrapeReceitaFederal);

// POST /api/scraper/governamentais/all - Scrape all governmental sources
router.post('/governamentais/all', scraperController.scrapeAllGovernamentais);

// POST /api/scraper/:estado - Start scraping single state (must be LAST)
router.post('/:estado', scraperController.scrapeState);

module.exports = router;
