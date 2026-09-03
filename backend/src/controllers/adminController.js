const db = require('../config/db');

/**
 * Get system statistics for Admin Dashboard
 */
const getAdminStats = async (req, res) => {
  try {
    const userStats = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'traveler' THEN 1 END) as total_travelers,
        COUNT(CASE WHEN role = 'agency' THEN 1 END) as total_agencies,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins
      FROM users
    `);

    const packageStats = await db.query(`
      SELECT 
        COUNT(*) as total_packages,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_packages
      FROM tour_packages
    `);

    const bookingStats = await db.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_price), 0) as total_revenue,
        COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed_bookings
      FROM bookings
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
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats.',
    });
  }
};

/**
 * List all users with role and profile
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.is_active, u.created_at,
             ap.agency_name, ap.is_verified as agency_verified
      FROM users u
      LEFT JOIN agency_profiles ap ON u.id = ap.user_id
      ORDER BY u.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      users: users.rows,
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users list.',
    });
  }
};

/**
 * Toggle user active status (activate/deactivate)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await db.query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, is_active`,
      [isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
    });
  }
};

/**
 * Verify an agency
 */
const verifyAgency = async (req, res) => {
  try {
    const { agencyUserId } = req.params;
    const { isVerified } = req.body;

    const result = await db.query(
      `UPDATE agency_profiles SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *`,
      [isVerified !== undefined ? isVerified : true, agencyUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Agency profile not found.' });
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
