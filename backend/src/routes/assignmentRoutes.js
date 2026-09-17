const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All assignment routes require authentication
router.use(authMiddleware);

// Create assignment (admin/professor only)
router.post('/', roleMiddleware(['admin']), assignmentController.createAssignment);

// Get all assignments
router.get('/', assignmentController.getAllAssignments);

// Assign assignment to a group
router.post('/:id/groups', roleMiddleware(['admin']), assignmentController.assignToGroup);

// Get groups assigned to an assignment
router.get('/:id/groups', roleMiddleware(['admin']), assignmentController.getAssignmentGroups);

// Get assignment by ID
router.get('/:id', assignmentController.getAssignmentById);

// Update assignment (admin/professor only, creator only)
router.put('/:id', roleMiddleware(['admin']), assignmentController.updateAssignment);

// Delete assignment (admin/professor only, creator only)
router.delete('/:id', roleMiddleware(['admin']), assignmentController.deleteAssignment);

// Get assignments for a group
router.get('/group/:groupId', assignmentController.getGroupAssignments);

module.exports = router;
