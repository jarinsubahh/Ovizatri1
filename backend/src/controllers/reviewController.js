const db = require('../config/db');

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

exports.createReview = async (req, res, next) => {
  try {
    const { package_id, rating, comment } = req.body;
    const accountId = req.user.id || req.user.account_id;
    const accountRole = req.user.role || req.user.account_type;

    if (accountRole !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only registered travelers can leave a review.',
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

    const userRes = await db.query(
      `SELECT user_id FROM app_user WHERE account_id = $1`,
      [accountId]
    );
    const appUser = userRes.rows[0];

    if (!appUser) {
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

    const result = await db.query(insertQuery, [
      appUser.user_id,
      package_id,
      numRating,
      comment || null,
    ]);
    res.status(201).json({
      success: true,
      message: 'Review posted successfully!',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this tour package.',
      });
    }
    next(error);
  }
};

exports.deleteReviewByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteQuery = `DELETE FROM review WHERE review_id = $1 RETURNING *`;
    const result = await db.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully by administrator.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};