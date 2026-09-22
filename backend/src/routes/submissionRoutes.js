const express = require('express');

const router = express.Router();

const submissionController = require('../controllers/submissionController');

const authMiddleware = require('../middleware/authMiddleware');

const roleMiddleware = require('../middleware/roleMiddleware');

// All submission routes require authentication
router.use(authMiddleware);

// Confirm submission for an assignment
router.post('/:assignmentId/confirm', submissionController.confirmSubmission);

// Acknowledge assignment (student or group leader)
router.post('/:assignmentId/acknowledge', submissionController.acknowledgeSubmission);

// Get all submissions (Professor/Admin only)
router.get('/', roleMiddleware(['admin']), submissionController.getAllSubmissions);

// Get submissions for a specific group
router.get('/group/:groupId', submissionController.getGroupSubmissions);

// Get submissions for a specific assignment (Professor/Admin only)
router.get('/assignment/:assignmentId', roleMiddleware(['admin']), submissionController.getAssignmentSubmissions);

// Get submission status for group and assignment
router.get('/:assignmentId/:groupId', submissionController.getSubmissionStatus);

module.exports = router;