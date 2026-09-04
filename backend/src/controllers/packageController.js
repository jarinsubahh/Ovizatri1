const db = require('../config/db');

async function getAgencyIdForAccount(accountId) {
  const result = await db.query('SELECT agency_id, status FROM agency WHERE account_id = $1', [accountId]);
  return result.rows[0] || null;
}

const packageSelect = `
  SELECT p.package_id AS "packageID", p.title, p.price, p.duration, p.max_seat AS "maxSeat",
         p.discount, p.description, p.status, p.destination_id AS "destinationID", p.agency_id AS "agencyID",
         d.name AS "destinationName", d.division AS "destinationDivision", d.category AS "destinationCategory",
         a.agency_name AS "agencyName", a.phone AS "agencyPhone", a.status AS "agencyStatus"
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

const getAllPackages = async (req, res, next) => {
  try {
    const { destination, minPrice, maxPrice, search, category } = req.query;
    let query = packageSelect + " WHERE p.status = 'approved'";
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
    next(error);
  }
};

const getFeaturedPackages = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const query = `
      SELECT p.package_id AS "packageID", p.title, p.price, p.duration, p.max_seat AS "maxSeat",
             p.discount, p.description, p.status, p.destination_id AS "destinationID", p.agency_id AS "agencyID",
             d.name AS "destinationName", d.category AS "destinationCategory",
             a.agency_name AS "agencyName", a.phone AS "agencyPhone", a.status AS "agencyStatus",
             COALESCE(AVG(r.rating), 0)::numeric(3,2) AS "avgRating",
             COUNT(r.review_id) AS "reviewCount"
      FROM tour_package p
      JOIN destination d ON d.destination_id = p.destination_id
      JOIN agency a ON a.agency_id = p.agency_id
      LEFT JOIN review r ON r.package_id = p.package_id
      WHERE p.status = 'approved'
      GROUP BY p.package_id, d.name, d.category, a.agency_name, a.phone, a.status
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
    next(error);
  }
};

const getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(packageSelect + " WHERE p.package_id = $1 AND p.status = 'approved'", [id]);

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
    next(error);
  }
};

const createPackage = async (req, res, next) => {
  try {
    const accountId = req.user?.id || req.user?.account_id;
    const role = req.user?.role || req.user?.account_type;

    const {
      title,
      description,
      destinationID,
      destination_id,
      duration,
      maxSeat,
      max_seat,
      price,
      discount = 0,
      amenityIDs,
      agencyID,
    } = req.body;

    const destId = destinationID || destination_id;
    const seats = maxSeat || max_seat;

    if (!destId || !title || !price || !duration || !seats) {
      return res.status(400).json({
        success: false,
        message: 'Destination ID, title, price, duration, and max seat are required.',
      });
    }

    let targetAgencyId;

    if (role === 'admin') {
      targetAgencyId = agencyID;
      if (!targetAgencyId) {
        const agencyProfile = await getAgencyIdForAccount(accountId);
        targetAgencyId = agencyProfile?.agency_id;
      }
      if (!targetAgencyId) {
        return res.status(400).json({ success: false, message: 'An agency ID must be provided.' });
      }
    } else {
      const agencyProfile = await getAgencyIdForAccount(accountId);
      if (!agencyProfile) {
        return res.status(404).json({ success: false, message: 'Agency profile not found.' });
      }
      if (agencyProfile.status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'Only verified agencies can create tour packages.',
        });
      }
      targetAgencyId = agencyProfile.agency_id;
    }

    const destRes = await db.query(
      `SELECT destination_id, status FROM destination WHERE destination_id = $1`,
      [destId]
    );

    if (destRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }

    if (destRes.rows[0].status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a package for an unapproved destination.',
      });
    }

    const initialStatus = role === 'admin' ? 'approved' : 'pending';

    const insertQuery = `
      INSERT INTO tour_package (agency_id, destination_id, title, price, duration, max_seat, discount, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING package_id AS "packageID", agency_id AS "agencyID", destination_id AS "destinationID",
                title, price, duration, max_seat AS "maxSeat", discount, description, status
    `;

    const result = await db.query(insertQuery, [
      targetAgencyId,
      destId,
      title.trim(),
      Number(price),
      Number(duration),
      Number(seats),
      Number(discount),
      description || null,
      initialStatus,
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
      message:
        role === 'admin'
          ? 'Tour package published successfully!'
          : 'Tour package submitted successfully. Pending admin approval.',
      package: created,
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ success: false, message: 'Invalid destination or amenity reference.' });
    }
    next(error);
  }
};

