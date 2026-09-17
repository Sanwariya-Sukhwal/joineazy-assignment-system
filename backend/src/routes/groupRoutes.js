const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All group routes require authentication
router.use(authMiddleware);

// Create a new group (students only)
router.post('/', roleMiddleware(['student']), groupController.createGroup);

// Get all groups
router.get('/', groupController.getAllGroups);

// Get user's groups
router.get('/my-groups', groupController.getUserGroups);

// Get group by ID
router.get('/:id', groupController.getGroupById);

// Add member to group (leader only)
router.post('/:id/members', groupController.addMember);

// Remove member from group (leader only)
router.delete('/:id/members/:studentId', groupController.removeMember);

module.exports = router;
