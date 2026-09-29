const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for an authenticated user
 */
const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be configured before issuing authentication tokens.');
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = {
  generateToken,
};
