// Redis holds refresh tokens + the access-token blacklist (and later: cart, search cache).
// In tests we swap in an in-memory mock so no Redis server is needed.
const isTest = process.env.NODE_ENV === 'test';
const Redis = isTest ? require('ioredis-mock') : require('ioredis');

module.exports = isTest ? new Redis() : new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
