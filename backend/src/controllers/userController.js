const db = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * PUT/PATCH /api/users/profile
 */
const updateProfile = async (req, res) => {
  const client = await db.getClient();
  try {
    const accountId = req.user.id;
    const role = req.user.role;
    const { password, ...fields } = req.body;

    await client.query('BEGIN');

    if (password) {
      if (password.length < 6) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }
      const hash = await bcrypt.hash(password, 10);
      await client.query('UPDATE account SET password_hash = $1 WHERE account_id = $2', [hash, accountId]);
    }

    if (role === 'user') {
      const { fullname, phone, gender, dob } = fields;
      await client.query(
        `UPDATE app_user
         SET fullname = COALESCE($1, fullname),
             phone = COALESCE($2, phone),
             gender = COALESCE($3, gender),
             dob = COALESCE($4, dob)
         WHERE account_id = $5`,
        [fullname || null, phone || null, gender || null, dob || null, accountId]
      );
    } else if (role === 'agency') {
      const { ownerName, owner_name, phone, overview, websiteUrl, website_url } = fields;
      await client.query(
        `UPDATE agency
         SET owner_name = COALESCE($1, owner_name),
             phone = COALESCE($2, phone),
             overview = COALESCE($3, overview),
             website_url = COALESCE($4, website_url)
         WHERE account_id = $5`,
        [ownerName || owner_name || null, phone || null, overview || null, websiteUrl || website_url || null, accountId]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  updateProfile,
};