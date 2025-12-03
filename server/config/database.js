const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Parse DATABASE_URL from environment
 * Supports formats:
 * - mysql://username:password@host:port/database
 * - mysql://username:password@host/database
 * - Railway's MYSQL_* individual variables
 */
const getDatabaseConfig = () => {
    // If individual MySQL variables are provided (Railway style)
    // Railway provides both MYSQLHOST and MYSQL_HOST formats
    if (process.env.MYSQLHOST || process.env.MYSQL_HOST) {
        return {
            host: process.env.MYSQLHOST || process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306'),
            user: process.env.MYSQLUSER || process.env.MYSQL_USER,
            password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD,
            database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE
        };
    }

    // Parse DATABASE_URL (supports with or without port)
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL or MYSQL_* variables required');
    }

    // Regex to match mysql://user:password@host:port/database or mysql://user:password@host/database
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/([^?]+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
    }

    return {
        user: match[1],
        password: decodeURIComponent(match[2]), // Decode URL-encoded passwords
        host: match[3],
        port: parseInt(match[4] || '3306'),
        database: match[5]
    };
};

const dbConfig = getDatabaseConfig();

// Create connection pool for better performance
const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // SSL for production (Railway requires this)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = { pool, testConnection };
