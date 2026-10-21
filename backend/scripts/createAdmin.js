// Usage: npm run create-admin -- admin@example.com StrongPass123 "Admin Name"
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

(async () => {
  const [email, password, name = 'Admin'] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run create-admin -- <email> <password> [name]');
    process.exit(1);
  }
  await connectDB();
  await User.findOneAndUpdate(
    { email },
    { name, email, role: 'admin', passwordHash: await User.hashPassword(password) },
    { upsert: true, new: true }
  );
  console.log(`Admin ready: ${email}`);
  await mongoose.disconnect();
})();
