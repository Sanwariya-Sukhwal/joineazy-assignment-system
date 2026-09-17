const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const authMiddleware = require('../middleware/authMiddleware');

// All submission routes require authentication
router.use(authMiddleware);

// Confirm submission for an assignment
router.post('/:assignmentId/confirm', submissionController.confirmSubmission);

// Get all submissions
router.get('/', submissionController.getAllSubmissions);

// Get submissions for a specific group
router.get('/group/:groupId', submissionController.getGroupSubmissions);

// Get submissions for a specific assignment
router.get('/assignment/:assignmentId', submissionController.getAssignmentSubmissions);

// Get submission status for group and assignment
router.get('/:assignmentId/:groupId', submissionController.getSubmissionStatus);

module.exports = router;
