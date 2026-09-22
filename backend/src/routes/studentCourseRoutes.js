const express = require('express');

const router = express.Router();

const courseController = require('../controllers/courseController');

const authMiddleware = require('../middleware/authMiddleware');

const roleMiddleware = require('../middleware/roleMiddleware');

// All student course routes require authentication
router.use(authMiddleware);

// Get courses enrolled by the logged-in student
router.get('/', roleMiddleware(['student']), courseController.getStudentCourses);

module.exports = router;