const getPendingPackages = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        p.*, 
        d.name AS destination_name, 
        ag.agency_name, 
        ag.phone AS agency_phone
      FROM tour_package p
      JOIN destination d ON p.destination_id = d.destination_id
      JOIN agency ag ON p.agency_id = ag.agency_id
      WHERE p.status = 'pending'
      ORDER BY p.package_id ASC
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

const updatePackageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'.",
      });
    }

    const result = await db.query(
      `UPDATE tour_package SET status = $1 WHERE package_id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tour package not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Tour package status updated to '${status}'.`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingResult = await db.query('SELECT * FROM tour_package WHERE package_id = $1', [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    const {
      title,
      description,
      destination_id,
      destinationID,
      duration,
      duration_days,
      price,
      price_per_person,
      max_seat,
      maxSeat,
      discount,
      status,
    } = req.body;

    const updateFields = [];
    const values = [];

    const finalTitle = title;
    const finalDesc = description;
    const finalDest = destination_id || destinationID;
    const finalDuration = duration !== undefined ? duration : duration_days;
    const finalPrice = price !== undefined ? price : price_per_person;
    const finalMaxSeat = max_seat !== undefined ? max_seat : maxSeat;

    if (finalTitle !== undefined) {
      updateFields.push(`title = $${values.length + 1}`);
      values.push(finalTitle.trim());
    }
    if (finalDesc !== undefined) {
      updateFields.push(`description = $${values.length + 1}`);
      values.push(finalDesc);
    }
    if (finalDest !== undefined) {
      updateFields.push(`destination_id = $${values.length + 1}`);
      values.push(finalDest);
    }
    if (finalDuration !== undefined) {
      updateFields.push(`duration = $${values.length + 1}`);
      values.push(Number(finalDuration));
    }
    if (finalPrice !== undefined) {
      updateFields.push(`price = $${values.length + 1}`);
      values.push(Number(finalPrice));
    }
    if (finalMaxSeat !== undefined) {
      updateFields.push(`max_seat = $${values.length + 1}`);
      values.push(Number(finalMaxSeat));
    }
    if (discount !== undefined) {
      updateFields.push(`discount = $${values.length + 1}`);
      values.push(Number(discount));
    }
    if (status !== undefined) {
      updateFields.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.',
      });
    }

    values.push(id);
    const query = `UPDATE tour_package SET ${updateFields.join(', ')} WHERE package_id = $${values.length} RETURNING *`;
    const result = await db.query(query, values);

    return res.status(200).json({
      success: true,
      package: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const getAgencyPackages = async (req, res, next) => {
  try {
    const accountId = req.user?.id || req.user?.account_id;
    const agencyProfile = await getAgencyIdForAccount(accountId);
    if (!agencyProfile) {
      return res.status(404).json({ success: false, message: 'No agency profile found for this account.' });
    }
    const result = await db.query(packageSelect + ' WHERE p.agency_id = $1 ORDER BY p.package_id DESC', [agencyProfile.agency_id]);
    const withAmenities = await attachAmenities(result.rows);

    return res.status(200).json({
      success: true,
      count: withAmenities.length,
      packages: withAmenities,
    });
  } catch (error) {
    next(error);
  }
};

const deletePackage = async (req, res, next) => {
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
    next(error);
  }
};

module.exports = {
  getAllPackages,
  getFeaturedPackages,
  getPackageById,
  createPackage,
  getPendingPackages,
  updatePackageStatus,
  getAgencyPackages,
  updatePackage,
  deletePackage,
};