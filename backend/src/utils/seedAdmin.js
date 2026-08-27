const bcrypt = require('bcrypt');
const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ovizatri.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';
  const adminPhone = process.env.ADMIN_PHONE || '+8801700000000';

  console.log(`Checking admin user: ${adminEmail}...`);

  try {
    const existing = await db.query('SELECT account_id FROM account WHERE LOWER(email) = LOWER($1)', [adminEmail]);

    if (existing.rows.length > 0) {
      console.log(`Admin account already exists with ID: ${existing.rows[0].account_id}. Ensuring admin role...`);
      await db.query(`UPDATE account SET account_type = 'admin' WHERE account_id = $1`, [existing.rows[0].account_id]);
      const admin = await db.query('SELECT 1 FROM admin WHERE account_id = $1', [existing.rows[0].account_id]);
      if (!admin.rows.length) await db.query('INSERT INTO admin (account_id, admin_name, role_level) VALUES ($1, $2, $3)', [existing.rows[0].account_id, adminName, 'administrator']);
      console.log('Admin account verified and role ensured.');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const result = await db.query(
      `INSERT INTO account (email, password_hash, account_type)
       VALUES ($1, $2, 'admin') RETURNING account_id, email, account_type`,
      [adminEmail, hashedPassword]
    );
    await db.query('INSERT INTO admin (account_id, admin_name, role_level) VALUES ($1, $2, $3)', [result.rows[0].account_id, adminName, 'administrator']);

    console.log('Successfully created initial Admin account:');
    console.log(result.rows[0]);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  } finally {
    // End pool if run standalone
    if (require.main === module) {
      process.exit(0);
    }
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
