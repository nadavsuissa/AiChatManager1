const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);

// Get current user profile
router.get('/me', userController.getCurrentUser);

// Get all users (should be restricted to admins in production)
router.get('/', userController.getAllUsers);

// Find user by email
router.get('/email/:email', userController.findUserByEmail);

module.exports = router; 