const express = require('express');

const router = express.Router();

const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All course routes require authentication + admin/professor role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Get all courses
router.get('/', courseController.getCourses);

// Create course
router.post('/', courseController.createCourse);

// Get single course
router.get('/:id', courseController.getCourseById);

// Update course
router.put('/:id', courseController.updateCourse);

// Delete course
router.delete('/:id', courseController.deleteCourse);

module.exports = router;