const db = require('../config/db');

/**
 * GET /api/stats/summary
 * Public, aggregated platform statistics for the homepage.
 */
const getStatsSummary = async (req, res) => {
  try {
    const [agencies, users, packages, bookings] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM agency WHERE status = 'verified'`),
      db.query(`SELECT COUNT(*) AS count FROM app_user`),
      db.query(`SELECT COUNT(*) AS count FROM tour_package`),
      db.query(`SELECT COUNT(*) AS count FROM booking`),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        registeredAgencies: Number(agencies.rows[0].count),
        totalUsers: Number(users.rows[0].count),
        totalPackages: Number(packages.rows[0].count),
        bookedPackages: Number(bookings.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Stats summary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch platform statistics.' });
  }
};

module.exports = { getStatsSummary };