const db = require('../config/db');

// 1. GET REVIEWS FOR A PACKAGE (Aggregates likes & dislikes)
exports.getPackageReviews = async (req, res, next) => {
  try {
    const { packageId } = req.params;
    const currentAccountId = req.user?.id || req.user?.account_id || null;

    const query = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.review_date,
        u.user_id,
        u.fullname,
        u.username,
        u.pfp_url,
        a.account_id,
        COUNT(CASE WHEN rr.reaction_type = 'like' THEN 1 END)::INT AS likes,
        COUNT(CASE WHEN rr.reaction_type = 'dislike' THEN 1 END)::INT AS dislikes,
        MAX(CASE WHEN rr.account_id = $2 THEN rr.reaction_type ELSE NULL END) AS user_reaction
      FROM review r
      JOIN app_user u ON r.user_id = u.user_id
      JOIN account a ON u.account_id = a.account_id
      LEFT JOIN review_reaction rr ON r.review_id = rr.review_id
      WHERE r.package_id = $1
      GROUP BY r.review_id, u.user_id, a.account_id
      ORDER BY r.review_id DESC
    `;

    const result = await db.query(query, [packageId, currentAccountId]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// 2. CREATE A REVIEW (Traveler / User only)
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
        message: 'Only registered travelers can write a review.',
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
      `SELECT user_id, fullname, username, pfp_url FROM app_user WHERE account_id = $1`,
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

    const createdReview = {
      ...result.rows[0],
      fullname: appUser.fullname,
      username: appUser.username,
      pfp_url: appUser.pfp_url,
      account_id: accountId,
      likes: 0,
      dislikes: 0,
      user_reaction: null,
    };

    res.status(201).json({
      success: true,
      message: 'Review posted successfully!',
      data: createdReview,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}

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

// 3. LIKE / DISLIKE REACTION (User/Traveler only)
exports.reactToReview = async (req, res, next) => {
  const pool = db.pool || db;
  const client = await pool.connect();

  try {
    const { reviewId } = req.params;
    const { reaction_type } = req.body; // 'like' | 'dislike'
    const accountId = req.user.id || req.user.account_id;
    const accountRole = req.user.role || req.user.account_type;

    if (accountRole !== 'user' && accountRole !== 'traveler') {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can like or dislike reviews.',
      });
    }

    if (!['like', 'dislike'].includes(reaction_type)) {
      return res.status(400).json({ success: false, message: 'Invalid reaction type.' });
    }

    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT reaction_id, reaction_type FROM review_reaction WHERE review_id = $1 AND account_id = $2`,
      [reviewId, accountId]
    );

    let activeReaction = null;

    if (existing.rows.length > 0) {
      if (existing.rows[0].reaction_type === reaction_type) {
        // Toggle off
        await client.query(`DELETE FROM review_reaction WHERE reaction_id = $1`, [existing.rows[0].reaction_id]);
      } else {
        // Switch like <-> dislike
        await client.query(`UPDATE review_reaction SET reaction_type = $1 WHERE reaction_id = $2`, [
          reaction_type,
          existing.rows[0].reaction_id,
        ]);
        activeReaction = reaction_type;
      }
    } else {
      await client.query(
        `INSERT INTO review_reaction (review_id, account_id, reaction_type) VALUES ($1, $2, $3)`,
        [reviewId, accountId, reaction_type]
      );
      activeReaction = reaction_type;
    }

    // Get fresh counts
    const countRes = await client.query(
      `SELECT 
         COUNT(CASE WHEN reaction_type = 'like' THEN 1 END)::INT AS likes,
         COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END)::INT AS dislikes
       FROM review_reaction WHERE review_id = $1`,
      [reviewId]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      likes: countRes.rows[0].likes,
      dislikes: countRes.rows[0].dislikes,
      user_reaction: activeReaction,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    next(error);
  } finally {
    client.release();
  }
};

// 4. DELETE REVIEW (Owner or Admin)
exports.deleteReview = async (req, res, next) => {
  const pool = db.pool || db;
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const accountId = req.user.id || req.user.account_id;
    const accountRole = req.user.role || req.user.account_type;

    await client.query('BEGIN');

    const findResult = await client.query(`SELECT review_id, user_id FROM review WHERE review_id = $1`, [id]);

    if (findResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const review = findResult.rows[0];

    if (accountRole === 'admin') {
      await client.query(`DELETE FROM review WHERE review_id = $1`, [id]);
      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'Review deleted by administrator.' });
    }

    const userRes = await client.query(`SELECT user_id FROM app_user WHERE account_id = $1`, [accountId]);
    const appUser = userRes.rows[0];

    if (!appUser || review.user_id !== appUser.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own reviews.' });
    }

    await client.query(`DELETE FROM review WHERE review_id = $1`, [id]);
    await client.query('COMMIT');

    res.status(200).json({ success: true, message: 'Your review was deleted successfully.' });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    next(error);
  } finally {
    client.release();
  }
};