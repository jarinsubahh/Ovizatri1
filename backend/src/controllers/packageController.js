const db = require('../config/db');

async function getAgencyIdForAccount(accountId) {
  const result = await db.query('SELECT agency_id FROM agency WHERE account_id = $1', [accountId]);
  return result.rows[0]?.agency_id || null;
}

const packageSelect = `
  SELECT p.package_id AS "packageID", p.title, p.price, p.duration, p.max_seat AS "maxSeat",
         p.discount, p.description, p.destination_id AS "destinationID", p.agency_id AS "agencyID",
         d.name AS "destinationName", d.division AS "destinationDivision", d.category AS "destinationCategory",
         a.agency_name AS "agencyName", a.status AS "agencyStatus"
  FROM tour_package p
  JOIN destination d ON d.destination_id = p.destination_id
  JOIN agency a ON a.agency_id = p.agency_id
`;

async function attachAmenities(packages) {
  if (packages.length === 0) return packages;
  const ids = packages.map((p) => p.packageID);
  const amenityRows = await db.query(
    `SELECT pa.package_id AS "packageID", am.amenity_id AS "amenityID", am.name, am.type
     FROM package_amenity pa
     JOIN amenity am ON am.amenity_id = pa.amenity_id
     WHERE pa.package_id = ANY($1::int[])`,
    [ids]
  );
  const grouped = {};
  amenityRows.rows.forEach((row) => {
    if (!grouped[row.packageID]) grouped[row.packageID] = [];
    grouped[row.packageID].push({ amenityID: row.amenityID, name: row.name, type: row.type });
  });
  return packages.map((p) => ({
    ...p,
    amenities: grouped[p.packageID] || [],
    amenityIDs: (grouped[p.packageID] || []).map((a) => a.amenityID),
  }));
}

/**
 * GET /api/packages
 * Public listing with filters: destination, category, search, minPrice, maxPrice
 */
const getAllPackages = async (req, res) => {
  try {
    const { destination, minPrice, maxPrice, search, category } = req.query;
    let query = packageSelect + ' WHERE 1=1';
    const params = [];
    let i = 1;

    if (destination) {
      query += ` AND LOWER(d.name) LIKE LOWER($${i++})`;
      params.push(`%${destination}%`);
    }
    if (category) {
      query += ` AND LOWER(d.category) = LOWER($${i++})`;
      params.push(category);
    }
    if (search) {
      query += ` AND (LOWER(p.title) LIKE LOWER($${i}) OR LOWER(d.name) LIKE LOWER($${i}) OR LOWER(p.description) LIKE LOWER($${i}))`;
      params.push(`%${search}%`);
      i++;
    }
    if (minPrice) {
      query += ` AND p.price >= $${i++}`;
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      query += ` AND p.price <= $${i++}`;
      params.push(Number(maxPrice));
    }
    query += ' ORDER BY p.package_id DESC';

    const result = await db.query(query, params);
    const withAmenities = await attachAmenities(result.rows);

    return res.status(200).json({
      success: true,
      count: withAmenities.length,
      packages: withAmenities,
    });
  } catch (error) {
    console.error('Fetch packages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tour packages.' });
  }
};

/**
 * GET /api/packages/featured
 * Ranked by average review rating, then popularity, then discount.
 */
const getFeaturedPackages = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const query = `
      SELECT p.package_id AS "packageID", p.title, p.price, p.duration, p.max_seat AS "maxSeat",
             p.discount, p.description, p.destination_id AS "destinationID", p.agency_id AS "agencyID",
             d.name AS "destinationName", d.category AS "destinationCategory",
             a.agency_name AS "agencyName", a.status AS "agencyStatus",
             COALESCE(AVG(r.rating), 0)::numeric(3,2) AS "avgRating",
             COUNT(r.review_id) AS "reviewCount"
      FROM tour_package p
      JOIN destination d ON d.destination_id = p.destination_id
      JOIN agency a ON a.agency_id = p.agency_id
      LEFT JOIN review r ON r.package_id = p.package_id
      GROUP BY p.package_id, d.name, d.category, a.agency_name, a.status
      ORDER BY "avgRating" DESC, "reviewCount" DESC, p.discount DESC, p.package_id DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    const withAmenities = await attachAmenities(result.rows);

    return res.status(200).json({
      success: true,
      count: withAmenities.length,
      packages: withAmenities,
    });
  } catch (error) {
    console.error('Featured packages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch featured packages.' });
    console.error('Get all packages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch packages.',
    });
  }
};

/**
 * GET /api/packages/:id
 */
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(packageSelect + ' WHERE p.package_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const [withAmenities] = await attachAmenities(result.rows);

    const schedules = await db.query(
      `SELECT schedule_id AS "scheduleID", departure_date AS "departureDate", return_date AS "returnDate"
       FROM tour_schedule WHERE package_id = $1 ORDER BY departure_date ASC`,
      [id]
    );

    const reviews = await db.query(
      `SELECT r.review_id AS "reviewID", r.rating, r.comment, r.review_date AS "reviewDate",
              u.fullname AS "reviewerName"
       FROM review r
       JOIN app_user u ON u.user_id = r.user_id
       WHERE r.package_id = $1
       ORDER BY r.review_date DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      package: { ...withAmenities, schedules: schedules.rows, reviews: reviews.rows },
    });
  } catch (error) {
    console.error('Fetch single package error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch package details.' });
  }
};

