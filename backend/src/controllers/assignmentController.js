const { pool } = require('../config/db');

// ==========================================
// Create Assignment
// ==========================================
const createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      oneDriveLink,
      courseId,
      submissionType,
    } = req.body;

    const professorId = req.user.userId;

    if (!title || !dueDate || !courseId || !submissionType) {
      return res.status(400).json({
        error: 'Title, due date, course, and submission type are required',
      });
    }

    if (!['individual', 'group'].includes(submissionType)) {
      return res.status(400).json({
        error: 'Submission type must be individual or group',
      });
    }

    if (new Date(dueDate) <= new Date()) {
      return res.status(400).json({
        error: 'Due date must be in the future',
      });
    }

    // Verify course belongs to the logged-in professor
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

    const newAssignment = await pool.query(
      `
      INSERT INTO assignments
        (
          title,
          description,
          due_date,
          onedrive_link,
          created_by,
          course_id,
          submission_type
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        title.trim(),
        description?.trim() || null,
        dueDate,
        oneDriveLink?.trim() || null,
        professorId,
        courseId,
        submissionType,
      ]
    );

    const assignment = newAssignment.rows[0];

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        oneDriveLink: assignment.onedrive_link,
        createdBy: assignment.created_by,
        courseId: assignment.course_id,
        courseName: courseResult.rows[0].name,
        submissionType: assignment.submission_type,
        createdAt: assignment.created_at,
      },
    });
  } catch (error) {
    console.error('Create assignment error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get All Assignments
// ==========================================
const getAllAssignments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.onedrive_link,
        a.created_by,
        a.course_id,
        a.submission_type,
        a.created_at,
        c.name AS course_name,
        u.first_name,
        u.last_name,
        u.email
      FROM assignments a
      JOIN users u
        ON a.created_by = u.id
      LEFT JOIN courses c
        ON a.course_id = c.id
      ORDER BY a.due_date ASC
    `);

    const assignments = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      oneDriveLink: row.onedrive_link,
      createdBy: row.created_by,
      courseId: row.course_id,
      courseName: row.course_name,
      submissionType: row.submission_type,
      professorName: `${row.first_name} ${row.last_name}`,
      professorEmail: row.email,
      createdAt: row.created_at,
    }));

    res.status(200).json({
      assignments,
    });
  } catch (error) {
    console.error('Get all assignments error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get Assignment By ID
// ==========================================
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.onedrive_link,
        a.created_by,
        a.course_id,
        a.submission_type,
        a.created_at,
        c.name AS course_name,
        u.first_name,
        u.last_name,
        u.email
      FROM assignments a
      JOIN users u
        ON a.created_by = u.id
      LEFT JOIN courses c
        ON a.course_id = c.id
      WHERE a.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const assignment = result.rows[0];

    res.status(200).json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        oneDriveLink: assignment.onedrive_link,
        createdBy: assignment.created_by,
        courseId: assignment.course_id,
        courseName: assignment.course_name,
        submissionType: assignment.submission_type,
        professorName: `${assignment.first_name} ${assignment.last_name}`,
        professorEmail: assignment.email,
        createdAt: assignment.created_at,
      },
    });
  } catch (error) {
    console.error('Get assignment by ID error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Update Assignment
// ==========================================
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      dueDate,
      oneDriveLink,
      courseId,
      submissionType,
    } = req.body;

    const professorId = req.user.userId;

    const assignmentResult = await pool.query(
      `
      SELECT *
      FROM assignments
      WHERE id = $1
      `,
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const assignment = assignmentResult.rows[0];

    if (assignment.created_by !== professorId) {
      return res.status(403).json({
        error: 'Only the creator can update this assignment',
      });
    }

    if (
      submissionType !== undefined &&
      !['individual', 'group'].includes(submissionType)
    ) {
      return res.status(400).json({
        error: 'Submission type must be individual or group',
      });
    }

    if (
      dueDate !== undefined &&
      new Date(dueDate) <= new Date()
    ) {
      return res.status(400).json({
        error: 'Due date must be in the future',
      });
    }

    // Verify course when courseId is provided
    if (courseId !== undefined) {
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
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          error: 'Title cannot be empty',
        });
      }

      updateFields.push(`title = $${paramCount}`);
      values.push(title.trim());
      paramCount++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description?.trim() || null);
      paramCount++;
    }

    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramCount}`);
      values.push(dueDate);
      paramCount++;
    }

    if (oneDriveLink !== undefined) {
      updateFields.push(`onedrive_link = $${paramCount}`);
      values.push(oneDriveLink?.trim() || null);
      paramCount++;
    }

    if (courseId !== undefined) {
      updateFields.push(`course_id = $${paramCount}`);
      values.push(courseId);
      paramCount++;
    }

    if (submissionType !== undefined) {
      updateFields.push(`submission_type = $${paramCount}`);
      values.push(submissionType);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    values.push(id);

    const updateQuery = `
      UPDATE assignments
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updatedResult = await pool.query(
      updateQuery,
      values
    );

    const updatedAssignment = updatedResult.rows[0];

    res.status(200).json({
      message: 'Assignment updated successfully',
      assignment: {
        id: updatedAssignment.id,
        title: updatedAssignment.title,
        description: updatedAssignment.description,
        dueDate: updatedAssignment.due_date,
        oneDriveLink: updatedAssignment.onedrive_link,
        courseId: updatedAssignment.course_id,
        submissionType: updatedAssignment.submission_type,
        updatedAt: updatedAssignment.updated_at,
      },
    });
  } catch (error) {
    console.error('Update assignment error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Delete Assignment
// ==========================================
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const professorId = req.user.userId;

    const assignmentResult = await pool.query(
      `
      SELECT *
      FROM assignments
      WHERE id = $1
      `,
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const assignment = assignmentResult.rows[0];

    if (assignment.created_by !== professorId) {
      return res.status(403).json({
        error: 'Only the creator can delete this assignment',
      });
    }

    await pool.query(
      'DELETE FROM assignments WHERE id = $1',
      [id]
    );

    res.status(200).json({
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('Delete assignment error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get Assignments For Group
// ==========================================
const getGroupAssignments = async (req, res) => {
  try {
    const { groupId } = req.params;

    const groupResult = await pool.query(
      `
      SELECT id
      FROM groups
      WHERE id = $1
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Group not found',
      });
    }

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.onedrive_link,
        a.created_by,
        a.course_id,
        a.submission_type,
        a.created_at,
        c.name AS course_name,
        u.first_name,
        u.last_name,
        s.id AS submission_id,
        COALESCE(s.is_submitted, false) AS is_submitted,
        s.submitted_at,
        s.submitted_by
      FROM assignments a
      JOIN assignment_groups ag
        ON a.id = ag.assignment_id
      JOIN users u
        ON a.created_by = u.id
      LEFT JOIN courses c
        ON a.course_id = c.id
      LEFT JOIN submissions s
        ON a.id = s.assignment_id
        AND s.group_id = $1
      WHERE ag.group_id = $1
      ORDER BY a.due_date ASC
      `,
      [groupId]
    );

    const assignments = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      oneDriveLink: row.onedrive_link,
      courseId: row.course_id,
      courseName: row.course_name,
      submissionType: row.submission_type,
      professorName: `${row.first_name} ${row.last_name}`,
      createdAt: row.created_at,
      isSubmitted: row.is_submitted,
      submission: row.submission_id
        ? {
            id: row.submission_id,
            isSubmitted: row.is_submitted,
            submittedAt: row.submitted_at,
            submittedBy: row.submitted_by,
          }
        : null,
    }));

    res.status(200).json({
      assignments,
    });
  } catch (error) {
    console.error('Get group assignments error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Assign Assignment To Group
// ==========================================
const assignToGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        error: 'Group ID is required',
      });
    }

    const assignmentResult = await pool.query(
      `
      SELECT
        id,
        submission_type,
        created_by
      FROM assignments
      WHERE id = $1
      `,
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const assignment = assignmentResult.rows[0];

    if (assignment.submission_type !== 'group') {
      return res.status(400).json({
        error: 'Only group assignments can be assigned to groups',
      });
    }

    if (assignment.created_by !== req.user.userId) {
      return res.status(403).json({
        error: 'Only the assignment creator can assign this assignment',
      });
    }

    const groupResult = await pool.query(
      `
      SELECT id, name
      FROM groups
      WHERE id = $1
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Group not found',
      });
    }

    const existingAssignment = await pool.query(
      `
      SELECT id
      FROM assignment_groups
      WHERE assignment_id = $1
        AND group_id = $2
      `,
      [id, groupId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(409).json({
        error: 'Assignment is already assigned to this group',
      });
    }

    await pool.query(
      `
      INSERT INTO assignment_groups
        (assignment_id, group_id)
      VALUES
        ($1, $2)
      `,
      [id, groupId]
    );

    res.status(201).json({
      message: 'Assignment assigned to group successfully',
      assignmentId: Number(id),
      groupId: Number(groupId),
      groupName: groupResult.rows[0].name,
    });
  } catch (error) {
    console.error('Assign assignment to group error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get Groups Assigned To Assignment
// ==========================================
const getAssignmentGroups = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        g.id,
        g.name,
        g.leader_id,
        g.created_at
      FROM assignment_groups ag
      JOIN groups g
        ON ag.group_id = g.id
      WHERE ag.assignment_id = $1
      ORDER BY g.name
      `,
      [id]
    );

    res.status(200).json({
      assignmentId: Number(id),
      groups: result.rows,
    });
  } catch (error) {
    console.error('Get assignment groups error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getGroupAssignments,
  assignToGroup,
  getAssignmentGroups,
};