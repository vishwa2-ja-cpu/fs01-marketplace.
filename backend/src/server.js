require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { ensureIndex } = require('./services/search');

(async () => {
  await connectDB();
  try {
    await ensureIndex();
    console.log('Elasticsearch ready');
  } catch (e) {
    console.warn(`Elasticsearch not available (${e.message}). Search will not work until it is running.`);
  }
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
