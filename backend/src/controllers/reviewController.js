const db = require('../config/db');

// 1. GET REVIEWS FOR A PACKAGE
exports.getPackageReviews = async (req, res, next) => {
  try {
    const { packageId } = req.params;

    const query = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.review_date,
        u.user_id,
        u.fullname,
        u.username,
        u.pfp_url
      FROM review r
      JOIN app_user u ON r.user_id = u.user_id
      WHERE r.package_id = $1
      ORDER BY r.review_id DESC
    `;

    const result = await db.query(query, [packageId]);
    const reviews = result.rows || [];

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// 2. CREATE A REVIEW (Traveler only)
exports.createReview = async (req, res, next) => {
  const pool = db.pool || db;
  const client = await pool.connect();

  try {
    const { package_id, rating, comment } = req.body;
    const accountId = req.user.id || req.user.account_id;
    const accountRole = req.user.role || req.user.account_type;

    if (accountRole !== 'user' && accountRole !== 'traveler') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only registered travelers can leave a review.',
      });
    }

    if (!package_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Package ID and rating (1-5) are required.',
      });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    await client.query('BEGIN');

    const userRes = await client.query(
      `SELECT user_id FROM app_user WHERE account_id = $1`,
      [accountId]
    );
    const appUser = userRes.rows[0];

    if (!appUser) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Traveler profile not found.',
      });
    }

    const insertQuery = `
      INSERT INTO review (user_id, package_id, rating, comment, review_date)
      VALUES ($1, $2, $3, $4, CURRENT_DATE)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      appUser.user_id,
      package_id,
      numRating,
      comment || null,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Review posted successfully!',
      data: result.rows[0],
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.warn('Rollback failed for createReview:', rollbackError.message);
    }

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this tour package.',
      });
    }
    next(error);
  } finally {
    client.release();
  }
};

// 3. DELETE REVIEW (With Object-Level Ownership & Admin Override)
// Evaluated under CSE 216 Section 3.2
exports.deleteReview = async (req, res, next) => {
  const pool = db.pool || db;
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const accountId = req.user.id || req.user.account_id;
    const accountRole = req.user.role || req.user.account_type;

    await client.query('BEGIN');

    const findResult = await client.query(
      `SELECT review_id, user_id FROM review WHERE review_id = $1`,
      [id]
    );

    if (findResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    const review = findResult.rows[0];

    if (accountRole === 'admin') {
      await client.query(`DELETE FROM review WHERE review_id = $1`, [id]);
      await client.query('COMMIT');
      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully by administrator.',
      });
    }

    const userRes = await client.query(
      `SELECT user_id FROM app_user WHERE account_id = $1`,
      [accountId]
    );
    const appUser = userRes.rows[0];

    if (!appUser || review.user_id !== appUser.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own reviews.',
      });
    }

    await client.query(`DELETE FROM review WHERE review_id = $1`, [id]);
    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Your review was deleted successfully.',
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.warn('Rollback failed for deleteReview:', rollbackError.message);
    }
    next(error);
  } finally {
    client.release();
  }
};


exports.deleteReviewByAdmin = exports.deleteReview;