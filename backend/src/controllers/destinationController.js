const db = require('../config/db');

/**
 * GET /api/destinations/top-rated?limit=6
 */
const getTopRatedDestinations = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const result = await db.query(
      `SELECT d.destination_id AS "destinationID", d.name, d.division, d.category, d.description,
              d.avg_rating AS "avgRating",
              COUNT(DISTINCT p.package_id) AS "packageCount"
       FROM destination d
       LEFT JOIN tour_package p ON p.destination_id = d.destination_id
       WHERE d.avg_rating IS NOT NULL
       GROUP BY d.destination_id
       ORDER BY d.avg_rating DESC, "packageCount" DESC
       LIMIT $1`,
      [limit]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      destinations: result.rows,
    });
  } catch (error) {
    console.error('Top-rated destinations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch top-rated destinations.' });
  }
};

/**
 * GET /api/destinations
 */
const getAllDestinations = async (req, res) => {
  try {
    const { category, division } = req.query;
    let query = `
      SELECT destination_id AS "destinationID", name, division, category, description,
             avg_rating AS "avgRating"
      FROM destination WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (category) {
      query += ` AND LOWER(category) = LOWER($${i++})`;
      params.push(category);
    }
    if (division) {
      query += ` AND LOWER(division) = LOWER($${i++})`;
      params.push(division);
    }
    query += ' ORDER BY name ASC';

    const result = await db.query(query, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      destinations: result.rows,
    });
  } catch (error) {
    console.error('List destinations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch destinations.' });
  }
};

/**
 * GET /api/destinations/:id
 */
const getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT destination_id AS "destinationID", name, division, category, description,
              avg_rating AS "avgRating"
       FROM destination WHERE destination_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }

    const packages = await db.query(
      `SELECT p.package_id AS "packageID", p.title, p.price, p.duration, p.discount,
              a.agency_name AS "agencyName"
       FROM tour_package p
       JOIN agency a ON a.agency_id = p.agency_id
       WHERE p.destination_id = $1
       ORDER BY p.package_id DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      destination: { ...result.rows[0], packages: packages.rows },
    });
  } catch (error) {
    console.error('Get destination error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch destination.' });
  }
};

module.exports = { getTopRatedDestinations, getAllDestinations, getDestinationById };