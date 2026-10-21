const jwt = require('jsonwebtoken');
const redis = require('../config/redis');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the access token and checks it hasn't been blacklisted (logout).
const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
  if (await redis.get(`bl:${payload.jti}`)) throw new AppError(401, 'Token revoked');

  req.user = { id: payload.sub, role: payload.role, jti: payload.jti, exp: payload.exp };
  next();
});

// Usage: router.get('/x', authenticate, requireRole('admin', 'vendor'), handler)
const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(new AppError(403, 'You do not have access to this resource'));

module.exports = { authenticate, requireRole };
