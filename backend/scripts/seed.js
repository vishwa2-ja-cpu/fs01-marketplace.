// Loads demo vendors + products from DummyJSON, then builds the Elasticsearch index.
//   npm run seed                      -> about 190 products
//   npm run seed -- --extra=10000     -> adds 10,000 generated products (for performance numbers)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Product = require('../src/models/Product');
const { reindexAll } = require('../src/services/search');

const STORES = ['TechNest', 'Urban Threads', 'HomeCraft', 'Glow Beauty', 'Fresh Basket'];
const USD_TO_INR = 83;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

(async () => {
  const extraArg = process.argv.find((a) => a.startsWith('--extra='));
  const extra = extraArg ? parseInt(extraArg.split('=')[1]) || 0 : 0;
  const t0 = Date.now();

  console.log('Downloading products from DummyJSON...');
  const res = await fetch('https://dummyjson.com/products?limit=0');
  if (!res.ok) throw new Error(`DummyJSON returned ${res.status}`);
  const base = (await res.json()).products;

  await connectDB();

  // Demo vendors (login: vendor1@demo.test ... vendor5@demo.test / Demo@12345)
  const passwordHash = await User.hashPassword('Demo@12345');
  const vendors = [];
  for (let i = 0; i < STORES.length; i++) {
    const email = `vendor${i + 1}@demo.test`;
    const user = await User.findOneAndUpdate(
      { email },
      { name: `${STORES[i]} Owner`, email, role: 'vendor', passwordHash },
      { upsert: true, new: true }
    );
    const vendor = await Vendor.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, storeName: STORES[i], description: `Demo store: ${STORES[i]}`, status: 'approved' },
      { upsert: true, new: true }
    );
    vendors.push(vendor);
  }
  await Product.deleteMany({ vendorId: { $in: vendors.map((v) => v._id) } }); // safe to re-run

  const toProduct = (p, i) => ({
    vendorId: vendors[i % vendors.length]._id,
    title: p.title,
    description: p.description,
    category: p.category,
    price: Math.max(1, Math.round(p.price * USD_TO_INR)),
    stock: p.stock ?? Math.floor(rand(5, 200)),
    images: p.images?.length ? p.images : p.thumbnail ? [p.thumbnail] : [],
    ratingAvg: Math.round((p.rating ?? rand(3, 5)) * 10) / 10,
    ratingCount: Math.floor(rand(5, 400)), // demo numbers, not real reviews
  });

  const docs = base.map(toProduct);

  // Optional: many generated variants so search can be measured on a large catalogue.
  const adjectives = ['Pro', 'Lite', 'Max', 'Classic', 'Ultra', 'Mini', 'Eco', 'Prime', 'Smart', 'Deluxe'];
  for (let i = 0; i < extra; i++) {
    const p = pick(base);
    const d = toProduct(p, i);
    d.title = `${p.title} ${pick(adjectives)} ${i}`;
    d.price = Math.max(1, Math.round(d.price * rand(0.5, 2)));
    d.ratingAvg = Math.round(rand(1, 5) * 10) / 10;
    d.createdAt = new Date(Date.now() - rand(0, 365) * 86400000);
    docs.push(d);
  }

  for (let i = 0; i < docs.length; i += 1000) await Product.insertMany(docs.slice(i, i + 1000));
  console.log(`Saved ${docs.length} products to MongoDB for ${vendors.length} vendors.`);

  const indexed = await reindexAll();
  console.log(`Indexed ${indexed} products into Elasticsearch in ${((Date.now() - t0) / 1000).toFixed(1)}s total.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
