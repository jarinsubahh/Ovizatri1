const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for an authenticated user
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'ovizatri_default_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = {
  generateToken,
};
