const rateLimit = require('express-rate-limit');

// Strict limiter for authentication endpoints
// 5 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: false,
});

// Limiter for password reset requests
// 3 attempts per hour per IP
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { error: 'Too many password reset requests. Please try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter for invitation endpoints
// 20 invitations per 10 minutes per user
const inviteLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20,
    message: { error: 'Too many invitation requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API limiter
// 100 requests per minute per IP
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for socket connections
        return req.path.includes('/socket.io');
    }
});

module.exports = {
    authLimiter,
    passwordResetLimiter,
    inviteLimiter,
    apiLimiter
};
