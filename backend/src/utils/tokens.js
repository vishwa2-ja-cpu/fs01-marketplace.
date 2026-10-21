const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const redis = require('../config/redis');

const ACCESS_TTL = () => process.env.ACCESS_TTL || '15m';
const REFRESH_TTL = () => Number(process.env.REFRESH_TTL_SECONDS || 7 * 24 * 3600);

function signAccessToken(user) {
  return jwt.sign({ role: user.role, jti: randomUUID() }, process.env.JWT_ACCESS_SECRET, {
    subject: String(user._id),
    expiresIn: ACCESS_TTL(),
  });
}

// Refresh tokens are tracked in Redis so they can be revoked and rotated.
async function issueRefreshToken(user) {
  const jti = randomUUID();
  const token = jwt.sign({ jti }, process.env.JWT_REFRESH_SECRET, {
    subject: String(user._id),
    expiresIn: REFRESH_TTL(),
  });
  await redis.set(`refresh:${user._id}:${jti}`, '1', 'EX', REFRESH_TTL());
  return token;
}

async function issueTokenPair(user) {
  return { accessToken: signAccessToken(user), refreshToken: await issueRefreshToken(user) };
}

module.exports = { signAccessToken, issueRefreshToken, issueTokenPair };
