const db = require('../config/db');

/**
 * GET /api/search?destination=&packageType=&budget=&keyword=
 * Public endpoint. `packageType` matches destination.category
 * (e.g. Beach, Hills, Rivers, Mangrove Forest). `budget` is a max price ceiling.
 */
const search = async (req, res) => {
  try {
    const { destination, packageType, budget, keyword } = req.query;

    // ---- Destinations ----
    const destParams = [];
    let destQuery = `
      SELECT destination_id AS "destinationID", name, division, category, description,
             avg_rating AS "avgRating"
      FROM destination
      WHERE 1=1
    `;
    let di = 1;
    if (keyword) {
      destQuery += ` AND (LOWER(name) LIKE LOWER($${di}) OR LOWER(description) LIKE LOWER($${di}))`;
      destParams.push(`%${keyword}%`);
      di++;
    }
    if (destination) {
      destQuery += ` AND LOWER(name) LIKE LOWER($${di})`;
      destParams.push(`%${destination}%`);
      di++;
    }
    if (packageType) {
      destQuery += ` AND LOWER(category) = LOWER($${di})`;
      destParams.push(packageType);
      di++;
    }
    destQuery += ` ORDER BY avg_rating DESC NULLS LAST, name ASC LIMIT 20`;

    // ---- Packages ----
    const pkgParams = [];
    let pkgQuery = `
      SELECT p.package_id AS "packageID", p.title, p.price, p.duration, p.max_seat AS "maxSeat",
             p.discount, p.description, p.destination_id AS "destinationID", p.agency_id AS "agencyID",
             d.name AS "destinationName", d.category AS "destinationCategory",
             a.agency_name AS "agencyName"
      FROM tour_package p
      JOIN destination d ON d.destination_id = p.destination_id
      JOIN agency a ON a.agency_id = p.agency_id
      WHERE 1=1
    `;
    let pi = 1;
    if (keyword) {
      pkgQuery += ` AND (LOWER(p.title) LIKE LOWER($${pi}) OR LOWER(p.description) LIKE LOWER($${pi}) OR LOWER(d.name) LIKE LOWER($${pi}))`;
      pkgParams.push(`%${keyword}%`);
      pi++;
    }
    if (destination) {
      pkgQuery += ` AND LOWER(d.name) LIKE LOWER($${pi})`;
      pkgParams.push(`%${destination}%`);
      pi++;
    }
    if (packageType) {
      pkgQuery += ` AND LOWER(d.category) = LOWER($${pi})`;
      pkgParams.push(packageType);
      pi++;
    }
    if (budget) {
      pkgQuery += ` AND p.price <= $${pi}`;
      pkgParams.push(Number(budget));
      pi++;
    }
    pkgQuery += ` ORDER BY p.price ASC LIMIT 30`;

    const [destResult, pkgResult] = await Promise.all([
      db.query(destQuery, destParams),
      db.query(pkgQuery, pkgParams),
    ]);

    return res.status(200).json({
      success: true,
      query: {
        destination: destination || null,
        packageType: packageType || null,
        budget: budget || null,
        keyword: keyword || null,
      },
      results: {
        destinations: destResult.rows,
        packages: pkgResult.rows,
      },
      counts: {
        destinations: destResult.rows.length,
        packages: pkgResult.rows.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: 'Failed to perform search.' });
  }
};

module.exports = { search };