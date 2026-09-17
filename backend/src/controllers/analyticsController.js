const { pool } = require('../config/db');

// Get overall analytics overview
const getOverviewAnalytics = async (req, res) => {
  try {
    // Total counts
    const countsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM groups) as total_groups,
        (SELECT COUNT(*) FROM assignments) as total_assignments,
        (SELECT COUNT(*) FROM submissions WHERE is_submitted = TRUE) as submitted_count,
        (SELECT COUNT(*) FROM submissions) as total_submissions
    `);

    const counts = countsResult.rows[0];

    // Submission rate
    const submissionRate = counts.total_submissions > 0 
      ? ((counts.submitted_count / counts.total_submissions) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      overview: {
        totalStudents: parseInt(counts.total_students),
        totalAdmins: parseInt(counts.total_admins),
        totalGroups: parseInt(counts.total_groups),
        totalAssignments: parseInt(counts.total_assignments),
        totalSubmissions: parseInt(counts.total_submissions),
        submittedCount: parseInt(counts.submitted_count),
        submissionRate: parseFloat(submissionRate),
      },
    });
  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get analytics by group
const getGroupAnalytics = async (req, res) => {
  try {
    const groupsResult = await pool.query(`
      SELECT 
        g.id,
        g.name,
        COUNT(DISTINCT gm.user_id) as member_count,
        COUNT(DISTINCT s.assignment_id) as total_assignment_submissions,
        COUNT(DISTINCT CASE WHEN s.is_submitted = TRUE THEN s.assignment_id END) as submitted_assignments,
        ROUND(
          COUNT(DISTINCT CASE WHEN s.is_submitted = TRUE THEN s.assignment_id END)::NUMERIC / 
          NULLIF(COUNT(DISTINCT s.assignment_id)::NUMERIC, 0) * 100, 2
        ) as submission_rate
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN submissions s ON g.id = s.group_id
      GROUP BY g.id, g.name
      ORDER BY submission_rate DESC NULLS LAST
    `);

    const groups = groupsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      memberCount: parseInt(row.member_count),
      totalAssignmentSubmissions: parseInt(row.total_assignment_submissions),
      submittedAssignments: parseInt(row.submitted_assignments),
      submissionRate: row.submission_rate ? parseFloat(row.submission_rate) : 0,
    }));

    res.status(200).json({ groups });
  } catch (error) {
    console.error('Get group analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get analytics by student
const getStudentAnalytics = async (req, res) => {
  try {
    const studentsResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT g.id) as group_count,
        COUNT(DISTINCT s.assignment_id) as submitted_assignments,
        ROUND(
          COUNT(DISTINCT s.assignment_id)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM assignments)::NUMERIC, 0) * 100, 2
        ) as submission_rate
      FROM users u
      LEFT JOIN group_members gm ON u.id = gm.user_id
      LEFT JOIN groups g ON gm.group_id = g.id
      LEFT JOIN submissions s ON u.id = s.submitted_by AND s.is_submitted = TRUE
      WHERE u.role = 'student'
      GROUP BY u.id, u.email, u.first_name, u.last_name
      ORDER BY submitted_assignments DESC
    `);

    const students = studentsResult.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      groupCount: parseInt(row.group_count),
      submittedAssignments: parseInt(row.submitted_assignments),
      submissionRate: row.submission_rate ? parseFloat(row.submission_rate) : 0,
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
    const assignmentsResult = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.due_date,
        COUNT(DISTINCT s.group_id) as total_groups_assigned,
        COUNT(DISTINCT CASE WHEN s.is_submitted = TRUE THEN s.group_id END) as groups_submitted,
        ROUND(
          COUNT(DISTINCT CASE WHEN s.is_submitted = TRUE THEN s.group_id END)::NUMERIC / 
          NULLIF(COUNT(DISTINCT s.group_id)::NUMERIC, 0) * 100, 2
        ) as submission_rate,
        MAX(CASE WHEN s.submitted_at IS NOT NULL THEN s.submitted_at END) as last_submission
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      GROUP BY a.id, a.title, a.due_date
      ORDER BY a.due_date DESC
    `);

    const assignments = assignmentsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      dueDate: row.due_date,
      totalGroupsAssigned: parseInt(row.total_groups_assigned),
      groupsSubmitted: parseInt(row.groups_submitted),
      submissionRate: row.submission_rate ? parseFloat(row.submission_rate) : 0,
      lastSubmission: row.last_submission,
    }));

    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get detailed submission status for a specific assignment
const getAssignmentDetailedStats = async (req, res) => {
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

    // Get detailed stats
    const statsResult = await pool.query(`
      SELECT 
        a.title,
        a.due_date,
        COUNT(DISTINCT g.id) as total_groups,
        COUNT(DISTINCT CASE WHEN s.is_submitted = TRUE THEN g.id END) as submitted_groups,
        COUNT(DISTINCT CASE WHEN s.is_submitted = FALSE OR s.is_submitted IS NULL THEN g.id END) as pending_groups
      FROM assignments a
      CROSS JOIN groups g
      LEFT JOIN submissions s ON a.id = s.assignment_id AND g.id = s.group_id
      WHERE a.id = $1
      GROUP BY a.id, a.title, a.due_date
    `, [assignmentId]);

    if (statsResult.rows.length === 0) {
      return res.status(200).json({
        stats: {
          title: assignmentResult.rows[0].title,
          dueDate: assignmentResult.rows[0].due_date,
          totalGroups: 0,
          submittedGroups: 0,
          pendingGroups: 0,
        },
        groupDetails: [],
      });
    }

    const stats = statsResult.rows[0];

    // Get group-wise submission details
    const groupDetailsResult = await pool.query(`
      SELECT 
        g.id,
        g.name,
        COUNT(DISTINCT gm.user_id) as member_count,
        CASE WHEN s.is_submitted = TRUE THEN 'Submitted' ELSE 'Pending' END as status,
        s.submitted_at,
        u.first_name, u.last_name
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN submissions s ON g.id = s.group_id AND s.assignment_id = $1
      LEFT JOIN users u ON s.submitted_by = u.id
      GROUP BY g.id, g.name, s.is_submitted, s.submitted_at, u.id, u.first_name, u.last_name
    `, [assignmentId]);

    const groupDetails = groupDetailsResult.rows.map(row => ({
      groupId: row.id,
      groupName: row.name,
      memberCount: parseInt(row.member_count),
      status: row.status,
      submittedAt: row.submitted_at,
      submittedBy: row.submitted_at ? `${row.first_name} ${row.last_name}` : null,
    }));

    res.status(200).json({
      stats: {
        title: stats.title,
        dueDate: stats.due_date,
        totalGroups: parseInt(stats.total_groups),
        submittedGroups: parseInt(stats.submitted_groups),
        pendingGroups: parseInt(stats.pending_groups),
        submissionRate: stats.total_groups > 0 
          ? ((parseInt(stats.submitted_groups) / parseInt(stats.total_groups)) * 100).toFixed(2)
          : 0,
      },
      groupDetails,
    });
  } catch (error) {
    console.error('Get assignment detailed stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getOverviewAnalytics,
  getGroupAnalytics,
  getStudentAnalytics,
  getAssignmentStats,
  getAssignmentDetailedStats,
};
