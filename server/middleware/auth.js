const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, email, username }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

/**
 * Generate JWT token
 */
const generateToken = (userId, email, username) => {
    return jwt.sign(
        { userId, email, username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

module.exports = { verifyToken, generateToken };
