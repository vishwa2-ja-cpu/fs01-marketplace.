require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

(async () => {
  await connectDB();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
