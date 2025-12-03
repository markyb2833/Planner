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
    deletePageGroup,
    inviteUser,
    getPendingInvitations,
    respondToInvitation,
    getSharedUsers,
    updateUserPermission,
    removeUserAccess,
    updateUserPageGroup
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
router.delete('/groups/:id', deletePageGroup);

// Collaboration routes
router.post('/:id/invite', inviteUser);
router.get('/invitations/pending', getPendingInvitations);
router.post('/invitations/:id/respond', respondToInvitation);
router.get('/:id/shared-users', getSharedUsers);
router.put('/:id/share/:userId', updateUserPermission);
router.delete('/:id/share/:userId', removeUserAccess);

// User-specific page preferences (for shared pages)
router.put('/:id/user-group', updateUserPageGroup);

module.exports = router;
