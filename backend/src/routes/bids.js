const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.get('/property/:propertyId', bidController.getBidsByProperty);

// Protected routes
router.post('/', authenticate, bidController.placeBid);
router.get('/my-bids', authenticate, bidController.getUserBids);

module.exports = router;
