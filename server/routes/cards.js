const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
    getCards,
    createCard,
    updateCard,
    deleteCard,
    assignUser,
    unassignUser,
    createLink,
    updateLink,
    deleteLink
} = require('../controllers/cardController');

// All routes require authentication
router.use(verifyToken);

// Card routes
router.get('/page/:pageId', getCards);
router.post('/page/:pageId', createCard);
router.put('/:cardId', updateCard);
router.delete('/:cardId', deleteCard);

// Card assignment routes
router.post('/:cardId/assign', assignUser);
router.delete('/:cardId/assign/:userId', unassignUser);

// Card link routes
router.post('/page/:pageId/links', createLink);
router.put('/links/:linkId', updateLink);
router.delete('/links/:linkId', deleteLink);

module.exports = router;
