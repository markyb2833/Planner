#!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script will:
 * 1. Test the MySQL connection
 * 2. Create the database if it doesn't exist
 * 3. Run the schema SQL file to create all tables
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse DATABASE_URL from .env
const parseDatabaseUrl = (url) => {
    // Format: mysql://username:password@host/database
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('Invalid DATABASE_URL format');
    }

    return {
        user: match[1],
        password: match[2],
        host: match[3],
        database: match[4]
    };
};

const setupDatabase = async () => {
    let connection;

    try {
        const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);

        console.log('📦 Planner Database Setup');
        console.log('========================\n');
        console.log(`Host: ${dbConfig.host}`);
        console.log(`Database: ${dbConfig.database}`);
        console.log(`User: ${dbConfig.user}\n`);

        // Step 1: Connect to MySQL server (without database)
        console.log('🔌 Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            multipleStatements: true
        });
        console.log('✅ Connected to MySQL server\n');

        // Step 2: Create database if it doesn't exist
        console.log(`🗄️  Creating database '${dbConfig.database}' if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`
                                CHARACTER SET utf8mb4
                                COLLATE utf8mb4_unicode_ci`);
        console.log('✅ Database ready\n');

        // Step 3: Switch to the database
        await connection.query(`USE \`${dbConfig.database}\``);

        // Step 4: Read and execute schema file
        console.log('📋 Reading schema file...');
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('✅ Schema file loaded\n');

        console.log('🔨 Creating tables...');
        await connection.query(schemaSql);
        console.log('✅ All tables created successfully\n');

        // Step 5: Verify tables were created
        console.log('🔍 Verifying tables...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`✅ Found ${tables.length} tables:`);
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   - ${tableName}`);
        });

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\nYou can now start building the application.\n');

    } catch (error) {
        console.error('\n❌ Error setting up database:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Run the setup
setupDatabase();
