const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Protect routes: Authenticates JWT token from Authorization header or cookies
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ovizatri_default_jwt_secret');
    const userId = decoded.user_id ?? decoded.id;

    const userResult = await db.query(
      `SELECT account_id AS id, account_id AS user_id, email, account_type AS role, created_at
       FROM account
       WHERE account_id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or session is invalid.',
      });
    }

    const user = userResult.rows[0];
    req.user = {
      ...user,
      user_id: user.user_id ?? user.id,
      role: user.role || 'user',
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.',
    });
  }
};

const authorizeRole = (allowedRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in first.',
      });
    }

    const userRole = String(req.user.role || '').toLowerCase();
    const normalizedAllowedRole = String(allowedRole || '').toLowerCase();

    if (userRole !== normalizedAllowedRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Access restricted to role: ${allowedRole}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles (e.g. 'admin', 'agency', 'traveler')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in first.',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Access restricted to roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeRoles,
};
