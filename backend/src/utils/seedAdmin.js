// backend/src/utils/seedAdmin.js
const bcrypt = require('bcrypt');
const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ovizatri.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  console.log(`Checking admin user: ${adminEmail}...`);

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const existing = await db.query('SELECT account_id FROM account WHERE LOWER(email) = LOWER($1)', [adminEmail]);

    if (existing.rows.length > 0) {
      const accountId = existing.rows[0].account_id;
      console.log(`Admin account exists (ID: ${accountId}). Updating password and ensuring admin role...`);

      // Update password_hash AND account_type
      await db.query(
        `UPDATE account SET password_hash = $1, account_type = 'admin' WHERE account_id = $2`,
        [hashedPassword, accountId]
      );

      const admin = await db.query('SELECT 1 FROM admin WHERE account_id = $1', [accountId]);
      if (!admin.rows.length) {
        await db.query(
          'INSERT INTO admin (account_id, admin_name, role_level) VALUES ($1, $2, $3)',
          [accountId, adminName, 'administrator']
        );
      }
      console.log('Admin password updated successfully.');
      return;
    }

    const result = await db.query(
      `INSERT INTO account (email, password_hash, account_type)
       VALUES ($1, $2, 'admin') RETURNING account_id, email, account_type`,
      [adminEmail, hashedPassword]
    );
    await db.query(
      'INSERT INTO admin (account_id, admin_name, role_level) VALUES ($1, $2, $3)',
      [result.rows[0].account_id, adminName, 'administrator']
    );

    console.log(`Successfully created Admin account: ${adminEmail}`);
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  } finally {
    if (require.main === module) {
      process.exit(0);
    }
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;