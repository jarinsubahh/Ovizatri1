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
      WITH package_metrics AS (
        SELECT agency_id, COUNT(*) AS total_packages
        FROM tour_package
        GROUP BY agency_id
      ),
      booking_metrics AS (
        SELECT
          tp.agency_id,
          COUNT(DISTINCT b.booking_id) FILTER (
            WHERE LOWER(TRIM(b.payment_status)) IN ('paid', 'confirmed', 'completed')
          ) AS completed_bookings,
          COALESCE(SUM(b.total_amount) FILTER (
            WHERE LOWER(TRIM(b.payment_status)) IN ('paid', 'confirmed', 'completed')
          ), 0) AS total_revenue
        FROM tour_package tp
        JOIN booking b ON b.package_id = tp.package_id
        GROUP BY tp.agency_id
      ),
      rating_metrics AS (
        SELECT tp.agency_id, COALESCE(AVG(r.rating), 0) AS avg_rating
        FROM tour_package tp
        JOIN review r ON r.package_id = tp.package_id
        GROUP BY tp.agency_id
      )
      SELECT
        a.agency_id,
        a.agency_name,
        pm.total_packages,
        COALESCE(bm.completed_bookings, 0) AS completed_bookings,
        COALESCE(bm.total_revenue, 0) AS total_revenue,
        COALESCE(rm.avg_rating, 0) AS avg_rating
      FROM agency a
      JOIN package_metrics pm ON pm.agency_id = a.agency_id
      LEFT JOIN booking_metrics bm ON bm.agency_id = a.agency_id
      LEFT JOIN rating_metrics rm ON rm.agency_id = a.agency_id
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
      WITH package_metrics AS (
        SELECT
          destination_id,
          COUNT(*) AS total_packages_offered,
          ROUND(AVG(price), 2) AS avg_package_price
        FROM tour_package
        GROUP BY destination_id
      ),
      booking_metrics AS (
        SELECT
          tp.destination_id,
          COUNT(DISTINCT b.booking_id) AS total_bookings,
          COALESCE(SUM(b.group_size) FILTER (
            WHERE LOWER(TRIM(b.payment_status)) <> 'cancelled'
          ), 0) AS total_travelers,
          COALESCE(SUM(b.total_amount) FILTER (
            WHERE LOWER(TRIM(b.payment_status)) IN ('paid', 'confirmed', 'completed')
          ), 0) AS confirmed_revenue
        FROM tour_package tp
        JOIN booking b ON b.package_id = tp.package_id
        GROUP BY tp.destination_id
      )
      SELECT
        d.destination_id,
        d.name AS destination_name,
        d.division,
        COALESCE(pm.total_packages_offered, 0) AS total_packages_offered,
        COALESCE(bm.total_bookings, 0) AS total_bookings,
        COALESCE(bm.total_travelers, 0) AS total_travelers,
        COALESCE(bm.confirmed_revenue, 0) AS confirmed_revenue,
        COALESCE(pm.avg_package_price, 0) AS avg_package_price
      FROM destination d
      LEFT JOIN package_metrics pm ON pm.destination_id = d.destination_id
      LEFT JOIN booking_metrics bm ON bm.destination_id = d.destination_id
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
      WITH booking_metrics AS (
        SELECT
          package_id,
          COALESCE(SUM(group_size) FILTER (
            WHERE LOWER(TRIM(payment_status)) <> 'cancelled'
          ), 0) AS booked_travelers,
          COALESCE(SUM(total_amount) FILTER (
            WHERE LOWER(TRIM(payment_status)) IN ('paid', 'confirmed', 'completed')
          ), 0) AS revenue_generated
        FROM booking
        GROUP BY package_id
      ),
      review_metrics AS (
        SELECT package_id, COUNT(*) AS review_count
        FROM review
        GROUP BY package_id
      )
      SELECT
        tp.package_id,
        tp.title,
        d.name AS destination_name,
        a.agency_name,
        tp.max_seat,
        tp.price,
        COALESCE(rm.review_count, 0) AS review_count,
        COALESCE(bm.booked_travelers, 0) AS booked_travelers,
        CASE
          WHEN tp.max_seat > 0 THEN
            ROUND((COALESCE(bm.booked_travelers, 0)::NUMERIC / tp.max_seat) * 100, 2)
          ELSE 0
        END AS occupancy_rate,
        COALESCE(bm.revenue_generated, 0) AS revenue_generated
      FROM tour_package tp
      LEFT JOIN destination d ON d.destination_id = tp.destination_id
      LEFT JOIN agency a ON a.agency_id = tp.agency_id
      LEFT JOIN booking_metrics bm ON bm.package_id = tp.package_id
      LEFT JOIN review_metrics rm ON rm.package_id = tp.package_id
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