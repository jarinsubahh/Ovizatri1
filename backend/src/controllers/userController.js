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
      // Generate a new, variable salt on every password update
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
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

const deleteAccount = async (req, res) => {
  const client = await db.getClient();
  try {
    const accountId = req.user?.id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to delete this account.',
      });
    }

    const accountExists = await client.query('SELECT account_id FROM account WHERE account_id = $1', [accountId]);
    if (!accountExists.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const userRow = await client.query('SELECT user_id FROM app_user WHERE account_id = $1 LIMIT 1', [accountId]);
    const userId = userRow.rows[0]?.user_id;

    await client.query('BEGIN');

    if (userId) {
      await client.query('DELETE FROM review WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM booking WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_saved_destination WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_saved_package WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM itinerary WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM app_user WHERE account_id = $1', [accountId]);
    }

    const deletedAccount = await client.query('DELETE FROM account WHERE account_id = $1 RETURNING account_id', [accountId]);

    if (!deletedAccount.rowCount) {
      throw Object.assign(new Error('Account could not be deleted.'), { statusCode: 500 });
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete account error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete account.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  updateProfile,
  deleteAccount,
};