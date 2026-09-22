const { pool } = require('../config/db');

// ==========================================
// Confirm / Submit Assignment
// Supports Individual + Group
// ==========================================
const confirmSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { groupId } = req.body;
    const userId = req.user.userId;

    // ------------------------------------------
    // Get assignment
    // ------------------------------------------
    const assignmentResult = await pool.query(
      `
      SELECT
        id,
        title,
        submission_type,
        due_date
      FROM assignments
      WHERE id = $1
      `,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const assignment = assignmentResult.rows[0];

    // ------------------------------------------
    // Check due date
    // ------------------------------------------
    if (new Date(assignment.due_date) < new Date()) {
      return res.status(400).json({
        error: 'Assignment deadline has passed',
      });
    }

    // ==========================================
    // INDIVIDUAL ASSIGNMENT
    // ==========================================
    if (assignment.submission_type === 'individual') {
      const existingSubmission = await pool.query(
        `
        SELECT *
        FROM submissions
        WHERE assignment_id = $1
          AND student_id = $2
        `,
        [assignmentId, userId]
      );

      if (existingSubmission.rows.length > 0) {
        const updated = await pool.query(
          `
          UPDATE submissions
          SET
            is_submitted = TRUE,
            submitted_by = $1,
            submitted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE assignment_id = $2
            AND student_id = $3
          RETURNING *
          `,
          [userId, assignmentId, userId]
        );

        const submission = updated.rows[0];

        return res.status(200).json({
          message: 'Individual assignment submitted successfully',
          submission: formatSubmission(submission),
        });
      }

      const newSubmission = await pool.query(
        `
        INSERT INTO submissions
          (
            assignment_id,
            student_id,
            is_submitted,
            submitted_by,
            submitted_at
          )
        VALUES
          ($1, $2, TRUE, $2, CURRENT_TIMESTAMP)
        RETURNING *
        `,
        [assignmentId, userId]
      );

      return res.status(201).json({
        message: 'Individual assignment submitted successfully',
        submission: formatSubmission(newSubmission.rows[0]),
      });
    }

    // ==========================================
    // GROUP ASSIGNMENT
    // ==========================================
    if (assignment.submission_type === 'group') {
      if (!groupId) {
        return res.status(400).json({
          error: 'Group ID is required for group assignment',
        });
      }

      // Check group
      const groupResult = await pool.query(
        `
        SELECT id, name, leader_id
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

      // Check membership
      const memberResult = await pool.query(
        `
        SELECT id
        FROM group_members
        WHERE group_id = $1
          AND user_id = $2
        `,
        [groupId, userId]
      );

      if (memberResult.rows.length === 0) {
        return res.status(403).json({
          error: 'User is not a member of this group',
        });
      }

      // Verify assignment is assigned to this group
      const assignmentGroupResult = await pool.query(
        `
        SELECT id
        FROM assignment_groups
        WHERE assignment_id = $1
          AND group_id = $2
        `,
        [assignmentId, groupId]
      );

      if (assignmentGroupResult.rows.length === 0) {
        return res.status(403).json({
          error: 'This assignment is not assigned to your group',
        });
      }

      // Check existing submission
      const existingSubmission = await pool.query(
        `
        SELECT *
        FROM submissions
        WHERE assignment_id = $1
          AND group_id = $2
        `,
        [assignmentId, groupId]
      );

      if (existingSubmission.rows.length > 0) {
        const updated = await pool.query(
          `
          UPDATE submissions
          SET
            is_submitted = TRUE,
            submitted_by = $1,
            submitted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE assignment_id = $2
            AND group_id = $3
          RETURNING *
          `,
          [userId, assignmentId, groupId]
        );

        return res.status(200).json({
          message: 'Group assignment submitted successfully',
          submission: formatSubmission(updated.rows[0]),
        });
      }

      const newSubmission = await pool.query(
        `
        INSERT INTO submissions
          (
            assignment_id,
            group_id,
            is_submitted,
            submitted_by,
            submitted_at
          )
        VALUES
          ($1, $2, TRUE, $3, CURRENT_TIMESTAMP)
        RETURNING *
        `,
        [assignmentId, groupId, userId]
      );

      return res.status(201).json({
        message: 'Group assignment submitted successfully',
        submission: formatSubmission(newSubmission.rows[0]),
      });
    }

    return res.status(400).json({
      error: 'Invalid assignment submission type',
    });
  } catch (error) {
    console.error('Confirm submission error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Acknowledge Assignment
// Only Group Leader can acknowledge group assignment
// ==========================================
const acknowledgeSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { groupId } = req.body;
    const userId = req.user.userId;

    const assignmentResult = await pool.query(
      `
      SELECT
        id,
        title,
        submission_type
      FROM assignments
      WHERE id = $1
      `,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const assignment = assignmentResult.rows[0];

    // ==========================================
    // INDIVIDUAL
    // ==========================================
    if (assignment.submission_type === 'individual') {
      const submissionResult = await pool.query(
        `
        SELECT *
        FROM submissions
        WHERE assignment_id = $1
          AND student_id = $2
        `,
        [assignmentId, userId]
      );

      if (submissionResult.rows.length === 0) {
        return res.status(400).json({
          error: 'Please submit the assignment before acknowledging it',
        });
      }

      const updated = await pool.query(
        `
        UPDATE submissions
        SET
          acknowledged = TRUE,
          acknowledged_by = $1,
          acknowledged_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE assignment_id = $2
          AND student_id = $3
        RETURNING *
        `,
        [userId, assignmentId, userId]
      );

      return res.status(200).json({
        message: 'Assignment acknowledged successfully',
        submission: formatSubmission(updated.rows[0]),
      });
    }

    // ==========================================
    // GROUP
    // ==========================================
    if (assignment.submission_type === 'group') {
      if (!groupId) {
        return res.status(400).json({
          error: 'Group ID is required',
        });
      }

      const groupResult = await pool.query(
        `
        SELECT
          id,
          name,
          leader_id
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

      const group = groupResult.rows[0];

      // ==========================================
      // ONLY LEADER CAN ACKNOWLEDGE
      // ==========================================
      if (Number(group.leader_id) !== Number(userId)) {
        return res.status(403).json({
          error: 'Only the group leader can acknowledge this assignment',
        });
      }

      // Check group assignment
      const assignmentGroupResult = await pool.query(
        `
        SELECT id
        FROM assignment_groups
        WHERE assignment_id = $1
          AND group_id = $2
        `,
        [assignmentId, groupId]
      );

      if (assignmentGroupResult.rows.length === 0) {
        return res.status(403).json({
          error: 'This assignment is not assigned to this group',
        });
      }

      // Submission must exist
      const submissionResult = await pool.query(
        `
        SELECT *
        FROM submissions
        WHERE assignment_id = $1
          AND group_id = $2
        `,
        [assignmentId, groupId]
      );

      if (submissionResult.rows.length === 0) {
        return res.status(400).json({
          error: 'Please submit the assignment before acknowledging it',
        });
      }

      if (!submissionResult.rows[0].is_submitted) {
        return res.status(400).json({
          error: 'Please submit the assignment before acknowledging it',
        });
      }

      const updated = await pool.query(
        `
        UPDATE submissions
        SET
          acknowledged = TRUE,
          acknowledged_by = $1,
          acknowledged_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE assignment_id = $2
          AND group_id = $3
        RETURNING *
        `,
        [userId, assignmentId, groupId]
      );

      return res.status(200).json({
        message: 'Assignment acknowledged by group leader',
        submission: formatSubmission(updated.rows[0]),
      });
    }

    return res.status(400).json({
      error: 'Invalid assignment submission type',
    });
  } catch (error) {
    console.error('Acknowledge submission error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get All Submissions - Professor
// ==========================================
const getAllSubmissions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.assignment_id,
        s.group_id,
        s.student_id,
        s.is_submitted,
        s.submitted_by,
        s.submitted_at,
        s.acknowledged,
        s.acknowledged_by,
        s.acknowledged_at,

        a.title AS assignment_title,
        a.submission_type,
        a.due_date,

        c.id AS course_id,
        c.name AS course_name,

        g.name AS group_name,
        g.leader_id,

        u.first_name,
        u.last_name,
        u.email

      FROM submissions s

      JOIN assignments a
        ON s.assignment_id = a.id

      LEFT JOIN courses c
        ON a.course_id = c.id

      LEFT JOIN groups g
        ON s.group_id = g.id

      LEFT JOIN users u
        ON s.submitted_by = u.id

      ORDER BY a.due_date ASC, s.submitted_at DESC
    `);

    const submissions = result.rows.map(formatDetailedSubmission);

    res.status(200).json({
      submissions,
    });
  } catch (error) {
    console.error('Get all submissions error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get Group Submissions
// ==========================================
const getGroupSubmissions = async (req, res) => {
  try {
    const { groupId } = req.params;

    const groupResult = await pool.query(
      `
      SELECT id, name, leader_id
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
        s.id,
        s.assignment_id,
        s.group_id,
        s.student_id,
        s.is_submitted,
        s.submitted_by,
        s.submitted_at,
        s.acknowledged,
        s.acknowledged_by,
        s.acknowledged_at,

        a.title AS assignment_title,
        a.due_date,
        a.submission_type,

        u.first_name,
        u.last_name,
        u.email

      FROM submissions s

      JOIN assignments a
        ON s.assignment_id = a.id

      LEFT JOIN users u
        ON s.submitted_by = u.id

      WHERE s.group_id = $1

      ORDER BY a.due_date ASC
      `,
      [groupId]
    );

    res.status(200).json({
      group: groupResult.rows[0],
      submissions: result.rows.map(formatDetailedSubmission),
    });
  } catch (error) {
    console.error('Get group submissions error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get Assignment Submissions - Professor
// ==========================================
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignmentResult = await pool.query(
      `
      SELECT
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.submission_type,
        a.course_id,
        c.name AS course_name

      FROM assignments a

      LEFT JOIN courses c
        ON a.course_id = c.id

      WHERE a.id = $1
      `,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const result = await pool.query(
      `
      SELECT
        s.id,
        s.assignment_id,
        s.group_id,
        s.student_id,
        s.is_submitted,
        s.submitted_by,
        s.submitted_at,
        s.acknowledged,
        s.acknowledged_by,
        s.acknowledged_at,

        g.name AS group_name,
        g.leader_id,

        u.first_name,
        u.last_name,
        u.email

      FROM submissions s

      LEFT JOIN groups g
        ON s.group_id = g.id

      LEFT JOIN users u
        ON s.submitted_by = u.id

      WHERE s.assignment_id = $1

      ORDER BY s.submitted_at DESC
      `,
      [assignmentId]
    );

    res.status(200).json({
      assignment: assignmentResult.rows[0],
      submissions: result.rows.map(formatDetailedSubmission),
    });
  } catch (error) {
    console.error('Get assignment submissions error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get Submission Status
// ==========================================
const getSubmissionStatus = async (req, res) => {
  try {
    const { assignmentId, groupId } = req.params;
    const userId = req.user.userId;

    const assignmentResult = await pool.query(
      `
      SELECT id, submission_type
      FROM assignments
      WHERE id = $1
      `,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const assignment = assignmentResult.rows[0];

    // Individual status
    if (assignment.submission_type === 'individual') {
      const result = await pool.query(
        `
        SELECT *
        FROM submissions
        WHERE assignment_id = $1
          AND student_id = $2
        `,
        [assignmentId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({
          submission: null,
          message: 'No submission found',
        });
      }

      return res.status(200).json({
        submission: formatSubmission(result.rows[0]),
      });
    }

    // Group status
    if (!groupId) {
      return res.status(400).json({
        error: 'Group ID is required',
      });
    }

    const memberResult = await pool.query(
      `
      SELECT id
      FROM group_members
      WHERE group_id = $1
        AND user_id = $2
      `,
      [groupId, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        error: 'User is not a member of this group',
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM submissions
      WHERE assignment_id = $1
        AND group_id = $2
      `,
      [assignmentId, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        submission: null,
        message: 'No submission found',
      });
    }

    res.status(200).json({
      submission: formatSubmission(result.rows[0]),
    });
  } catch (error) {
    console.error('Get submission status error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Helpers
// ==========================================
const formatSubmission = (submission) => ({
  id: submission.id,
  assignmentId: submission.assignment_id,
  groupId: submission.group_id,
  studentId: submission.student_id,
  isSubmitted: submission.is_submitted,
  submittedBy: submission.submitted_by,
  submittedAt: submission.submitted_at,
  acknowledged: submission.acknowledged,
  acknowledgedBy: submission.acknowledged_by,
  acknowledgedAt: submission.acknowledged_at,
});

const formatDetailedSubmission = (row) => ({
  id: row.id,
  assignmentId: row.assignment_id,
  assignmentTitle: row.assignment_title,
  submissionType: row.submission_type,

  courseId: row.course_id,
  courseName: row.course_name,

  groupId: row.group_id,
  groupName: row.group_name,
  groupLeaderId: row.leader_id,

  studentId: row.student_id,

  isSubmitted: row.is_submitted,

  submittedBy: row.submitted_by,
  submittedByName: row.submitted_by
    ? `${row.first_name || ''} ${row.last_name || ''}`.trim()
    : null,
  submittedByEmail: row.email,

  submittedAt: row.submitted_at,

  acknowledged: row.acknowledged,
  acknowledgedBy: row.acknowledged_by,
  acknowledgedAt: row.acknowledged_at,

  dueDate: row.due_date,
});

module.exports = {
  confirmSubmission,
  acknowledgeSubmission,
  getAllSubmissions,
  getGroupSubmissions,
  getAssignmentSubmissions,
  getSubmissionStatus,
};