/**
 * POST /api/packages (Agency / Admin)
 */
const createPackage = async (req, res) => {
  try {
    const agencyId = await getAgencyIdForAccount(req.user.id);
    if (!agencyId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'No agency profile is associated with this account.' });
    }

    const {
      title,
      description,
      destinationID,
      destination_id,
      duration,
      maxSeat,
      max_seat,
      price,
      discount,
      amenityIDs,
      agencyID,
    } = req.body;

    const destId = destinationID || destination_id;
    const seats = maxSeat || max_seat || 20;
    const disc = discount || 0;

    if (!title || !destId || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Title, destination, price, and duration are required.',
      });
    }

    const finalAgencyId = req.user.role === 'admin' ? (agencyID || agencyId) : agencyId;
    if (!finalAgencyId) {
      return res.status(400).json({ success: false, message: 'An agency ID must be provided.' });
    }

    const insertQuery = `
      INSERT INTO tour_package (agency_id, destination_id, title, price, duration, max_seat, discount, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING package_id AS "packageID", agency_id AS "agencyID", destination_id AS "destinationID",
                title, price, duration, max_seat AS "maxSeat", discount, description
    `;
    const result = await db.query(insertQuery, [
      finalAgencyId,
      destId,
      title.trim(),
      Number(price),
      Number(duration),
      Number(seats),
      Number(disc),
      description || null,
    ]);
    const created = result.rows[0];

    if (Array.isArray(amenityIDs) && amenityIDs.length > 0) {
      const values = amenityIDs.map((_, idx) => `($1, $${idx + 2})`).join(', ');
      await db.query(`INSERT INTO package_amenity (package_id, amenity_id) VALUES ${values}`, [
        created.packageID,
        ...amenityIDs,
      ]);
    }
    return res.status(201).json({
      success: true,
      message: 'Tour package published successfully!',
      package: created,
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ success: false, message: 'Invalid destination or amenity reference.' });
    }
    console.error('Create package error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create tour package.' });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const existingResult = await db.query('SELECT * FROM packages WHERE package_id = $1', [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    const current = existingResult.rows[0];
    const {
      title,
      description,
      destination,
      duration_days,
      price_per_person,
      max_capacity,
      available_slots,
    } = req.body;

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      updateFields.push('title = $' + (updateFields.length + 1));
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = $' + (updateFields.length + 1));
      values.push(description);
    }
    if (destination !== undefined) {
      updateFields.push('destination = $' + (updateFields.length + 1));
      values.push(destination);
    }
    if (duration_days !== undefined) {
      updateFields.push('duration_days = $' + (updateFields.length + 1));
      values.push(Number(duration_days));
    }
    if (price_per_person !== undefined) {
      updateFields.push('price_per_person = $' + (updateFields.length + 1));
      values.push(Number(price_per_person));
    }
    if (max_capacity !== undefined) {
      updateFields.push('max_capacity = $' + (updateFields.length + 1));
      values.push(Number(max_capacity));
    }
    if (available_slots !== undefined) {
      updateFields.push('available_slots = $' + (updateFields.length + 1));
      values.push(Number(available_slots));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.',
      });
    }

    const nextMaxCapacity = max_capacity !== undefined ? Number(max_capacity) : Number(current.max_capacity);
    const nextAvailableSlots = available_slots !== undefined ? Number(available_slots) : Number(current.available_slots);

    if (nextAvailableSlots > nextMaxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'available_slots cannot be greater than max_capacity.',
      });
    }

    values.push(id);
    const query = `UPDATE packages SET ${updateFields.join(', ')} WHERE package_id = $${values.length} RETURNING *`;
    const result = await db.query(query, values);

    return res.status(200).json({
      success: true,
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Update package error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update package.',
    });
  }
};

/**
 * GET /api/packages/agency/my-packages (Agency)
 */
const getAgencyPackages = async (req, res) => {
  try {
    const agencyId = await getAgencyIdForAccount(req.user.id);
    if (!agencyId) {
      return res.status(404).json({ success: false, message: 'No agency profile found for this account.' });
    }
    const result = await db.query(packageSelect + ' WHERE p.agency_id = $1 ORDER BY p.package_id DESC', [agencyId]);
    const withAmenities = await attachAmenities(result.rows);

    return res.status(200).json({
      success: true,
      count: withAmenities.length,
      packages: withAmenities,
    });
  } catch (error) {
    console.error('Fetch agency packages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch agency tour packages.' });
  }
};

const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM tour_package WHERE package_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Package deleted successfully.',
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Delete package error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete package.' });
  }
};

module.exports = {
  getAllPackages,
  getFeaturedPackages,
  getPackageById,
  createPackage,
  getAgencyPackages,
  updatePackage,
  deletePackage,
};