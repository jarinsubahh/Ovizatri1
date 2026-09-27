const db = require('../config/db');

const getTopRatedDestinations = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const result = await db.query(
      `SELECT d.destination_id AS "destinationID", d.name, d.division, d.category, d.description,
              d.avg_rating AS "avgRating", d.image_url AS "image",
              COUNT(DISTINCT p.package_id) AS "packageCount"
       FROM destination d
       LEFT JOIN tour_package p ON p.destination_id = d.destination_id
       WHERE d.status = 'approved' AND d.avg_rating IS NOT NULL
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
    next(error);
  }
};
// public can view all destoination approved by admin
const getAllDestinations = async (req, res, next) => {
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
    next(error);
  }
};

const getDestinationById = async (req, res, next) => {
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
    next(error);
  }
};

const createDestination = async (req, res, next) => {
  try {
    const { name, division, category, description, avg_rating, image_url } = req.body;
    const accountId = req.user?.id || req.user?.account_id;
    const role = req.user?.role || req.user?.account_type;

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

    const existing = await db.query(
      `SELECT destination_id, status FROM destination WHERE LOWER(name) = LOWER($1)`,
      [name.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Destination '${name}' already exists with status: ${existing.rows[0].status}.`,
      });
    }

    const initialStatus = role === 'admin' ? 'approved' : 'pending';

    const query = `
      INSERT INTO destination (name, division, category, description, avg_rating, image_url, status, created_by_account_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING destination_id AS "destinationID", name, division, category, description,
                avg_rating AS "avgRating", image_url AS "image", status, created_by_account_id
    `;

    const result = await db.query(query, [
      name.trim(),
      division.trim(),
      category.trim(),
      description.trim(),
      rating,
      image_url?.trim() || null,
      initialStatus,
      accountId,
    ]);

    return res.status(201).json({
      success: true,
      message:
        role === 'admin'
          ? 'Destination added and published directly.'
          : 'Destination request submitted for admin review.',
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
    return next(error);
  }
};

const getPendingDestinations = async (req, res, next) => {
  try {
    const query = `
      SELECT d.*, a.email AS submitted_by_email, a.account_type
      FROM destination d
      LEFT JOIN account a ON d.created_by_account_id = a.account_id
      WHERE d.status = 'pending'
      ORDER BY d.destination_id ASC
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

const updateDestinationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be either 'approved' or 'rejected'." });
    }

    const result = await db.query(
      `UPDATE destination SET status = $1 WHERE destination_id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Destination has been ${status} successfully.`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTopRatedDestinations,
  getAllDestinations,
  getDestinationById,
  createDestination,
  getPendingDestinations,
  updateDestinationStatus,
};