// Rebuilds the Elasticsearch index from MongoDB. Run:  npm run reindex
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { reindexAll } = require('../src/services/search');

(async () => {
  await connectDB();
  const n = await reindexAll();
  console.log(`Reindexed ${n} products.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('Reindex failed:', e.message);
  process.exit(1);
});
