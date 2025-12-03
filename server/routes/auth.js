const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    getCurrentUser,
    searchUsers
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);
router.get('/search-users', verifyToken, searchUsers);

module.exports = router;
