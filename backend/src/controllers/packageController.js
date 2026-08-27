const db = require('../config/db');

/**
 * Get all active tour packages (Public)
 */
const getAllPackages = async (req, res) => {
  try {
    const { destination, minPrice, maxPrice, search } = req.query;

    let query = `
      SELECT p.*, u.name as agency_name, ap.office_address, ap.contact_person
      FROM tour_packages p
      JOIN users u ON p.agency_id = u.id
      LEFT JOIN agency_profiles ap ON u.id = ap.user_id
      WHERE p.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    if (destination) {
      query += ` AND LOWER(p.destination) LIKE LOWER($${paramIndex++})`;
      params.push(`%${destination}%`);
    }

    if (search) {
      query += ` AND (LOWER(p.title) LIKE LOWER($${paramIndex}) OR LOWER(p.destination) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND p.price_per_person >= $${paramIndex++}`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ` AND p.price_per_person <= $${paramIndex++}`;
      params.push(Number(maxPrice));
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      packages: result.rows,
    });
  } catch (error) {
    console.error('Fetch packages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tour packages.',
    });
  }
};

/**
 * Get single package details
 */
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.*, u.name as agency_name, u.email as agency_email, u.phone as agency_phone,
             ap.office_address, ap.contact_person, ap.website
      FROM tour_packages p
      JOIN users u ON p.agency_id = u.id
      LEFT JOIN agency_profiles ap ON u.id = ap.user_id
      WHERE p.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    return res.status(200).json({
      success: true,
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Fetch single package error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch package details.',
    });
  }
};

/**
 * Create a new package (Agency only)
 */
const createPackage = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const {
      title,
      description,
      destination,
      duration_days,
      durationDays,
      duration_nights,
      durationNights,
      price_per_person,
      price,
      max_travelers,
      maxTravelers,
      start_date,
      startDate,
      end_date,
      endDate,
      image_url,
      imageUrl,
    } = req.body;

    const days = duration_days || durationDays || 1;
    const nights = duration_nights || durationNights || 0;
    const packagePrice = price_per_person || price;
    const travelers = max_travelers || maxTravelers || 20;
    const sDate = start_date || startDate || null;
    const eDate = end_date || endDate || null;
    const img = image_url || imageUrl || null;

    if (!title || !destination || !packagePrice) {
      return res.status(400).json({
        success: false,
        message: 'Title, destination, and price per person are required.',
      });
    }

    const insertQuery = `
      INSERT INTO tour_packages (
        agency_id, title, description, destination, duration_days, duration_nights,
        price_per_person, max_travelers, start_date, end_date, image_url, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      agencyId,
      title.trim(),
      description || null,
      destination.trim(),
      days,
      nights,
      packagePrice,
      travelers,
      sDate,
      eDate,
      img,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Tour package published successfully!',
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Create package error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create tour package.',
    });
  }
};

/**
 * Get agency's own packages
 */
const getAgencyPackages = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const result = await db.query(
      `SELECT * FROM tour_packages WHERE agency_id = $1 ORDER BY created_at DESC`,
      [agencyId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      packages: result.rows,
    });
  } catch (error) {
    console.error('Fetch agency packages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agency tour packages.',
    });
  }
};

module.exports = {
  getAllPackages,
  getPackageById,
  createPackage,
  getAgencyPackages,
};
