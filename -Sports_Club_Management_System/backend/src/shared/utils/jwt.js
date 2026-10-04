const jwt = require('jsonwebtoken');
const config = require('../../config/env');

function generateToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  generateToken,
  verifyToken,
};
