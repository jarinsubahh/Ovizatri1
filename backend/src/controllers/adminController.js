const db = require('../config/db');

/**
 * GET /api/admin/stats
 */
const getAdminStats = async (req, res) => {
  try {
    const userStats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM account) AS total_accounts,
        (SELECT COUNT(*) FROM app_user) AS total_travelers,
        (SELECT COUNT(*) FROM agency) AS total_agencies,
        (SELECT COUNT(*) FROM admin) AS total_admins
    `);

    const packageStats = await db.query(`
      SELECT COUNT(*) AS total_packages FROM tour_package
    `);

    const bookingStats = await db.query(`
      SELECT
        COUNT(*) AS total_bookings,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_bookings
      FROM booking
    `);

    return res.status(200).json({
      success: true,
      stats: {
        users: userStats.rows[0],
        packages: packageStats.rows[0],
        bookings: bookingStats.rows[0],
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
};

/**
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await db.query(`
      SELECT a.account_id AS id, a.email, a.account_type AS role, a.created_at,
             u.fullname AS traveler_name,
             ag.agency_id, ag.agency_name, ag.status AS agency_status
      FROM account a
      LEFT JOIN app_user u ON u.account_id = a.account_id
      LEFT JOIN agency ag ON ag.account_id = a.account_id
      ORDER BY a.created_at DESC
    `);

    return res.status(200).json({ success: true, users: users.rows });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users list.' });
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * The current normalized schema has no generic is_active flag on `account`;
 * activation state is modeled through `agency.status` for agency accounts.
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const account = await db.query('SELECT account_id, account_type FROM account WHERE account_id = $1', [id]);
    if (account.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (account.rows[0].account_type === 'agency') {
      const status = isActive === false ? 'suspended' : 'verified';
      const result = await db.query(
        `UPDATE agency SET status = $1 WHERE account_id = $2 RETURNING agency_id, agency_name, status`,
        [status, id]
      );
      return res.status(200).json({ success: true, message: `Agency ${status}.`, agency: result.rows[0] });
    }

    return res.status(200).json({
      success: true,
      message: 'This account type has no activation flag in the current schema; no changes were made.',
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

/**
 * PATCH /api/admin/agencies/:agencyUserId/verify
 * :agencyUserId is the agency's account_id.
 */
const verifyAgency = async (req, res) => {
  try {
    const { agencyUserId } = req.params;
    const { isVerified, notes } = req.body;
    const status = isVerified === false ? 'rejected' : 'verified';

    const result = await db.query(
      `UPDATE agency SET status = $1 WHERE account_id = $2
       RETURNING agency_id, account_id, agency_name, status`,
      [status, agencyUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Agency profile not found.' });
    }

    const admin = await db.query('SELECT admin_id FROM admin WHERE account_id = $1', [req.user.id]);
    if (admin.rows.length > 0) {
      await db.query(
        `INSERT INTO agency_audit_log (admin_id, agency_id, notes, status_changed_to)
         VALUES ($1, $2, $3, $4)`,
        [admin.rows[0].admin_id, result.rows[0].agency_id, notes || `Status changed to ${status} by admin.`, status]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Agency verification status updated successfully.',
      agency: result.rows[0],
    });
  } catch (error) {
    console.error('Verify agency error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify agency.',
    });
  }
};

exports.getAllBlogsForAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        b.*, 
        a.account_type,
        COALESCE(u.fullname, ad.admin_name, ag.agency_name, 'Ovizatri User') AS author_name
      FROM blog b
      JOIN account a ON b.account_id = a.account_id
      LEFT JOIN app_user u ON a.account_id = u.account_id
      LEFT JOIN admin ad ON a.account_id = ad.account_id
      LEFT JOIN agency ag ON a.account_id = ag.account_id
    `;
    const params = [];

    if (status) {
      query += ` WHERE b.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY b.blog_id DESC`;

    const result = await db.query(query, params);
    const blogs = result.rows || result[0];

    res.status(200).json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    next(error);
  }
};


exports.updateBlogStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'published' or 'rejected'

    if (!['published', 'rejected', 'pending', 'draft'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    const publishDate = status === 'published' ? new Date() : null;

    const query = `
      UPDATE blog 
      SET status = $1, publish_date = COALESCE(publish_date, $2)
      WHERE blog_id = $3
      RETURNING *
    `;

    const result = await db.query(query, [status, publishDate, id]);
    const updatedBlog = (result.rows && result.rows[0]) || result[0];

    if (!updatedBlog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.status(200).json({
      success: true,
      message: `Blog status updated to '${status}'`,
      data: updatedBlog,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  verifyAgency,
  getAllBlogsForAdmin: exports.getAllBlogsForAdmin,
  updateBlogStatus: exports.updateBlogStatus,
};