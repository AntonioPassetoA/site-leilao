const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Properties
router.get('/properties', adminController.getAllProperties);
router.post('/properties', adminController.createProperty);
router.put('/properties/:id', adminController.updateProperty);
router.delete('/properties/:id', adminController.deleteProperty);

// Property images
router.post('/properties/:id/images', adminController.addPropertyImages);
router.delete('/images/:imageId', adminController.deletePropertyImage);

// Users
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Auction management
router.post('/properties/:id/activate', adminController.activateAuction);
router.post('/properties/:id/cancel', adminController.cancelAuction);
router.post('/properties/:id/finalize', adminController.finalizeAuction);

module.exports = router;
