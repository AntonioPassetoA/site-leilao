const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validateLead } = require('../middlewares/validators');
const { recaptchaMiddleware } = require('../services/recaptcha');

// Public route - anyone can submit interest (with validation and reCAPTCHA)
router.post('/', validateLead, recaptchaMiddleware(), leadController.createLead);

// Admin routes
router.get('/', authenticate, requireAdmin, leadController.getAllLeads);
router.get('/stats', authenticate, requireAdmin, leadController.getLeadStats);
router.get('/:id', authenticate, requireAdmin, leadController.getLeadById);
router.patch('/:id/status', authenticate, requireAdmin, leadController.updateLeadStatus);
router.delete('/:id', authenticate, requireAdmin, leadController.deleteLead);

module.exports = router;
