const es = require('../config/elastic');
const redis = require('../config/redis');

const INDEX = process.env.ES_INDEX || 'products';
const enabled = () => process.env.ELASTIC_DISABLED !== '1';

const indexDefinition = {
  settings: { number_of_shards: 1, number_of_replicas: 0 },
  mappings: {
    properties: {
      title: { type: 'text', analyzer: 'english' },
      description: { type: 'text', analyzer: 'english' },
      category: { type: 'keyword' },
      price: { type: 'float' },
      stock: { type: 'integer' },
      ratingAvg: { type: 'float' },
      ratingCount: { type: 'integer' },
      vendorId: { type: 'keyword' },
      vendorName: { type: 'keyword' },
      vendorApproved: { type: 'boolean' },
      isActive: { type: 'boolean' },
      images: { type: 'keyword', index: false },
      createdAt: { type: 'date' },
    },
  },
};

// MongoDB stays the source of truth. This is the flat copy Elasticsearch searches.
function toDoc(product, vendor) {
  return {
    title: product.title,
    description: product.description,
    category: product.category,
    price: product.price,
    stock: product.stock,
    ratingAvg: product.ratingAvg || 0,
    ratingCount: product.ratingCount || 0,
    vendorId: String(product.vendorId),
    vendorName: vendor.storeName,
    vendorApproved: vendor.status === 'approved',
    isActive: product.isActive,
    images: product.images || [],
    createdAt: product.createdAt || new Date(),
  };
}

// Changing this number makes every cached search result stale at once.
const bumpCacheVersion = () => redis.incr('search:ver');

async function ensureIndex() {
  if (!enabled()) return;
  if (!(await es.indices.exists({ index: INDEX }))) await es.indices.create({ index: INDEX, ...indexDefinition });
}

// Sync helpers never throw: if Elasticsearch is down, saving a product in MongoDB must still work.
async function safely(label, fn) {
  if (!enabled()) return;
  try {
    await fn();
    await bumpCacheVersion();
  } catch (e) {
    console.error(`[search] ${label} failed:`, e.message);
  }
}

const indexProduct = (product, vendor) =>
  safely('index', () => es.index({ index: INDEX, id: String(product._id), document: toDoc(product, vendor), refresh: 'wait_for' }));

const removeProduct = (id) =>
  safely('remove', () => es.delete({ index: INDEX, id: String(id), refresh: 'wait_for' }, { ignore: [404] }));

// When a vendor is approved/suspended/renamed, update all of their products at once.
const syncVendor = (vendor) =>
  safely('vendor sync', () =>
    es.updateByQuery({
      index: INDEX,
      query: { term: { vendorId: String(vendor._id) } },
      script: {
        source: 'ctx._source.vendorApproved = params.approved; ctx._source.vendorName = params.name;',
        params: { approved: vendor.status === 'approved', name: vendor.storeName },
      },
      refresh: true,
      conflicts: 'proceed',
    })
  );

// Pure function (no network): turns search params into an Elasticsearch request body.
function buildSearchBody({ q, category, minPrice, maxPrice, rating, sort = 'relevance', page = 1, limit = 12 }) {
  const filter = [{ term: { isActive: true } }, { term: { vendorApproved: true } }];
  if (minPrice != null || maxPrice != null) {
    filter.push({ range: { price: { ...(minPrice != null && { gte: minPrice }), ...(maxPrice != null && { lte: maxPrice }) } } });
  }
  if (rating != null) filter.push({ range: { ratingAvg: { gte: rating } } });

  const must = q
    ? [{ multi_match: { query: q, fields: ['title^3', 'category^2', 'description'], fuzziness: 'AUTO', operator: 'and' } }]
    : [{ match_all: {} }];

  const sorts = {
    relevance: q ? ['_score', { createdAt: 'desc' }] : [{ createdAt: 'desc' }],
    price_asc: [{ price: 'asc' }],
    price_desc: [{ price: 'desc' }],
    newest: [{ createdAt: 'desc' }],
    rating: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
  };

  return {
    query: { bool: { must, filter } },
    // Category is a post_filter so the category counts in the sidebar still show the other categories.
    ...(category && { post_filter: { term: { category } } }),
    sort: sorts[sort] || sorts.relevance,
    from: (page - 1) * limit,
    size: limit,
    track_total_hits: true,
    aggs: {
      categories: { terms: { field: 'category', size: 20 } },
      price: { stats: { field: 'price' } },
    },
  };
}

async function searchProducts(params) {
  const res = await es.search({ index: INDEX, ...buildSearchBody(params) });
  const total = res.hits.total.value;
  const stats = res.aggregations.price;
  return {
    items: res.hits.hits.map((h) => ({
      _id: h._id,
      ...h._source,
      vendorId: { _id: h._source.vendorId, storeName: h._source.vendorName }, // same shape as /api/products
    })),
    total,
    page: params.page,
    pages: Math.ceil(total / params.limit),
    facets: {
      categories: res.aggregations.categories.buckets.map((b) => ({ name: b.key, count: b.doc_count })),
      price: stats.count ? { min: stats.min, max: stats.max } : null,
    },
  };
}

// Rebuilds the whole index from MongoDB (used by `npm run seed` and `npm run reindex`).
async function reindexAll() {
  const Product = require('../models/Product');
  const Vendor = require('../models/Vendor');
  await es.indices.delete({ index: INDEX }, { ignore: [404] });
  await es.indices.create({ index: INDEX, ...indexDefinition });

  const vendors = new Map((await Vendor.find().lean()).map((v) => [String(v._id), v]));
  let ops = [];
  let count = 0;
  const flush = async () => {
    if (!ops.length) return;
    const r = await es.bulk({ operations: ops, refresh: false });
    if (r.errors) console.error('[reindex] some documents failed');
    ops = [];
  };

  for await (const p of Product.find().lean().cursor()) {
    const vendor = vendors.get(String(p.vendorId));
    if (!vendor) continue;
    ops.push({ index: { _index: INDEX, _id: String(p._id) } }, toDoc(p, vendor));
    count += 1;
    if (ops.length >= 2000) await flush();
  }
  await flush();
  await es.indices.refresh({ index: INDEX });
  await bumpCacheVersion();
  return count;
}

module.exports = { ensureIndex, indexProduct, removeProduct, syncVendor, buildSearchBody, searchProducts, reindexAll };
