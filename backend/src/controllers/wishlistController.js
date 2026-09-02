const db = require('../config/db');

async function getAppUserId(accountId) {
  const result = await db.query('SELECT user_id FROM app_user WHERE account_id = $1', [accountId]);
  return result.rows[0]?.user_id || null;
}

/**
 * GET /api/wishlist (Auth required)
 * Returns the traveler's saved destinations and packages.
 */
const getWishlist = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only traveler accounts have a wishlist.' });
    }

    const userId = await getAppUserId(req.user.id);
    if (!userId) {
      return res.status(404).json({ success: false, message: 'Traveler profile not found.' });
    }

    const destinations = await db.query(
      `SELECT d.destination_id AS "destinationID", d.name, d.division, d.category, d.description,
              d.avg_rating AS "avgRating", usd.saved_at AS "savedAt"
       FROM user_saved_destination usd
       JOIN destination d ON d.destination_id = usd.destination_id
       WHERE usd.user_id = $1
       ORDER BY usd.saved_at DESC`,
      [userId]
    );

    const packages = await db.query(
      `SELECT p.package_id AS "packageID", p.title, p.price, p.duration, p.max_seat AS "maxSeat",
              p.discount, p.description, p.destination_id AS "destinationID", p.agency_id AS "agencyID",
              a.agency_name AS "agencyName", d.name AS "destinationName", usp.saved_at AS "savedAt"
       FROM user_saved_package usp
       JOIN tour_package p ON p.package_id = usp.package_id
       JOIN agency a ON a.agency_id = p.agency_id
       JOIN destination d ON d.destination_id = p.destination_id
       WHERE usp.user_id = $1
       ORDER BY usp.saved_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      wishlist: {
        destinations: destinations.rows,
        packages: packages.rows,
      },
      counts: {
        destinations: destinations.rows.length,
        packages: packages.rows.length,
      },
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch wishlist.' });
  }
};

/**
 * POST /api/wishlist/toggle (Auth required)
 * Body: { type: 'destination' | 'package', id: number }
 */
const toggleWishlist = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only traveler accounts can save items.' });
    }

    const { type, id } = req.body;
    if (!type || !['destination', 'package'].includes(type) || !id) {
      return res.status(400).json({
        success: false,
        message: 'A valid type ("destination" or "package") and id are required.',
      });
    }

    const userId = await getAppUserId(req.user.id);
    if (!userId) {
      return res.status(404).json({ success: false, message: 'Traveler profile not found.' });
    }

    const table = type === 'destination' ? 'user_saved_destination' : 'user_saved_package';
    const column = type === 'destination' ? 'destination_id' : 'package_id';

    const existing = await db.query(`SELECT 1 FROM ${table} WHERE user_id = $1 AND ${column} = $2`, [userId, id]);

    if (existing.rows.length > 0) {
      await db.query(`DELETE FROM ${table} WHERE user_id = $1 AND ${column} = $2`, [userId, id]);
      return res.status(200).json({ success: true, saved: false, message: 'Removed from wishlist.' });
    }

    await db.query(`INSERT INTO ${table} (user_id, ${column}) VALUES ($1, $2)`, [userId, id]);
    return res.status(200).json({ success: true, saved: true, message: 'Added to wishlist.' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(404).json({ success: false, message: 'The item you tried to save does not exist.' });
    }
    console.error('Toggle wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update wishlist.' });
  }
};

module.exports = { getWishlist, toggleWishlist };