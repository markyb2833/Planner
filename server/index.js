const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const setupSocketHandlers = require('./socket/socketHandler');

// Import routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const cardRoutes = require('./routes/cards');
const uploadRoutes = require('./routes/uploads');

// Initialize Express
const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOrigin = process.env.NODE_ENV === 'production' 
    ? true  // Allow same-origin in production
    : (process.env.CLIENT_URL || 'http://localhost:3000');

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve uploaded files statically (Railway volume in production, local in development)
const uploadsPath = process.env.NODE_ENV === 'production' && process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? process.env.RAILWAY_VOLUME_MOUNT_PATH
    : path.join(__dirname, '../uploads');

app.use('/uploads', express.static(uploadsPath));
console.log(`📁 Serving uploads from: ${uploadsPath}`);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/uploads', uploadRoutes);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from React build
    app.use(express.static(path.join(__dirname, '../client/build')));

    // Handle React routing - serve index.html for any non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
} else {
    // 404 handler for development
    app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });
}

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Start listening on 0.0.0.0 for Railway/production
        const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
        server.listen(PORT, HOST, () => {
            console.log('\n🚀 Planner Server Started');
            console.log('========================');
            console.log(`📡 Server running on ${HOST}:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔌 Socket.io ready for connections`);
            console.log(`🗄️  Database: Connected`);
            console.log('========================\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
