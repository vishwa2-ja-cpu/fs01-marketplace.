// Tests the /api/search endpoint with the Elasticsearch service mocked (no database needed).
jest.mock('../services/search', () => ({
  searchProducts: jest.fn(),
  indexProduct: jest.fn(),
  removeProduct: jest.fn(),
  syncVendor: jest.fn(),
  ensureIndex: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const redis = require('../config/redis');
const search = require('../services/search');

const emptyResult = { items: [], total: 0, page: 1, pages: 0, facets: { categories: [], price: null } };

beforeEach(async () => {
  search.searchProducts.mockReset().mockResolvedValue(emptyResult);
  await redis.flushall();
});

describe('GET /api/search', () => {
  it('passes parsed and normalised filters to the search service', async () => {
    const res = await request(app).get('/api/search?q=phone&category=Electronics&minPrice=100&sort=price_asc&limit=5');
    expect(res.status).toBe(200);
    expect(search.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'phone', category: 'electronics', minPrice: 100, sort: 'price_asc', limit: 5, page: 1 })
    );
  });

  it('ignores empty parameters sent by forms', async () => {
    const res = await request(app).get('/api/search?q=&category=&rating=');
    expect(res.status).toBe(200);
    const args = search.searchProducts.mock.calls[0][0];
    expect(args.q).toBeUndefined();
    expect(args.category).toBeUndefined();
  });

  it('rejects an unknown sort, a bad page, and min price above max price', async () => {
    expect((await request(app).get('/api/search?sort=banana')).status).toBe(400);
    expect((await request(app).get('/api/search?page=0')).status).toBe(400);
    expect((await request(app).get('/api/search?minPrice=500&maxPrice=100')).status).toBe(400);
    expect(search.searchProducts).not.toHaveBeenCalled();
  });

  it('caches results in Redis: first request MISS, second HIT, search runs once', async () => {
    const first = await request(app).get('/api/search?q=laptop');
    const second = await request(app).get('/api/search?q=laptop');
    expect(first.headers['x-cache']).toBe('MISS');
    expect(second.headers['x-cache']).toBe('HIT');
    expect(search.searchProducts).toHaveBeenCalledTimes(1);
  });

  it('different parameters do not share a cache entry', async () => {
    await request(app).get('/api/search?q=laptop');
    const other = await request(app).get('/api/search?q=laptop&sort=price_asc');
    expect(other.headers['x-cache']).toBe('MISS');
    expect(search.searchProducts).toHaveBeenCalledTimes(2);
  });

  it('nocache=1 bypasses the cache', async () => {
    await request(app).get('/api/search?q=laptop');
    const res = await request(app).get('/api/search?q=laptop&nocache=1');
    expect(res.headers['x-cache']).toBe('BYPASS');
    expect(search.searchProducts).toHaveBeenCalledTimes(2);
  });

  it('cache is invalidated when the version number changes (a product was edited)', async () => {
    await request(app).get('/api/search?q=laptop');
    await redis.incr('search:ver');
    const res = await request(app).get('/api/search?q=laptop');
    expect(res.headers['x-cache']).toBe('MISS');
  });

  it('returns 503 when Elasticsearch is down', async () => {
    search.searchProducts.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const res = await request(app).get('/api/search?q=phone');
    expect(res.status).toBe(503);
    expect(res.body.message).toBe('Search is temporarily unavailable');
  });
});
