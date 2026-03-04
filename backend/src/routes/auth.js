const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validateRegister, validateLogin, validateProfileUpdate } = require('../middlewares/validators');

// Public routes with validation
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateProfileUpdate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
