const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

router.post('/', favoriteController.addFavorite);
router.delete('/:propertyId', favoriteController.removeFavorite);
router.get('/', favoriteController.getUserFavorites);
router.get('/check/:propertyId', favoriteController.checkFavorite);

module.exports = router;
