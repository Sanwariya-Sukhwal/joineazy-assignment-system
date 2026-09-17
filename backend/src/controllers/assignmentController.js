const { pool } = require('../config/db');

// Create a new assignment (Admin/Professor only)
const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, oneDriveLink } = req.body;
    const professorId = req.user.userId;

    // Validation
    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    // Verify due date is in the future
    if (new Date(dueDate) <= new Date()) {
      return res.status(400).json({ error: 'Due date must be in the future' });
    }

    // Create assignment
    const newAssignment = await pool.query(
      'INSERT INTO assignments (title, description, due_date, onedrive_link, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || null, dueDate, oneDriveLink || null, professorId]
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
        createdAt: assignment.created_at,
      },
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all assignments
const getAllAssignments = async (req, res) => {
  try {
    const assignmentsResult = await pool.query(`
      SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, 
             a.created_by, a.created_at,
             u.first_name, u.last_name, u.email
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      ORDER BY a.due_date ASC
    `);

    const assignments = assignmentsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      oneDriveLink: row.onedrive_link,
      createdBy: row.created_by,
      professorName: `${row.first_name} ${row.last_name}`,
      professorEmail: row.email,
      createdAt: row.created_at,
    }));

    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Get all assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignmentResult = await pool.query(`
      SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, 
             a.created_by, a.created_at,
             u.first_name, u.last_name, u.email
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `, [id]);

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];

    res.status(200).json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        oneDriveLink: assignment.onedrive_link,
        createdBy: assignment.created_by,
        professorName: `${assignment.first_name} ${assignment.last_name}`,
        professorEmail: assignment.email,
        createdAt: assignment.created_at,
      },
    });
  } catch (error) {
    console.error('Get assignment by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update assignment (Admin/Professor only)
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, oneDriveLink } = req.body;
    const professorId = req.user.userId;

    // Check if assignment exists and user is creator
    const assignmentResult = await pool.query(
      'SELECT * FROM assignments WHERE id = $1',
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];
    if (assignment.created_by !== professorId) {
      return res.status(403).json({ error: 'Only the creator can update this assignment' });
    }

    // Update assignment
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramCount}`);
      values.push(dueDate);
      paramCount++;
    }
    if (oneDriveLink !== undefined) {
      updateFields.push(`onedrive_link = $${paramCount}`);
      values.push(oneDriveLink);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE assignments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updatedAssignmentResult = await pool.query(updateQuery, values);
    const updatedAssignment = updatedAssignmentResult.rows[0];

    res.status(200).json({
      message: 'Assignment updated successfully',
      assignment: {
        id: updatedAssignment.id,
        title: updatedAssignment.title,
        description: updatedAssignment.description,
        dueDate: updatedAssignment.due_date,
        oneDriveLink: updatedAssignment.onedrive_link,
        updatedAt: updatedAssignment.updated_at,
      },
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete assignment (Admin/Professor only)
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const professorId = req.user.userId;

    // Check if assignment exists and user is creator
    const assignmentResult = await pool.query(
      'SELECT * FROM assignments WHERE id = $1',
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];
    if (assignment.created_by !== professorId) {
      return res.status(403).json({ error: 'Only the creator can delete this assignment' });
    }

    // Delete assignment (cascading delete will handle submissions)
    await pool.query('DELETE FROM assignments WHERE id = $1', [id]);

    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get assignments for a group
const getGroupAssignments = async (req, res) => {
  try {
    const { groupId } = req.params;

    const groupResult = await pool.query(
      'SELECT id FROM groups WHERE id = $1',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const assignmentsResult = await pool.query(`
      SELECT
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.onedrive_link,
        a.created_by,
        a.created_at,
        u.first_name,
        u.last_name,
        s.id AS submission_id,
        COALESCE(s.is_submitted, false) AS is_submitted,
        s.submitted_at,
        s.submitted_by
      FROM assignments a
      JOIN assignment_groups ag ON a.id = ag.assignment_id
      JOIN users u ON a.created_by = u.id
      LEFT JOIN submissions s
        ON a.id = s.assignment_id
        AND s.group_id = $1
      WHERE ag.group_id = $1
      ORDER BY a.due_date ASC
    `, [groupId]);

    const assignments = assignmentsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      oneDriveLink: row.onedrive_link,
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

    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Get group assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign assignment to a group (Admin only)
const assignToGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        error: 'Group ID is required'
      });
    }

    // Check assignment exists
    const assignmentResult = await pool.query(
      'SELECT id FROM assignments WHERE id = $1',
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found'
      });
    }

    // Check group exists
    const groupResult = await pool.query(
      'SELECT id, name FROM groups WHERE id = $1',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // Check if already assigned
    const existingAssignment = await pool.query(
      `SELECT id 
       FROM assignment_groups 
       WHERE assignment_id = $1 AND group_id = $2`,
      [id, groupId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(409).json({
        error: 'Assignment is already assigned to this group'
      });
    }

    // Assign assignment to group
    await pool.query(
      `INSERT INTO assignment_groups (assignment_id, group_id)
       VALUES ($1, $2)`,
      [id, groupId]
    );

    res.status(201).json({
      message: 'Assignment assigned to group successfully',
      assignmentId: Number(id),
      groupId: Number(groupId),
      groupName: groupResult.rows[0].name
    });

  } catch (error) {
    console.error('Assign assignment to group error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};


// Get groups assigned to an assignment
const getAssignmentGroups = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        g.id,
        g.name,
        g.leader_id,
        g.created_at
       FROM assignment_groups ag
       JOIN groups g ON ag.group_id = g.id
       WHERE ag.assignment_id = $1
       ORDER BY g.name`,
      [id]
    );

    res.status(200).json({
      assignmentId: Number(id),
      groups: result.rows
    });

  } catch (error) {
    console.error('Get assignment groups error:', error);

    res.status(500).json({
      error: 'Internal server error'
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