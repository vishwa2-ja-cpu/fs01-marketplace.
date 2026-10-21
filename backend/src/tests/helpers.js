const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');

let mongod;
let n = 0;

exports.connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};
exports.disconnect = async () => {
  await mongoose.disconnect();
  await mongod.stop();
};
exports.clear = async () => {
  for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({});
};

exports.auth = (token) => ({ Authorization: `Bearer ${token}` });

exports.makeUser = async (role = 'customer') => {
  n += 1;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: `User ${n}`, email: `user${n}@test.com`, password: 'password123', role });
  return { token: res.body.accessToken, user: res.body.user };
};

exports.makeAdmin = async () => {
  n += 1;
  const email = `admin${n}@test.com`;
  await User.create({ name: 'Admin', email, role: 'admin', passwordHash: await User.hashPassword('password123') });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return { token: res.body.accessToken };
};

// A vendor whose store is already approved.
exports.makeApprovedVendor = async (admin) => {
  const v = await exports.makeUser('vendor');
  const applied = await request(app)
    .post('/api/vendors/apply')
    .set(exports.auth(v.token))
    .send({ storeName: `Store ${n}`, description: 'Test store' });
  await request(app).patch(`/api/admin/vendors/${applied.body.vendor._id}/approve`).set(exports.auth(admin.token));
  return { ...v, vendorId: applied.body.vendor._id };
};

exports.sampleProduct = (over = {}) => ({
  title: 'Test Phone',
  description: 'A phone',
  category: 'Electronics',
  price: 9999,
  stock: 10,
  images: [],
  ...over,
});
