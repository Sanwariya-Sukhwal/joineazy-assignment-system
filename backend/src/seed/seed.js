const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    const accounts = [
      {
        email: 'admin@gmail.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      },
      {
        email: 'professor@gmail.com',
        password: 'professor123',
        firstName: 'Professor',
        lastName: 'User',
        role: 'admin',
      },
    ];

    for (const account of accounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);

      const result = await pool.query(
        `
        INSERT INTO users
          (email, password, first_name, last_name, role)
        VALUES
          ($1, $2, $3, $4, $5)
        ON CONFLICT (email)
        DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role
        RETURNING id, email, first_name, last_name, role
        `,
        [
          account.email,
          hashedPassword,
          account.firstName,
          account.lastName,
          account.role,
        ]
      );

      const user = result.rows[0];

      console.log(`✅ ${user.email} → ${user.role}`);
    }

    console.log('');
    console.log('🎉 Professor/Admin seed completed!');
    console.log('');
    console.log('Login credentials:');
    console.log('Admin:     admin@gmail.com / admin123');
    console.log('Professor: professor@gmail.com / professor123');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedDatabase();