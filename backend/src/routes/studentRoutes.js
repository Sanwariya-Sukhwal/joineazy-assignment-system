const express = require('express');

const router = express.Router();

const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Get all students
router.get('/', studentController.getStudents);

// Get students enrolled in a course
router.get(
  '/course/:courseId',
  studentController.getCourseStudents
);

// Enroll student into course
router.post(
  '/course/:courseId',
  studentController.enrollStudent
);

// Remove student from course
router.delete(
  '/course/:courseId/:studentId',
  studentController.removeStudent
);

module.exports = router;