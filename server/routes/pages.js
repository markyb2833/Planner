const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
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
    respondToInvitation,
    getSharedUsers,
    updateUserPermission,
    removeUserAccess
} = require('../controllers/pageController');

// All routes require authentication
router.use(verifyToken);

// Page routes
router.get('/', getPages);
router.get('/:id', getPage);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);
router.put('/:id/defaults', updatePageDefaults);

// Page group routes
router.get('/groups/list', getPageGroups);
router.post('/groups', createPageGroup);

// Collaboration routes
router.post('/:id/invite', inviteUser);
router.get('/invitations/pending', getPendingInvitations);
router.post('/invitations/:id/respond', respondToInvitation);
router.get('/:id/shared-users', getSharedUsers);
router.put('/:id/share/:userId', updateUserPermission);
router.delete('/:id/share/:userId', removeUserAccess);

module.exports = router;
