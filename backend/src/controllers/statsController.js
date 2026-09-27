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

const getAgencyLeaderboard = async (req, res, next) => {
  try {
    const query = `
      SELECT
        a.agency_id,
        a.agency_name,
        COUNT(DISTINCT tp.package_id) AS total_packages,
        COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.booking_id END) AS completed_bookings,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(AVG(r.rating), 0) AS avg_rating
      FROM agency a
      LEFT JOIN tour_package tp ON tp.agency_id = a.agency_id
      LEFT JOIN booking b ON b.package_id = tp.package_id
      LEFT JOIN review r ON r.package_id = tp.package_id
      GROUP BY a.agency_id, a.agency_name
      HAVING COUNT(DISTINCT tp.package_id) > 0
      ORDER BY total_revenue DESC, avg_rating DESC, a.agency_name ASC
    `;

    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const getDestinationAnalytics = async (req, res, next) => {
  try {
    const query = `
      SELECT
        d.destination_id,
        d.name AS destination_name,
        d.division,
        COUNT(DISTINCT tp.package_id) AS total_packages_offered,
        COUNT(DISTINCT b.booking_id) AS total_bookings,
        COALESCE(SUM(CASE WHEN b.payment_status IS DISTINCT FROM 'cancelled' THEN b.group_size ELSE 0 END), 0) AS total_travelers,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS confirmed_revenue,
        ROUND(COALESCE(AVG(tp.price), 0), 2) AS avg_package_price
      FROM destination d
      LEFT JOIN tour_package tp ON tp.destination_id = d.destination_id
      LEFT JOIN booking b ON b.package_id = tp.package_id
      GROUP BY d.destination_id, d.name, d.division
      ORDER BY total_travelers DESC, confirmed_revenue DESC, d.name ASC
    `;

    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const getPackagePerformance = async (req, res, next) => {
  try {
    const query = `
      SELECT
        tp.package_id,
        tp.title,
        d.name AS destination_name,
        a.agency_name,
        tp.max_seat,
        tp.price,
        COUNT(DISTINCT r.review_id) AS review_count,
        COALESCE(SUM(CASE WHEN b.payment_status IS DISTINCT FROM 'cancelled' THEN b.group_size ELSE 0 END), 0) AS booked_travelers,
        CASE
          WHEN tp.max_seat > 0 THEN
            ROUND((COALESCE(SUM(CASE WHEN b.payment_status IS DISTINCT FROM 'cancelled' THEN b.group_size ELSE 0 END), 0)::NUMERIC / tp.max_seat) * 100, 2)
          ELSE 0
        END AS occupancy_rate,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS revenue_generated
      FROM tour_package tp
      LEFT JOIN destination d ON d.destination_id = tp.destination_id
      LEFT JOIN agency a ON a.agency_id = tp.agency_id
      LEFT JOIN booking b ON b.package_id = tp.package_id
      LEFT JOIN review r ON r.package_id = tp.package_id
      GROUP BY tp.package_id, tp.title, d.name, a.agency_name, tp.max_seat, tp.price
      ORDER BY revenue_generated DESC, booked_travelers DESC, tp.title ASC
    `;

    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatsSummary,
  getAgencyLeaderboard,
  getDestinationAnalytics,
  getPackagePerformance,
};