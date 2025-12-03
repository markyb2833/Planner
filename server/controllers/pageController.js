const { pool } = require('../config/database');
const { sendPageInvitationEmail } = require('../utils/email');

/**
 * Get all pages for the current user (owned + shared)
 */
const getPages = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get owned pages and shared pages
        const [pages] = await pool.query(`
            SELECT DISTINCT
                p.id, p.name, p.background_color, p.background_image,
                p.canvas_max_width, p.canvas_max_height, p.group_id,
                p.created_at, p.updated_at,
                p.owner_id,
                CASE
                    WHEN p.owner_id = ? THEN 'owner'
                    ELSE ps.permission_level
                END as permission,
                pg.name as group_name
            FROM pages p
            LEFT JOIN page_groups pg ON p.group_id = pg.id
            LEFT JOIN page_shares ps ON p.id = ps.page_id AND ps.user_id = ? AND ps.status = 'accepted'
            WHERE p.owner_id = ? OR (ps.user_id = ? AND ps.status = 'accepted')
            ORDER BY p.updated_at DESC
        `, [userId, userId, userId, userId]);

        res.json({ pages });
    } catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Get single page with all details
 */
const getPage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Check permission
        const [pages] = await pool.query(`
            SELECT p.*,
                CASE
                    WHEN p.owner_id = ? THEN 'owner'
                    WHEN ps.permission_level IS NOT NULL THEN ps.permission_level
                    ELSE NULL
                END as permission
            FROM pages p
            LEFT JOIN page_shares ps ON p.id = ps.page_id AND ps.user_id = ? AND ps.status = 'accepted'
            WHERE p.id = ? AND (p.owner_id = ? OR (ps.user_id = ? AND ps.status = 'accepted'))
        `, [userId, userId, id, userId, userId]);

        if (pages.length === 0) {
            return res.status(404).json({ error: 'Page not found or access denied' });
        }

        // Get page defaults
        const [defaults] = await pool.query(
            'SELECT * FROM page_defaults WHERE page_id = ?',
            [id]
        );

        res.json({
            page: pages[0],
            defaults: defaults[0] || null
        });
    } catch (error) {
        console.error('Get page error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Create a new page
 */
const createPage = async (req, res) => {
    try {
        const { name, group_id, background_color, canvas_max_width, canvas_max_height } = req.body;
        const userId = req.user.userId;

        if (!name) {
            return res.status(400).json({ error: 'Page name is required' });
        }

        const [result] = await pool.query(
            `INSERT INTO pages (owner_id, group_id, name, background_color, canvas_max_width, canvas_max_height)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, group_id || null, name, background_color || '#FFFFFF', canvas_max_width || 5000, canvas_max_height || 5000]
        );

        const pageId = result.insertId;

        // Create default settings for this page
        await pool.query(
            'INSERT INTO page_defaults (page_id) VALUES (?)',
            [pageId]
        );

        res.status(201).json({
            message: 'Page created successfully',
            pageId
        });
    } catch (error) {
        console.error('Create page error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Update page
 */
const updatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { name, background_color, background_image, canvas_max_width, canvas_max_height, group_id } = req.body;

        // Check if user has edit permission
        const [pages] = await pool.query(`
            SELECT p.owner_id, ps.permission_level
            FROM pages p
            LEFT JOIN page_shares ps ON p.id = ps.page_id AND ps.user_id = ? AND ps.status = 'accepted'
            WHERE p.id = ?
        `, [userId, id]);

        if (pages.length === 0) {
            return res.status(404).json({ error: 'Page not found' });
        }

        const isOwner = pages[0].owner_id === userId;
        const hasEditPermission = pages[0].permission_level === 'edit';

        if (!isOwner && !hasEditPermission) {
            return res.status(403).json({ error: 'No permission to edit this page' });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (background_color !== undefined) { updates.push('background_color = ?'); values.push(background_color); }
        if (background_image !== undefined) { updates.push('background_image = ?'); values.push(background_image); }
        if (canvas_max_width !== undefined) { updates.push('canvas_max_width = ?'); values.push(canvas_max_width); }
        if (canvas_max_height !== undefined) { updates.push('canvas_max_height = ?'); values.push(canvas_max_height); }
        if (group_id !== undefined) { updates.push('group_id = ?'); values.push(group_id); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        await pool.query(
            `UPDATE pages SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Page updated successfully' });
    } catch (error) {
        console.error('Update page error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Delete page
 */
const deletePage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Only owner can delete
        const [pages] = await pool.query(
            'SELECT owner_id FROM pages WHERE id = ?',
            [id]
        );

        if (pages.length === 0) {
            return res.status(404).json({ error: 'Page not found' });
        }

        if (pages[0].owner_id !== userId) {
            return res.status(403).json({ error: 'Only the owner can delete this page' });
        }

        await pool.query('DELETE FROM pages WHERE id = ?', [id]);

        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error('Delete page error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Update page defaults
 */
const updatePageDefaults = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const {
            default_card_width,
            default_card_height,
            default_card_background_color,
            default_card_background_image,
            default_card_text_color,
            default_card_font_size
        } = req.body;

        // Check permission
        const [pages] = await pool.query(`
            SELECT p.owner_id, ps.permission_level
            FROM pages p
            LEFT JOIN page_shares ps ON p.id = ps.page_id AND ps.user_id = ? AND ps.status = 'accepted'
            WHERE p.id = ?
        `, [userId, id]);

        if (pages.length === 0) {
            return res.status(404).json({ error: 'Page not found' });
        }

        const isOwner = pages[0].owner_id === userId;
        const hasEditPermission = pages[0].permission_level === 'edit';

        if (!isOwner && !hasEditPermission) {
            return res.status(403).json({ error: 'No permission to edit this page' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (default_card_width !== undefined) { updates.push('default_card_width = ?'); values.push(default_card_width); }
        if (default_card_height !== undefined) { updates.push('default_card_height = ?'); values.push(default_card_height); }
        if (default_card_background_color !== undefined) { updates.push('default_card_background_color = ?'); values.push(default_card_background_color); }
        if (default_card_background_image !== undefined) { updates.push('default_card_background_image = ?'); values.push(default_card_background_image); }
        if (default_card_text_color !== undefined) { updates.push('default_card_text_color = ?'); values.push(default_card_text_color); }
        if (default_card_font_size !== undefined) { updates.push('default_card_font_size = ?'); values.push(default_card_font_size); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // First, ensure page_defaults row exists (for older pages)
        await pool.query(
            'INSERT IGNORE INTO page_defaults (page_id) VALUES (?)',
            [id]
        );

        values.push(id);

        await pool.query(
            `UPDATE page_defaults SET ${updates.join(', ')} WHERE page_id = ?`,
            values
        );

        res.json({ message: 'Page defaults updated successfully' });
    } catch (error) {
        console.error('Update page defaults error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Get page groups for current user
 */
const getPageGroups = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [groups] = await pool.query(
            'SELECT * FROM page_groups WHERE owner_id = ? ORDER BY name',
            [userId]
        );

        res.json({ groups });
    } catch (error) {
        console.error('Get page groups error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Create page group
 */
const createPageGroup = async (req, res) => {
    try {
        const { name, color } = req.body;
        const userId = req.user.userId;

        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO page_groups (owner_id, name, color) VALUES (?, ?, ?)',
            [userId, name, color || '#6B7280']
        );

        res.status(201).json({
            message: 'Page group created successfully',
            groupId: result.insertId
        });
    } catch (error) {
        console.error('Create page group error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Invite user to page
 */
const inviteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, permission_level } = req.body;
        const userId = req.user.userId;

        if (!user_id || !permission_level) {
            return res.status(400).json({ error: 'user_id and permission_level are required' });
        }

        if (!['view', 'edit'].includes(permission_level)) {
            return res.status(400).json({ error: 'permission_level must be "view" or "edit"' });
        }

        // Check if requester is owner
        const [pages] = await pool.query(
            'SELECT owner_id, name FROM pages WHERE id = ?',
            [id]
        );

        if (pages.length === 0) {
            return res.status(404).json({ error: 'Page not found' });
        }

        if (pages[0].owner_id !== userId) {
            return res.status(403).json({ error: 'Only the owner can invite users' });
        }

        // Get invitee details
        const [invitees] = await pool.query(
            'SELECT username, email FROM users WHERE id = ?',
            [user_id]
        );

        if (invitees.length === 0) {
            return res.status(404).json({ error: 'User to invite not found' });
        }

        // Check if already shared
        const [existing] = await pool.query(
            'SELECT id, status FROM page_shares WHERE page_id = ? AND user_id = ?',
            [id, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already invited or has access' });
        }

        // Create invitation
        await pool.query(
            'INSERT INTO page_shares (page_id, user_id, permission_level, invited_by) VALUES (?, ?, ?, ?)',
            [id, user_id, permission_level, userId]
        );

        // Send email notification
        const [inviter] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
        await sendPageInvitationEmail(
            invitees[0].email,
            invitees[0].username,
            inviter[0].username,
            pages[0].name
        );

        res.status(201).json({ message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('Invite user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Get pending invitations for current user
 */
const getPendingInvitations = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [invitations] = await pool.query(`
            SELECT ps.id, ps.page_id, ps.permission_level, ps.invited_at,
                   p.name as page_name,
                   u.username as invited_by_username
            FROM page_shares ps
            JOIN pages p ON ps.page_id = p.id
            JOIN users u ON ps.invited_by = u.id
            WHERE ps.user_id = ? AND ps.status = 'pending'
            ORDER BY ps.invited_at DESC
        `, [userId]);

        res.json({ invitations });
    } catch (error) {
        console.error('Get pending invitations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Accept or decline invitation
 */
const respondToInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accept' or 'decline'
        const userId = req.user.userId;

        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({ error: 'action must be "accept" or "decline"' });
        }

        const status = action === 'accept' ? 'accepted' : 'declined';

        const [result] = await pool.query(
            'UPDATE page_shares SET status = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND status = "pending"',
            [status, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        res.json({ message: `Invitation ${action}ed successfully` });
    } catch (error) {
        console.error('Respond to invitation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getPages,
    getPage,
    createPage,
    updatePage,
    deletePage,
    updatePageDefaults,
    getPageGroups,
    createPageGroup,
    inviteUser,
    getPendingInvitations,
    respondToInvitation
};
