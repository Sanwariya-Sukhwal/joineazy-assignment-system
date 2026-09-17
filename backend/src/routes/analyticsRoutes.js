const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All analytics routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Get overall analytics overview
router.get('/overview', analyticsController.getOverviewAnalytics);

// Get group-wise analytics
router.get('/groups', analyticsController.getGroupAnalytics);

// Get student-wise analytics
router.get('/students', analyticsController.getStudentAnalytics);

// Get assignment submission statistics
router.get('/assignments', analyticsController.getAssignmentStats);

// Get detailed stats for a specific assignment
router.get('/assignments/:assignmentId', analyticsController.getAssignmentDetailedStats);

module.exports = router;
