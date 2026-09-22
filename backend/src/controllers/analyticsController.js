const { pool } = require('../config/db');

// Get overall analytics overview
const getOverviewAnalytics = async (req, res) => {
  try {
    const professorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        (SELECT COUNT(DISTINCT cs.student_id)
         FROM course_students cs
         JOIN courses c ON cs.course_id = c.id
         WHERE c.professor_id = $1) AS total_students,

        (SELECT COUNT(*)
         FROM courses
         WHERE professor_id = $1) AS total_courses,

        (SELECT COUNT(*)
         FROM assignments
         WHERE created_by = $1) AS total_assignments,

        (SELECT COUNT(*)
         FROM assignments
         WHERE created_by = $1
           AND due_date >= CURRENT_TIMESTAMP) AS active_assignments,

        (SELECT COUNT(*)
         FROM assignments
         WHERE created_by = $1
           AND due_date < CURRENT_TIMESTAMP) AS completed_deadlines,

        (SELECT COUNT(*)
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         WHERE a.created_by = $1
           AND s.is_submitted = TRUE) AS submitted_count,

        (SELECT COUNT(*)
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         WHERE a.created_by = $1
           AND s.acknowledged = TRUE) AS acknowledged_count,

        (SELECT COUNT(*)
         FROM groups g
         WHERE EXISTS (
           SELECT 1
           FROM group_members gm
           WHERE gm.group_id = g.id
         )) AS total_groups
      `,
      [professorId]
    );

    const row = result.rows[0];

    const totalAssignments = Number(row.total_assignments);
    const submittedCount = Number(row.submitted_count);
    const acknowledgedCount = Number(row.acknowledged_count);

    const submissionRate = totalAssignments > 0
      ? Number(((submittedCount / totalAssignments) * 100).toFixed(2))
      : 0;

    const acknowledgmentRate = submittedCount > 0
      ? Number(((acknowledgedCount / submittedCount) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      overview: {
        totalStudents: Number(row.total_students),
        totalCourses: Number(row.total_courses),
        totalAssignments,
        activeAssignments: Number(row.active_assignments),
        completedDeadlines: Number(row.completed_deadlines),
        totalGroups: Number(row.total_groups),
        submittedCount,
        acknowledgedCount,
        submissionRate,
        acknowledgmentRate,
      },
    });
  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get course-wise analytics
const getCourseAnalytics = async (req, res) => {
  try {
    const professorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.description,
        COUNT(DISTINCT cs.student_id) AS student_count,
        COUNT(DISTINCT a.id) AS assignment_count,
        COUNT(DISTINCT CASE
          WHEN s.is_submitted = TRUE THEN s.id
        END) AS submitted_count,
        COUNT(DISTINCT CASE
          WHEN s.acknowledged = TRUE THEN s.id
        END) AS acknowledged_count
      FROM courses c
      LEFT JOIN course_students cs
        ON c.id = cs.course_id
      LEFT JOIN assignments a
        ON c.id = a.course_id
      LEFT JOIN submissions s
        ON a.id = s.assignment_id
      WHERE c.professor_id = $1
      GROUP BY c.id, c.name, c.description
      ORDER BY c.created_at DESC
      `,
      [professorId]
    );

    const courses = result.rows.map((row) => {
      const assignments = Number(row.assignment_count);
      const submitted = Number(row.submitted_count);

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        studentCount: Number(row.student_count),
        assignmentCount: assignments,
        submittedCount: submitted,
        acknowledgedCount: Number(row.acknowledged_count),
        submissionRate: assignments > 0
          ? Number(((submitted / assignments) * 100).toFixed(2))
          : 0,
      };
    });

    res.status(200).json({ courses });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get group-wise analytics
