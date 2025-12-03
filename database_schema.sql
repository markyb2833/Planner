-- ===================================================================
-- PLANNER APPLICATION - DATABASE SCHEMA
-- ===================================================================
-- Tech Stack: MySQL
-- This schema supports: users, authentication, pages, cards,
-- collaboration, real-time updates, and permissions
-- ===================================================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS card_assignments;
DROP TABLE IF EXISTS card_links;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS page_shares;
DROP TABLE IF EXISTS page_defaults;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS page_groups;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS users;

-- ===================================================================
-- USERS TABLE
-- ===================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- PASSWORD RESETS TABLE
-- ===================================================================
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- PAGE GROUPS TABLE
-- ===================================================================
CREATE TABLE page_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- PAGES TABLE
-- ===================================================================
CREATE TABLE pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    group_id INT NULL,
    name VARCHAR(100) NOT NULL,
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    background_image VARCHAR(500) NULL,
    canvas_max_width INT DEFAULT 5000,
    canvas_max_height INT DEFAULT 5000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES page_groups(id) ON DELETE SET NULL,
    INDEX idx_owner (owner_id),
    INDEX idx_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- PAGE DEFAULTS TABLE
-- Stores default settings for new cards on each page
-- ===================================================================
CREATE TABLE page_defaults (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT UNIQUE NOT NULL,
    default_card_width INT DEFAULT 200,
    default_card_height INT DEFAULT 150,
    default_card_background_color VARCHAR(7) DEFAULT '#FFFFFF',
    default_card_background_image VARCHAR(500) NULL,
    default_card_text_color VARCHAR(7) DEFAULT '#000000',
    default_card_font_size INT DEFAULT 14,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- PAGE SHARES TABLE
-- Manages collaboration and permissions
-- ===================================================================
CREATE TABLE page_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    user_id INT NOT NULL,
    permission_level ENUM('view', 'edit') DEFAULT 'view',
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    invited_by INT NOT NULL,
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_user (page_id, user_id),
    INDEX idx_page (page_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- CARDS TABLE
-- Stores all card data including position, size, and content
-- ===================================================================
CREATE TABLE cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    card_type VARCHAR(50) NOT NULL DEFAULT 'text',
    x_position DECIMAL(10,2) NOT NULL DEFAULT 0,
    y_position DECIMAL(10,2) NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 200,
    height INT NOT NULL DEFAULT 150,
    z_index INT DEFAULT 0,
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    background_image VARCHAR(500) NULL,
    text_color VARCHAR(7) DEFAULT '#000000',
    font_size INT DEFAULT 14,
    title VARCHAR(255) NULL,
    content TEXT NULL,
    list_items JSON NULL,
    notes TEXT NULL,
    work_start_date DATE NULL,
    work_end_date DATE NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_page (page_id),
    INDEX idx_position (page_id, x_position, y_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- CARD ASSIGNMENTS TABLE
-- Tracks which users are assigned to which cards
-- ===================================================================
CREATE TABLE card_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_card_user (card_id, user_id),
    INDEX idx_card (card_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- CARD LINKS TABLE
-- Stores visual connection lines between cards
-- ===================================================================
CREATE TABLE card_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    card_from_id INT NOT NULL,
    card_to_id INT NOT NULL,
    line_color VARCHAR(7) DEFAULT '#000000',
    line_width INT DEFAULT 2,
    line_style ENUM('solid', 'dashed', 'dotted') DEFAULT 'solid',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (card_from_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (card_to_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_page (page_id),
    INDEX idx_cards (card_from_id, card_to_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- SAMPLE DATA (Optional - for testing)
-- ===================================================================

-- Insert a test user (password: 'password123' - will need proper hashing in app)
-- INSERT INTO users (username, email, password_hash)
-- VALUES ('testuser', 'test@example.com', '$2b$10$...');
