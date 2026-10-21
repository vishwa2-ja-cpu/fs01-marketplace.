const mongoose = require('mongoose');

module.exports = async function connectDB(uri = process.env.MONGO_URI) {
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
