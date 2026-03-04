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

// POST /api/scraper/:estado - Start scraping single state (must be LAST)
router.post('/:estado', scraperController.scrapeState);

module.exports = router;
