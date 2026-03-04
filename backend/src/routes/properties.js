const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { optionalAuth } = require('../middlewares/auth');

// Public routes
router.get('/', optionalAuth, propertyController.getProperties);
router.get('/featured', propertyController.getFeaturedProperties);
router.get('/ending-soon', propertyController.getEndingSoon);
router.get('/states', propertyController.getStates);
router.get('/cities', propertyController.getCities);
router.get('/:id', optionalAuth, propertyController.getPropertyById);

module.exports = router;
