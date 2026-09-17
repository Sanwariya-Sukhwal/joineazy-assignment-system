const { pool } = require('../config/db');

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const leaderId = req.user.userId;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Create group
    const newGroup = await pool.query(
      'INSERT INTO groups (name, leader_id, description) VALUES ($1, $2, $3) RETURNING *',
      [name, leaderId, description || null]
    );

    const group = newGroup.rows[0];

    // Add leader as group member
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, leaderId]
    );

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        id: group.id,
        name: group.name,
        leaderId: group.leader_id,
        description: group.description,
        createdAt: group.created_at,
      },
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all groups
const getAllGroups = async (req, res) => {
  try {
    const groupsResult = await pool.query(`
      SELECT g.id, g.name, g.leader_id, g.description, g.created_at,
             u.first_name, u.last_name, u.email,
             COUNT(gm.id) as member_count
      FROM groups g
      JOIN users u ON g.leader_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id, u.id
      ORDER BY g.created_at DESC
    `);

    const groups = groupsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      leaderId: row.leader_id,
      leaderName: `${row.first_name} ${row.last_name}`,
      leaderEmail: row.email,
      description: row.description,
      memberCount: parseInt(row.member_count),
      createdAt: row.created_at,
    }));

    res.status(200).json({ groups });
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get group by ID
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const groupResult = await pool.query(`
      SELECT g.id, g.name, g.leader_id, g.description, g.created_at,
             u.first_name, u.last_name, u.email
      FROM groups g
      JOIN users u ON g.leader_id = u.id
      WHERE g.id = $1
    `, [id]);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult.rows[0];

    // Get members
    const membersResult = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at ASC
    `, [id]);

    const members = membersResult.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      joinedAt: row.joined_at,
    }));

    res.status(200).json({
      group: {
        id: group.id,
        name: group.name,
        leaderId: group.leader_id,
        leaderName: `${group.first_name} ${group.last_name}`,
        leaderEmail: group.email,
        description: group.description,
        createdAt: group.created_at,
        members,
      },
    });
  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add member to group
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const leaderId = req.user.userId;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Member email is required' });
    }

    // Check if group exists and user is leader
    const groupResult = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [id]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult.rows[0];
    if (group.leader_id !== leaderId) {
      return res.status(403).json({ error: 'Only group leader can add members' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User with this email not found' });
    }

    const userId = userResult.rows[0].id;

    // Check if user is already a member
    const memberResult = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberResult.rows.length > 0) {
      return res.status(409).json({ error: 'User is already a member of this group' });
    }

    // Add member
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [id, userId]
    );

    res.status(200).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove member from group
const removeMember = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const leaderId = req.user.userId;

    // Check if group exists and user is leader
    const groupResult = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [id]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult.rows[0];
    if (group.leader_id !== leaderId) {
      return res.status(403).json({ error: 'Only group leader can remove members' });
    }

    // Check if user is a member
    const memberResult = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, studentId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in this group' });
    }

    // Cannot remove leader
    if (parseInt(studentId) === leaderId) {
      return res.status(400).json({ error: 'Cannot remove group leader' });
    }

    // Remove member
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, studentId]
    );

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's groups
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.userId;

    const groupsResult = await pool.query(`
      SELECT g.id, g.name, g.leader_id, g.description, g.created_at,
             u.first_name, u.last_name,
             COUNT(gm.id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON g.leader_id = u.id
      WHERE gm.user_id = $1
      GROUP BY g.id, u.id
      ORDER BY g.created_at DESC
    `, [userId]);

    const groups = groupsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      leaderId: row.leader_id,
      leaderName: `${row.first_name} ${row.last_name}`,
      description: row.description,
      memberCount: parseInt(row.member_count),
      createdAt: row.created_at,
    }));

    res.status(200).json({ groups });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  addMember,
  removeMember,
  getUserGroups,
};
