const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');

// ==========================================
// Register a new student
// ==========================================
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Public registration always creates a student
    const newUser = await pool.query(
      `
      INSERT INTO users
        (email, password, first_name, last_name, role)
      VALUES
        ($1, $2, $3, $4, 'student')
      RETURNING id, email, first_name, last_name, role
      `,
      [email, hashedPassword, firstName, lastName]
    );

    const user = newUser.rows[0];

    const token = generateToken(
      user.id,
      user.email,
      user.role
    );

    res.status(201).json({
      message: 'Student account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Login
// ==========================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const user = userResult.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const token = generateToken(
      user.id,
      user.email,
      user.role
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Get current logged-in user
// ==========================================
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await pool.query(
      `
      SELECT
        id,
        email,
        first_name,
        last_name,
        role,
        created_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// ==========================================
// Export controllers
// ==========================================
module.exports = {
  register,
  login,
  getCurrentUser,
};