const getGroupAnalytics = async (req, res) => {
  try {
    const professorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        g.id,
        g.name,
        g.leader_id,
        COUNT(DISTINCT gm.user_id) AS member_count,
        COUNT(DISTINCT a.id) AS assignment_count,
        COUNT(DISTINCT CASE
          WHEN s.is_submitted = TRUE THEN s.assignment_id
        END) AS submitted_assignments,
        COUNT(DISTINCT CASE
          WHEN s.acknowledged = TRUE THEN s.assignment_id
        END) AS acknowledged_assignments
      FROM groups g
      LEFT JOIN group_members gm
        ON g.id = gm.group_id
      LEFT JOIN assignment_groups ag
        ON g.id = ag.group_id
      LEFT JOIN assignments a
        ON ag.assignment_id = a.id
        AND a.created_by = $1
      LEFT JOIN submissions s
        ON a.id = s.assignment_id
        AND g.id = s.group_id
      WHERE EXISTS (
        SELECT 1
        FROM assignment_groups ag2
        JOIN assignments a2
          ON ag2.assignment_id = a2.id
        WHERE ag2.group_id = g.id
          AND a2.created_by = $1
      )
      GROUP BY g.id, g.name, g.leader_id
      ORDER BY g.name ASC
      `,
      [professorId]
    );

    const groups = result.rows.map((row) => {
      const assignmentCount = Number(row.assignment_count);
      const submitted = Number(row.submitted_assignments);

      return {
        id: row.id,
        name: row.name,
        leaderId: row.leader_id,
        memberCount: Number(row.member_count),
        assignmentCount,
        submittedAssignments: submitted,
        acknowledgedAssignments: Number(row.acknowledged_assignments),
        submissionRate: assignmentCount > 0
          ? Number(((submitted / assignmentCount) * 100).toFixed(2))
          : 0,
      };
    });

    res.status(200).json({ groups });
  } catch (error) {
    console.error('Get group analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get student-wise analytics
const getStudentAnalytics = async (req, res) => {
  try {
    const professorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT cs.course_id) AS course_count,
        COUNT(DISTINCT CASE
          WHEN s.is_submitted = TRUE THEN s.assignment_id
        END) AS submitted_assignments,
        COUNT(DISTINCT CASE
          WHEN s.acknowledged = TRUE THEN s.assignment_id
        END) AS acknowledged_assignments
      FROM users u
      JOIN course_students cs
        ON u.id = cs.student_id
      JOIN courses c
        ON cs.course_id = c.id
        AND c.professor_id = $1
      LEFT JOIN assignments a
        ON a.course_id = c.id
      LEFT JOIN submissions s
        ON s.assignment_id = a.id
        AND (
          s.student_id = u.id
          OR EXISTS (
            SELECT 1
            FROM group_members gm
            WHERE gm.group_id = s.group_id
              AND gm.user_id = u.id
          )
        )
      WHERE u.role = 'student'
      GROUP BY u.id, u.email, u.first_name, u.last_name
      ORDER BY submitted_assignments DESC
      `,
      [professorId]
    );

    const students = result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      courseCount: Number(row.course_count),
      submittedAssignments: Number(row.submitted_assignments),
      acknowledgedAssignments: Number(row.acknowledged_assignments),
    }));

    res.status(200).json({ students });
  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get assignment submission statistics
const getAssignmentStats = async (req, res) => {
  try {
    const professorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.title,
        a.due_date,
        a.submission_type,
        a.course_id,
        c.name AS course_name,

        COUNT(DISTINCT CASE
          WHEN a.submission_type = 'group'
          THEN ag.group_id
        END) AS total_groups_assigned,

        COUNT(DISTINCT CASE
          WHEN s.is_submitted = TRUE
          THEN s.id
        END) AS submitted_count,

        COUNT(DISTINCT CASE
          WHEN s.acknowledged = TRUE
          THEN s.id
        END) AS acknowledged_count,

        MAX(s.submitted_at) AS last_submission

      FROM assignments a
      LEFT JOIN courses c
        ON a.course_id = c.id
      LEFT JOIN assignment_groups ag
        ON a.id = ag.assignment_id
      LEFT JOIN submissions s
        ON a.id = s.assignment_id
      WHERE a.created_by = $1
      GROUP BY
        a.id,
        a.title,
        a.due_date,
        a.submission_type,
        a.course_id,
        c.name
      ORDER BY a.due_date ASC
      `,
      [professorId]
    );

    const assignments = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      dueDate: row.due_date,
      submissionType: row.submission_type,
      courseId: row.course_id,
      courseName: row.course_name,
      totalGroupsAssigned: Number(row.total_groups_assigned),
      submittedCount: Number(row.submitted_count),
      acknowledgedCount: Number(row.acknowledged_count),
      lastSubmission: row.last_submission,
    }));

    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get detailed stats for a specific assignment
const getAssignmentDetailedStats = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const professorId = req.user.userId;

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
        AND a.created_by = $2
      `,
      [assignmentId, professorId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assignment not found',
      });
    }

    const assignment = assignmentResult.rows[0];

    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total_records,

        COUNT(CASE
          WHEN s.is_submitted = TRUE THEN 1
        END) AS submitted_count,

        COUNT(CASE
          WHEN s.acknowledged = TRUE THEN 1
        END) AS acknowledged_count

      FROM submissions s
      WHERE s.assignment_id = $1
      `,
      [assignmentId]
    );

    const stats = statsResult.rows[0];

    const totalRecords = Number(stats.total_records);
    const submittedCount = Number(stats.submitted_count);
    const acknowledgedCount = Number(stats.acknowledged_count);

    const submissionRate = totalRecords > 0
      ? Number(((submittedCount / totalRecords) * 100).toFixed(2))
      : 0;

    const acknowledgmentRate = submittedCount > 0
      ? Number(((acknowledgedCount / submittedCount) * 100).toFixed(2))
      : 0;

    const detailsResult = await pool.query(
      `
      SELECT
        s.id,
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
      ORDER BY s.submitted_at DESC NULLS LAST
      `,
      [assignmentId]
    );

    const details = detailsResult.rows.map((row) => ({
      id: row.id,
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
    }));

    res.status(200).json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        submissionType: assignment.submission_type,
        courseId: assignment.course_id,
        courseName: assignment.course_name,
      },
      stats: {
        totalRecords,
        submittedCount,
        pendingCount: Math.max(totalRecords - submittedCount, 0),
        acknowledgedCount,
        submissionRate,
        acknowledgmentRate,
      },
      details,
    });
  } catch (error) {
    console.error('Get assignment detailed stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getOverviewAnalytics,
  getCourseAnalytics,
  getGroupAnalytics,
  getStudentAnalytics,
  getAssignmentStats,
  getAssignmentDetailedStats,
};