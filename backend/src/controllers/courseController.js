const { pool } = require('../config/db');

// ==========================================
// Get all courses for Professor
// ==========================================
const getCourses = async (req, res) => {
  try {
    const professorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.description,
        c.professor_id,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT cs.student_id)::INTEGER AS student_count
      FROM courses c
      LEFT JOIN course_students cs
        ON c.id = cs.course_id
      WHERE c.professor_id = $1
      GROUP BY
        c.id,
        c.name,
        c.description,
        c.professor_id,
        c.created_at,
        c.updated_at
      ORDER BY c.created_at DESC
      `,
      [professorId]
    );

    res.status(200).json({
      courses: result.rows,
    });
  } catch (error) {
    console.error('Get courses error:', error);

    res.status(500).json({
      error: 'Unable to fetch courses',
    });
  }
};

// ==========================================
// Create Course
// ==========================================
const createCourse = async (req, res) => {
  try {
    const professorId = req.user.userId;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Course name is required',
      });
    }

    const result = await pool.query(
      `
      INSERT INTO courses
        (name, description, professor_id)
      VALUES
        ($1, $2, $3)
      RETURNING
        id,
        name,
        description,
        professor_id,
        created_at,
        updated_at
      `,
      [
        name.trim(),
        description?.trim() || null,
        professorId,
      ]
    );

    res.status(201).json({
      message: 'Course created successfully',
      course: {
        ...result.rows[0],
        student_count: 0,
      },
    });
  } catch (error) {
    console.error('Create course error:', error);

    res.status(500).json({
      error: 'Unable to create course',
    });
  }
};

// ==========================================
// Get Single Course
// ==========================================
const getCourseById = async (req, res) => {
  try {
    const professorId = req.user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.description,
        c.professor_id,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT cs.student_id)::INTEGER AS student_count
      FROM courses c
      LEFT JOIN course_students cs
        ON c.id = cs.course_id
      WHERE c.id = $1
        AND c.professor_id = $2
      GROUP BY
        c.id,
        c.name,
        c.description,
        c.professor_id,
        c.created_at,
        c.updated_at
      `,
      [id, professorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
      });
    }

    res.status(200).json({
      course: result.rows[0],
    });
  } catch (error) {
    console.error('Get course error:', error);

    res.status(500).json({
      error: 'Unable to fetch course',
    });
  }
};

// ==========================================
// Update Course
// ==========================================
const updateCourse = async (req, res) => {
  try {
    const professorId = req.user.userId;
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Course name is required',
      });
    }

    const result = await pool.query(
      `
      UPDATE courses
      SET
        name = $1,
        description = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
        AND professor_id = $4
      RETURNING
        id,
        name,
        description,
        professor_id,
        created_at,
        updated_at
      `,
      [
        name.trim(),
        description?.trim() || null,
        id,
        professorId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
      });
    }

    res.status(200).json({
      message: 'Course updated successfully',
      course: result.rows[0],
    });
  } catch (error) {
    console.error('Update course error:', error);

    res.status(500).json({
      error: 'Unable to update course',
    });
  }
};

// ==========================================
// Delete Course
// ==========================================
const deleteCourse = async (req, res) => {
  try {
    const professorId = req.user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM courses
      WHERE id = $1
        AND professor_id = $2
      RETURNING id
      `,
      [id, professorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
      });
    }

    res.status(200).json({
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);

    res.status(500).json({
      error: 'Unable to delete course',
    });
  }
};

const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.description,
        c.professor_id,
        u.first_name AS professor_first_name,
        u.last_name AS professor_last_name,
        u.email AS professor_email,
        cs.enrolled_at
      FROM course_students cs
      JOIN courses c
        ON cs.course_id = c.id
      JOIN users u
        ON c.professor_id = u.id
      WHERE cs.student_id = $1
      ORDER BY c.name ASC
      `,
      [studentId]
    );

    const courses = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      professorId: row.professor_id,
      professorName: `${row.professor_first_name} ${row.professor_last_name}`,
      professorEmail: row.professor_email,
      enrolledAt: row.enrolled_at,
    }));

    res.status(200).json({ courses });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ error: 'Unable to fetch enrolled courses' });
  }
};

module.exports = {
  getCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getStudentCourses,
};