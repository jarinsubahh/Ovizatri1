const db = require('../config/db');

/**
 * GET /api/destinations/top-rated?limit=6
 */
const getTopRatedDestinations = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const result = await db.query(
      `SELECT d.destination_id AS "destinationID", d.name, d.division, d.category, d.description,
              d.avg_rating AS "avgRating", d.image_url AS "image",
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
             avg_rating AS "avgRating", image_url AS "image"
      FROM destination WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (category && category !== 'All') {
      query += ` AND LOWER(category) = LOWER($${i++})`;
      params.push(category);
    }
    if (division && division !== 'All') {
      query += ` AND LOWER(division) = LOWER($${i++})`;
      params.push(division);
    }
    query += ' ORDER BY destination_id DESC';

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
              avg_rating AS "avgRating", image_url AS "image"
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

/**
 * POST /api/destinations (Admin only)
 */
const createDestination = async (req, res) => {
  try {
    const { name, division, category, description, avg_rating, image_url } = req.body;

    if (!name?.trim() || !division?.trim() || !category?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name, division, category, and description are required.',
      });
    }

    const rating = avg_rating ? Number(avg_rating) : 5.0;
    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 0 and 5.',
      });
    }

    const query = `
      INSERT INTO destination (name, division, category, description, avg_rating, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING destination_id AS "destinationID", name, division, category, description,
                avg_rating AS "avgRating", image_url AS "image"
    `;

    const result = await db.query(query, [
      name.trim(),
      division.trim(),
      category.trim(),
      description.trim(),
      rating,
      image_url?.trim() || null,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Destination created successfully!',
      destination: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A destination with this name already exists.',
      });
    }
    console.error('Create destination error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create destination.' });
  }
};

module.exports = {
  getTopRatedDestinations,
  getAllDestinations,
  getDestinationById,
  createDestination,
};