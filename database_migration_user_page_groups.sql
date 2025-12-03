-- Migration: Add per-user page grouping
-- This allows each user to organize shared pages in their own groups

-- Create a new table to track user-specific page grouping
CREATE TABLE IF NOT EXISTS user_page_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    page_id INT NOT NULL,
    group_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES page_groups(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_page (user_id, page_id),
    INDEX idx_user (user_id),
    INDEX idx_page (page_id),
    INDEX idx_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing data: Owner's pages keep their current group_id
INSERT INTO user_page_groups (user_id, page_id, group_id)
SELECT owner_id, id, group_id
FROM pages
WHERE group_id IS NOT NULL
ON DUPLICATE KEY UPDATE group_id = VALUES(group_id);

-- Note: We're keeping pages.group_id for backward compatibility
-- The application will prioritize user_page_groups over pages.group_id
