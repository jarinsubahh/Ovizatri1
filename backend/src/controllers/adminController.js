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
 * GET /api/admin/agencies
 * Fetch all registered agencies with address, license details, and status
 */
const getAllAgencies = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        ag.agency_id,
        ag.account_id,
        ag.agency_name,
        ag.owner_name,
        ag.phone,
        ag.experience_years,
        ag.overview,
        ag.status,
        ag.website_url,
        ag.trade_license_doc_url,
        a.email,
        a.created_at AS registered_at,
        ad.street_address,
        ad.thana,
        ad.district,
        ad.division,
        ad.postal_code
      FROM agency ag
      JOIN account a ON a.account_id = ag.account_id
      LEFT JOIN address ad ON ad.address_id = ag.registered_address_id
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` WHERE ag.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await db.query(query, params);
    return res.status(200).json({ success: true, agencies: result.rows });
  } catch (error) {
    console.error('Admin get agencies error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch agencies list.' });
  }
};

/**
 * PATCH /api/admin/users/:id/status
 */
const toggleUserStatus = async (req, res) => {
  const pool = db.pool || db;
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await client.query('BEGIN');

    const account = await client.query('SELECT account_id, account_type FROM account WHERE account_id = $1', [id]);
    if (account.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (account.rows[0].account_type === 'agency') {
      const status = isActive === false ? 'suspended' : 'verified';
      const result = await client.query(
        `UPDATE agency SET status = $1 WHERE account_id = $2 RETURNING agency_id, agency_name, status`,
        [status, id]
      );
      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: `Agency ${status}.`, agency: result.rows[0] });
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'This account type has no activation flag in the current schema; no changes were made.',
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.warn('Rollback failed for toggleUserStatus:', rollbackError.message);
    }
    console.error('Toggle user status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/admin/agencies/:agencyUserId/verify
 * Accepts either agency_id or account_id
 */
const verifyAgency = async (req, res) => {
  const pool = db.pool || db;
  const client = await pool.connect();

  try {
    const { agencyUserId } = req.params;
    const { isVerified, status: explicitStatus, notes } = req.body;

    let targetStatus = explicitStatus;
    if (!targetStatus) {
      targetStatus = isVerified === false ? 'rejected' : 'verified';
    }

    if (!['verified', 'rejected', 'suspended', 'pending_review'].includes(targetStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE agency 
       SET status = $1 
       WHERE agency_id = $2 OR account_id = $2
       RETURNING agency_id, account_id, agency_name, status`,
      [targetStatus, agencyUserId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Agency profile not found.' });
    }

    const updatedAgency = result.rows[0];

    const admin = await client.query('SELECT admin_id FROM admin WHERE account_id = $1', [req.user.id]);
    if (admin.rows.length > 0) {
      await client.query(
        `INSERT INTO agency_audit_log (admin_id, agency_id, notes, status_changed_to)
         VALUES ($1, $2, $3, $4)`,
        [admin.rows[0].admin_id, updatedAgency.agency_id, notes || `Status changed to ${targetStatus} by admin.`, targetStatus]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Agency status updated to '${targetStatus}'.`,
      agency: updatedAgency,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.warn('Rollback failed for verifyAgency:', rollbackError.message);
    }
    console.error('Verify agency error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update agency status.',
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  getAllAgencies,
  toggleUserStatus,
  verifyAgency,
};