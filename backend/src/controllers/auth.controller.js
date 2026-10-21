const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const redis = require('../config/redis');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { issueTokenPair } = require('../utils/tokens');

const schemas = {
  register: z.object({
    name: z.string().min(2).max(60),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    // Admins are never self-registered; use the create-admin script.
    role: z.enum(['customer', 'vendor']).default('customer'),
  }),
  login: z.object({ email: z.string().email(), password: z.string().min(1) }),
  refresh: z.object({ refreshToken: z.string().min(1) }),
  logout: z.object({ refreshToken: z.string().optional() }),
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, role, passwordHash: await User.hashPassword(password) });
  res.status(201).json({ user, ...(await issueTokenPair(user)) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message for unknown email and wrong password (prevents account enumeration).
  if (!user || !(await user.comparePassword(password))) throw new AppError(401, 'Invalid email or password');
  res.json({ user, ...(await issueTokenPair(user)) });
});

// Refresh-token rotation: each refresh token works once. A reused/revoked one is rejected.
const refresh = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }
  const key = `refresh:${payload.sub}:${payload.jti}`;
  if (!(await redis.get(key))) throw new AppError(401, 'Refresh token revoked');
  await redis.del(key);

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'User no longer exists');
  res.json(await issueTokenPair(user));
});

const logout = asyncHandler(async (req, res) => {
  // Blacklist the current access token until it would have expired anyway.
  const ttl = Math.max(req.user.exp - Math.floor(Date.now() / 1000), 1);
  await redis.set(`bl:${req.user.jti}`, '1', 'EX', ttl);

  if (req.body.refreshToken) {
    try {
      const p = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
      await redis.del(`refresh:${p.sub}:${p.jti}`);
    } catch {
      /* already invalid, nothing to revoke */
    }
  }
  res.json({ message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError(404, 'User not found');
  res.json({ user });
});

module.exports = { schemas, register, login, refresh, logout, me };
