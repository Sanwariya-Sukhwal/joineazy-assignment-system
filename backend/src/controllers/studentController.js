const { pool } = require('../config/db');

// ==========================================
// Get all students
// ==========================================
const getStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email,
        first_name,
        last_name,
        created_at
      FROM users
      WHERE role = 'student'
      ORDER BY first_name ASC, last_name ASC
      `
    );

    res.status(200).json({
      students: result.rows.map((student) => ({
        id: student.id,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
        createdAt: student.created_at,
      })),
    });
  } catch (error) {
    console.error('Get students error:', error);

    res.status(500).json({
      error: 'Unable to fetch students',
    });
  }
};

// ==========================================
// Get students enrolled in a course
// ==========================================
const getCourseStudents = async (req, res) => {
  try {
    const professorId = req.user.userId;
    const { courseId } = req.params;

    // Verify that this course belongs to the professor
    const courseResult = await pool.query(
      `
      SELECT id, name
      FROM courses
      WHERE id = $1
        AND professor_id = $2
      `,
      [courseId, professorId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
      });
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        cs.enrolled_at
      FROM course_students cs
      INNER JOIN users u
        ON u.id = cs.student_id
      WHERE cs.course_id = $1
        AND u.role = 'student'
      ORDER BY u.first_name ASC, u.last_name ASC
      `,
      [courseId]
    );

    res.status(200).json({
      course: courseResult.rows[0],
      students: result.rows.map((student) => ({
        id: student.id,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
        enrolledAt: student.enrolled_at,
      })),
    });
  } catch (error) {
    console.error('Get course students error:', error);

    res.status(500).json({
      error: 'Unable to fetch course students',
    });
  }
};

// ==========================================
// Enroll student into course
// ==========================================
const enrollStudent = async (req, res) => {
  try {
    const professorId = req.user.userId;
    const { courseId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        error: 'Student ID is required',
      });
    }

    // Verify course belongs to professor
    const courseResult = await pool.query(
      `
      SELECT id, name
      FROM courses
      WHERE id = $1
        AND professor_id = $2
      `,
      [courseId, professorId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
      });
    }

    // Verify student exists
    const studentResult = await pool.query(
      `
      SELECT id, email, first_name, last_name
      FROM users
      WHERE id = $1
        AND role = 'student'
      `,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Student not found',
      });
    }

    // Enroll student
    const result = await pool.query(
      `
      INSERT INTO course_students
        (course_id, student_id)
      VALUES
        ($1, $2)
      ON CONFLICT (course_id, student_id)
      DO NOTHING
      RETURNING id, course_id, student_id, enrolled_at
      `,
      [courseId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: 'Student is already enrolled in this course',
      });
    }

    const student = studentResult.rows[0];

    res.status(201).json({
      message: 'Student enrolled successfully',
      enrollment: {
        id: result.rows[0].id,
        courseId: result.rows[0].course_id,
        studentId: result.rows[0].student_id,
        enrolledAt: result.rows[0].enrolled_at,
      },
      student: {
        id: student.id,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
      },
    });
  } catch (error) {
    console.error('Enroll student error:', error);

    res.status(500).json({
      error: 'Unable to enroll student',
    });
  }
};

// ==========================================
// Remove student from course
// ==========================================
const removeStudent = async (req, res) => {
  try {
    const professorId = req.user.userId;
    const { courseId, studentId } = req.params;

    // Verify course belongs to professor
    const courseResult = await pool.query(
      `
      SELECT id
      FROM courses
      WHERE id = $1
        AND professor_id = $2
      `,
      [courseId, professorId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
      });
    }

    const result = await pool.query(
      `
      DELETE FROM course_students
      WHERE course_id = $1
        AND student_id = $2
      RETURNING id
      `,
      [courseId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Student is not enrolled in this course',
      });
    }

    res.status(200).json({
      message: 'Student removed from course successfully',
    });
  } catch (error) {
    console.error('Remove student error:', error);

    res.status(500).json({
      error: 'Unable to remove student from course',
    });
  }
};

module.exports = {
  getStudents,
  getCourseStudents,
  enrollStudent,
  removeStudent,
};