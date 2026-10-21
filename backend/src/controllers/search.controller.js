const { z } = require('zod');
const redis = require('../config/redis');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { searchProducts } = require('../services/search');

const CACHE_TTL = Number(process.env.SEARCH_CACHE_TTL || 60); // seconds

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().toLowerCase().max(40).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'rating']).default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const search = asyncHandler(async (req, res) => {
  // Ignore empty params like ?q=&category= that a form may send.
  const cleaned = Object.fromEntries(
    Object.entries(req.query).filter(([k, v]) => k !== 'nocache' && typeof v === 'string' && v.trim() !== '')
  );
  const parsed = querySchema.safeParse(cleaned);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw new AppError(400, 'Invalid search parameters', details);
  }
  const params = parsed.data;
  if (params.minPrice != null && params.maxPrice != null && params.minPrice > params.maxPrice) {
    throw new AppError(400, 'minPrice cannot be greater than maxPrice');
  }

  // Redis cache. The key contains a version number that changes whenever a product changes.
  const useCache = req.query.nocache !== '1'; // ?nocache=1 is used by the benchmark
  let key;
  if (useCache) {
    const version = (await redis.get('search:ver')) || '0';
    key = `search:${version}:${JSON.stringify(params)}`;
    const hit = await redis.get(key);
    if (hit) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(hit));
    }
  }

  let result;
  try {
    result = await searchProducts(params);
  } catch (e) {
    console.error('[search] query failed:', e.message);
    throw new AppError(503, 'Search is temporarily unavailable');
  }
  if (useCache) await redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
  res.set('X-Cache', useCache ? 'MISS' : 'BYPASS');
  res.json(result);
});

module.exports = { search };
