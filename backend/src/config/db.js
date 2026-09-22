const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ==========================================
// Database Initialization
// ==========================================
const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');

    // ==========================================
    // Users
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ==========================================
    // Courses - Task 2
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        professor_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (professor_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    // ==========================================
    // Course Students - Task 2
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_students (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (course_id)
          REFERENCES courses(id)
          ON DELETE CASCADE,

        FOREIGN KEY (student_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        UNIQUE(course_id, student_id)
      );
    `);

    // ==========================================
    // Groups
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        leader_id INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (leader_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    // ==========================================
    // Group Members
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (group_id)
          REFERENCES groups(id)
          ON DELETE CASCADE,

        FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        UNIQUE(group_id, user_id)
      );
    `);

    // ==========================================
    // Assignments
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP NOT NULL,
        onedrive_link VARCHAR(500),
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (created_by)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    // ==========================================
    // Task 2 - Assignment Enhancements
    // ==========================================
    await pool.query(`
      ALTER TABLE assignments
      ADD COLUMN IF NOT EXISTS course_id INTEGER,
      ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20) DEFAULT 'group';
    `);

    await pool.query(`
      UPDATE assignments
      SET submission_type = 'group'
      WHERE submission_type IS NULL;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_assignments_course'
        ) THEN
          ALTER TABLE assignments
          ADD CONSTRAINT fk_assignments_course
          FOREIGN KEY (course_id)
          REFERENCES courses(id)
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await pool.query(`
      ALTER TABLE assignments
      DROP CONSTRAINT IF EXISTS assignments_submission_type_check;
    `);

    await pool.query(`
      ALTER TABLE assignments
      ADD CONSTRAINT assignments_submission_type_check
      CHECK (submission_type IN ('individual', 'group'));
    `);
    // ==========================================
    // Assignment Groups
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_groups (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (assignment_id)
          REFERENCES assignments(id)
          ON DELETE CASCADE,

        FOREIGN KEY (group_id)
          REFERENCES groups(id)
          ON DELETE CASCADE,

        UNIQUE(assignment_id, group_id)
      );
    `);

    // ==========================================
    // Submissions
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,

        assignment_id INTEGER NOT NULL,

        group_id INTEGER,

        student_id INTEGER,

        is_submitted BOOLEAN DEFAULT FALSE,

        submitted_by INTEGER,

        submitted_at TIMESTAMP,

        acknowledged BOOLEAN DEFAULT FALSE,

        acknowledged_by INTEGER,

        acknowledged_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (assignment_id)
          REFERENCES assignments(id)
          ON DELETE CASCADE,

        FOREIGN KEY (group_id)
          REFERENCES groups(id)
          ON DELETE CASCADE,

        FOREIGN KEY (student_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        FOREIGN KEY (submitted_by)
          REFERENCES users(id)
          ON DELETE SET NULL,

        FOREIGN KEY (acknowledged_by)
          REFERENCES users(id)
          ON DELETE SET NULL,

        UNIQUE(assignment_id, group_id)
      );
    `);

    // ==========================================
    // Task 2 - Submission Enhancements
    // ==========================================
    await pool.query(`
      ALTER TABLE submissions
      ALTER COLUMN group_id DROP NOT NULL;
    `);

    await pool.query(`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS student_id INTEGER;
    `);

    await pool.query(`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;
    `);

    await pool.query(`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS acknowledged_by INTEGER;
    `);

    await pool.query(`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_submissions_student'
        ) THEN
          ALTER TABLE submissions
          ADD CONSTRAINT fk_submissions_student
          FOREIGN KEY (student_id)
          REFERENCES users(id)
          ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_submissions_acknowledged_by'
        ) THEN
          ALTER TABLE submissions
          ADD CONSTRAINT fk_submissions_acknowledged_by
          FOREIGN KEY (acknowledged_by)
          REFERENCES users(id)
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_assignment_student
      ON submissions(assignment_id, student_id)
      WHERE student_id IS NOT NULL;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_student_id
      ON submissions(student_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_acknowledged
      ON submissions(acknowledged);
    `);
    // ==========================================
    // Indexes
    // ==========================================
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_professor_id
      ON courses(professor_id);

      CREATE INDEX IF NOT EXISTS idx_course_students_course_id
      ON course_students(course_id);

      CREATE INDEX IF NOT EXISTS idx_course_students_student_id
      ON course_students(student_id);

      CREATE INDEX IF NOT EXISTS idx_groups_leader_id
      ON groups(leader_id);

      CREATE INDEX IF NOT EXISTS idx_group_members_group_id
      ON group_members(group_id);

      CREATE INDEX IF NOT EXISTS idx_group_members_user_id
      ON group_members(user_id);

      CREATE INDEX IF NOT EXISTS idx_assignments_created_by
      ON assignments(created_by);

      CREATE INDEX IF NOT EXISTS idx_assignments_course_id
      ON assignments(course_id);

      CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id
      ON submissions(assignment_id);

      CREATE INDEX IF NOT EXISTS idx_submissions_group_id
      ON submissions(group_id);
    `);

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

module.exports = {
  pool,
  initializeDatabase,
};