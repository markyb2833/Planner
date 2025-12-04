const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    getCurrentUser,
    searchUsers
} = require('../controllers/authController');

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/request-password-reset', passwordResetLimiter, requestPasswordReset);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);
router.get('/search-users', verifyToken, searchUsers);

module.exports = router;
