const { pool } = require('../config/database');

/**
 * Check if user has access to a page
 */
const checkPageAccess = async (userId, pageId, requireEdit = false) => {
    const [pages] = await pool.query(`
        SELECT p.owner_id, ps.permission_level
        FROM pages p
        LEFT JOIN page_shares ps ON p.id = ps.page_id AND ps.user_id = ? AND ps.status = 'accepted'
        WHERE p.id = ?
    `, [userId, pageId]);

    if (pages.length === 0) {
        return { hasAccess: false, isOwner: false };
    }

    const isOwner = pages[0].owner_id === userId;
    const hasEditPermission = pages[0].permission_level === 'edit';
    const hasViewPermission = pages[0].permission_level === 'view';

    if (requireEdit) {
        return { hasAccess: isOwner || hasEditPermission, isOwner };
    }

    return { hasAccess: isOwner || hasEditPermission || hasViewPermission, isOwner };
};

/**
 * Get all cards for a page
 */
const getCards = async (req, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user.userId;

        // Check access
        const { hasAccess } = await checkPageAccess(userId, pageId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get cards
        const [cards] = await pool.query(
            'SELECT * FROM cards WHERE page_id = ? ORDER BY z_index, id',
            [pageId]
        );

        // Get card assignments
        const [assignments] = await pool.query(`
            SELECT ca.card_id, ca.user_id, u.username, u.email
            FROM card_assignments ca
            JOIN users u ON ca.user_id = u.id
            WHERE ca.card_id IN (SELECT id FROM cards WHERE page_id = ?)
        `, [pageId]);

        // Get card links
        const [links] = await pool.query(
            'SELECT * FROM card_links WHERE page_id = ?',
            [pageId]
        );

        // Organize assignments by card
        const assignmentsByCard = {};
        assignments.forEach(assignment => {
            if (!assignmentsByCard[assignment.card_id]) {
                assignmentsByCard[assignment.card_id] = [];
            }
            assignmentsByCard[assignment.card_id].push({
                user_id: assignment.user_id,
                username: assignment.username,
                email: assignment.email
            });
        });

        // Add assignments to cards
        const cardsWithAssignments = cards.map(card => ({
            ...card,
            assignments: assignmentsByCard[card.id] || []
        }));

        res.json({ cards: cardsWithAssignments, links });
    } catch (error) {
        console.error('Get cards error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Create a new card
 */
const createCard = async (req, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user.userId;
        const {
            card_type,
            x_position,
            y_position,
            width,
            height,
            background_color,
            background_image,
            text_color,
            font_size,
            title,
            content,
            list_items
        } = req.body;

        // Check edit access
        const { hasAccess } = await checkPageAccess(userId, pageId, true);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [result] = await pool.query(`
            INSERT INTO cards (
                page_id, card_type, x_position, y_position, width, height,
                background_color, background_image, text_color, font_size,
                title, content, list_items, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            pageId,
            card_type || 'text',
            x_position || 0,
            y_position || 0,
            width || 200,
            height || 150,
            background_color || '#FFFFFF',
            background_image || null,
            text_color || '#000000',
            font_size || 14,
            title || null,
            content || null,
            list_items ? JSON.stringify(list_items) : null,
            userId
        ]);

        const cardId = result.insertId;

        // Get the created card
        const [cards] = await pool.query('SELECT * FROM cards WHERE id = ?', [cardId]);

        res.status(201).json({
            message: 'Card created successfully',
            card: cards[0]
        });
    } catch (error) {
        console.error('Create card error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Update a card
 */
const updateCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const userId = req.user.userId;

        // Get card's page_id
        const [cards] = await pool.query('SELECT page_id FROM cards WHERE id = ?', [cardId]);
        if (cards.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Check edit access
        const { hasAccess } = await checkPageAccess(userId, cards[0].page_id, true);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Build update query
        const updates = [];
        const values = [];
        const allowedFields = [
            'card_type', 'x_position', 'y_position', 'width', 'height', 'z_index',
            'background_color', 'background_image', 'text_color', 'font_size',
            'title', 'content', 'list_items', 'notes', 'work_start_date', 'work_end_date'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                if (field === 'list_items' && req.body[field] !== null) {
                    // Check if it's already a string
                    const value = typeof req.body[field] === 'string'
                        ? req.body[field]
                        : JSON.stringify(req.body[field]);
                    values.push(value);
                } else if ((field === 'work_start_date' || field === 'work_end_date') && req.body[field] === '') {
                    // Convert empty date strings to NULL for MySQL
                    values.push(null);
                } else if (field === 'background_image' && req.body[field] === '') {
                    // Convert empty image strings to NULL
                    values.push(null);
                } else {
                    values.push(req.body[field]);
                }
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(cardId);

        await pool.query(
            `UPDATE cards SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Card updated successfully' });
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Delete a card
 */
const deleteCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const userId = req.user.userId;

        // Get card's page_id
        const [cards] = await pool.query('SELECT page_id FROM cards WHERE id = ?', [cardId]);
        if (cards.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Check edit access
        const { hasAccess } = await checkPageAccess(userId, cards[0].page_id, true);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await pool.query('DELETE FROM cards WHERE id = ?', [cardId]);

        res.json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Assign user to card
 */
const assignUser = async (req, res) => {
    try {
        const { cardId } = req.params;
        const { user_id } = req.body;
        const userId = req.user.userId;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        // Get card's page_id
        const [cards] = await pool.query('SELECT page_id FROM cards WHERE id = ?', [cardId]);
        if (cards.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Check edit access
        const { hasAccess } = await checkPageAccess(userId, cards[0].page_id, true);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if user to assign has access to the page
        const { hasAccess: targetHasAccess } = await checkPageAccess(user_id, cards[0].page_id);
        if (!targetHasAccess) {
            return res.status(400).json({ error: 'User does not have access to this page' });
        }

        // Assign user
        await pool.query(
            'INSERT INTO card_assignments (card_id, user_id, assigned_by) VALUES (?, ?, ?)',
            [cardId, user_id, userId]
        );

        res.status(201).json({ message: 'User assigned successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'User already assigned to this card' });
        }
        console.error('Assign user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Unassign user from card
 */
const unassignUser = async (req, res) => {
    try {
        const { cardId, userId: targetUserId } = req.params;
        const userId = req.user.userId;

        // Get card's page_id
        const [cards] = await pool.query('SELECT page_id FROM cards WHERE id = ?', [cardId]);
        if (cards.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Check edit access
        const { hasAccess } = await checkPageAccess(userId, cards[0].page_id, true);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await pool.query(
            'DELETE FROM card_assignments WHERE card_id = ? AND user_id = ?',
            [cardId, targetUserId]
        );

        res.json({ message: 'User unassigned successfully' });
    } catch (error) {
        console.error('Unassign user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Create card link
 */
const createLink = async (req, res) => {
    try {
        const { pageId } = req.params;
        const { card_from_id, card_to_id, line_color, line_width, line_style } = req.body;
        const userId = req.user.userId;

        if (!card_from_id || !card_to_id) {
            return res.status(400).json({ error: 'card_from_id and card_to_id are required' });
        }

        // Check edit access
        const { hasAccess } = await checkPageAccess(userId, pageId, true);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [result] = await pool.query(`
            INSERT INTO card_links (page_id, card_from_id, card_to_id, line_color, line_width, line_style, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [pageId, card_from_id, card_to_id, line_color || '#000000', line_width || 2, line_style || 'solid', userId]);

        res.status(201).json({
            message: 'Link created successfully',
            linkId: result.insertId
        });
    } catch (error) {
        console.error('Create link error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Update card link
 */
const updateLink = async (req, res) => {
    try {
        const { linkId } = req.params;
        const { line_color, line_width, line_style } = req.body;
        const userId = req.user.userId;

        // Get link's page_id
        const [links] = await pool.query('SELECT page_id FROM card_links WHERE id = ?', [linkId]);
        if (links.length === 0) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Check edit access
        const { hasAccess } = await checkPageAccess(userId, links[0].page_id, true);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (line_color !== undefined) { updates.push('line_color = ?'); values.push(line_color); }
        if (line_width !== undefined) { updates.push('line_width = ?'); values.push(line_width); }
        if (line_style !== undefined) { updates.push('line_style = ?'); values.push(line_style); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(linkId);

        await pool.query(
            `UPDATE card_links SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Link updated successfully' });
    } catch (error) {
        console.error('Update link error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Delete card link
 */
const deleteLink = async (req, res) => {
    try {
        const { linkId } = req.params;
        const userId = req.user.userId;

        // Get link's page_id
        const [links] = await pool.query('SELECT page_id FROM card_links WHERE id = ?', [linkId]);
        if (links.length === 0) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Check edit access
        const { hasAccess } = await checkPageAccess(userId, links[0].page_id, true);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await pool.query('DELETE FROM card_links WHERE id = ?', [linkId]);

        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        console.error('Delete link error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getCards,
    createCard,
    updateCard,
    deleteCard,
    assignUser,
    unassignUser,
    createLink,
    updateLink,
    deleteLink
};
