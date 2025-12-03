const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/email');

/**
 * Register a new user
 */
const register = async (req, res) => {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email or username already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        const userId = result.insertId;

        // Generate token
        const token = generateToken(userId, email, username);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: userId, username, email }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

/**
 * Login user (accepts email or username)
 */
const login = async (req, res) => {
    const { email, username, identifier, password } = req.body;
    
    // Support both 'email', 'username', or 'identifier' field for flexibility
    const loginIdentifier = identifier || email || username;

    // Validation
    if (!loginIdentifier || !password) {
        return res.status(400).json({ error: 'Email/username and password are required' });
    }

    try {
        // Find user by email OR username
        const [users] = await pool.query(
            'SELECT id, username, email, password_hash, is_active FROM users WHERE email = ? OR username = ?',
            [loginIdentifier, loginIdentifier]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is disabled' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate token
        const token = generateToken(user.id, user.email, user.username);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Find user
        const [users] = await pool.query(
            'SELECT id, username, email FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            // Don't reveal if user exists or not
            return res.json({ message: 'If that email exists, a reset link has been sent' });
        }

        const user = users[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Store token in database
        await pool.query(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, resetToken, expiresAt]
        );

        // Send email
        await sendPasswordResetEmail(user.email, user.username, resetToken);

        res.json({ message: 'If that email exists, a reset link has been sent' });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Server error during password reset request' });
    }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Find valid token
        const [resets] = await pool.query(
            'SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = FALSE',
            [token]
        );

        if (resets.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const userId = resets[0].user_id;

        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, userId]
        );

        // Mark token as used
        await pool.query(
            'UPDATE password_resets SET used = TRUE WHERE token = ?',
            [token]
        );

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Server error during password reset' });
    }
};

/**
 * Get current user info
 */
const getCurrentUser = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, created_at, last_login FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Search users (for collaboration invites)
 */
const searchUsers = async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    try {
        const [users] = await pool.query(
            'SELECT id, username, email FROM users WHERE (username LIKE ? OR email LIKE ?) AND id != ? LIMIT 10',
            [`%${query}%`, `%${query}%`, req.user.userId]
        );

        res.json({ users });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    getCurrentUser,
    searchUsers
};
