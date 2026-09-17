const { pool } = require('../config/db');

// Confirm submission for a group's assignment
const confirmSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { groupId } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    // Check if assignment exists
    const assignmentResult = await pool.query(
      'SELECT * FROM assignments WHERE id = $1',
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if group exists
    const groupResult = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member of the group
    const memberResult = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a member of this group' });
    }

    // Check if submission already exists
    const submissionResult = await pool.query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND group_id = $2',
      [assignmentId, groupId]
    );

    if (submissionResult.rows.length > 0) {
      // Update existing submission
      const updatedSubmission = await pool.query(
        'UPDATE submissions SET is_submitted = TRUE, submitted_by = $1, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE assignment_id = $2 AND group_id = $3 RETURNING *',
        [userId, assignmentId, groupId]
      );

      return res.status(200).json({
        message: 'Submission confirmed successfully (updated)',
        submission: {
          id: updatedSubmission.rows[0].id,
          assignmentId: updatedSubmission.rows[0].assignment_id,
          groupId: updatedSubmission.rows[0].group_id,
          isSubmitted: updatedSubmission.rows[0].is_submitted,
          submittedBy: updatedSubmission.rows[0].submitted_by,
          submittedAt: updatedSubmission.rows[0].submitted_at,
        },
      });
    }

    // Create new submission
    const newSubmission = await pool.query(
      'INSERT INTO submissions (assignment_id, group_id, is_submitted, submitted_by, submitted_at) VALUES ($1, $2, TRUE, $3, CURRENT_TIMESTAMP) RETURNING *',
      [assignmentId, groupId, userId]
    );

    const submission = newSubmission.rows[0];

    res.status(201).json({
      message: 'Submission confirmed successfully',
      submission: {
        id: submission.id,
        assignmentId: submission.assignment_id,
        groupId: submission.group_id,
        isSubmitted: submission.is_submitted,
        submittedBy: submission.submitted_by,
        submittedAt: submission.submitted_at,
      },
    });
  } catch (error) {
    console.error('Confirm submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all submissions
const getAllSubmissions = async (req, res) => {
  try {
    const submissionsResult = await pool.query(`
      SELECT s.id, s.assignment_id, s.group_id, s.is_submitted, s.submitted_by, s.submitted_at,
             a.title as assignment_title,
             g.name as group_name,
             u.first_name, u.last_name, u.email
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.submitted_by = u.id
      ORDER BY s.submitted_at DESC
    `);

    const submissions = submissionsResult.rows.map(row => ({
      id: row.id,
      assignmentId: row.assignment_id,
      assignmentTitle: row.assignment_title,
      groupId: row.group_id,
      groupName: row.group_name,
      isSubmitted: row.is_submitted,
      submittedBy: row.submitted_by,
      submittedByName: row.submitted_by ? `${row.first_name} ${row.last_name}` : null,
      submittedByEmail: row.email,
      submittedAt: row.submitted_at,
    }));

    res.status(200).json({ submissions });
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get submissions for a specific group
const getGroupSubmissions = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify group exists
    const groupResult = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const submissionsResult = await pool.query(`
      SELECT s.id, s.assignment_id, s.group_id, s.is_submitted, s.submitted_by, s.submitted_at,
             a.title as assignment_title, a.due_date,
             u.first_name, u.last_name, u.email
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN users u ON s.submitted_by = u.id
      WHERE s.group_id = $1
      ORDER BY a.due_date ASC
    `, [groupId]);

    const submissions = submissionsResult.rows.map(row => ({
      id: row.id,
      assignmentId: row.assignment_id,
      assignmentTitle: row.assignment_title,
      dueDate: row.due_date,
      groupId: row.group_id,
      isSubmitted: row.is_submitted,
      submittedBy: row.submitted_by,
      submittedByName: row.submitted_by ? `${row.first_name} ${row.last_name}` : null,
      submittedByEmail: row.email,
      submittedAt: row.submitted_at,
    }));

    res.status(200).json({ submissions });
  } catch (error) {
    console.error('Get group submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get submissions for a specific assignment
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Verify assignment exists
    const assignmentResult = await pool.query(
      'SELECT * FROM assignments WHERE id = $1',
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const submissionsResult = await pool.query(`
      SELECT s.id, s.assignment_id, s.group_id, s.is_submitted, s.submitted_by, s.submitted_at,
             g.name as group_name, g.leader_id,
             u.first_name, u.last_name, u.email
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.submitted_by = u.id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC
    `, [assignmentId]);

    const submissions = submissionsResult.rows.map(row => ({
      id: row.id,
      assignmentId: row.assignment_id,
      groupId: row.group_id,
      groupName: row.group_name,
      groupLeaderId: row.leader_id,
      isSubmitted: row.is_submitted,
      submittedBy: row.submitted_by,
      submittedByName: row.submitted_by ? `${row.first_name} ${row.last_name}` : null,
      submittedByEmail: row.email,
      submittedAt: row.submitted_at,
    }));

    res.status(200).json({ submissions });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get submission status for group and assignment
const getSubmissionStatus = async (req, res) => {
  try {
    const { assignmentId, groupId } = req.params;

    const submissionResult = await pool.query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND group_id = $2',
      [assignmentId, groupId]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(200).json({
        submission: null,
        message: 'No submission found for this assignment and group',
      });
    }

    const submission = submissionResult.rows[0];

    res.status(200).json({
      submission: {
        id: submission.id,
        assignmentId: submission.assignment_id,
        groupId: submission.group_id,
        isSubmitted: submission.is_submitted,
        submittedBy: submission.submitted_by,
        submittedAt: submission.submitted_at,
      },
    });
  } catch (error) {
    console.error('Get submission status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  confirmSubmission,
  getAllSubmissions,
  getGroupSubmissions,
  getAssignmentSubmissions,
  getSubmissionStatus,
};
