const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const { requireRole } = require('../middleware/auth');

let mongod;
const creds = { name: 'Asha', email: 'asha@test.com', password: 'password123' };

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
beforeEach(async () => {
  await User.deleteMany({});
});

const register = (body = creds) => request(app).post('/api/auth/register').send(body);

describe('register', () => {
  it('creates a customer and returns tokens without the password hash', async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });
  it('allows registering as vendor', async () => {
    const res = await register({ ...creds, role: 'vendor' });
    expect(res.body.user.role).toBe('vendor');
  });
  it('rejects self-registering as admin', async () => {
    const res = await register({ ...creds, role: 'admin' });
    expect(res.status).toBe(400);
  });
  it('rejects duplicate email', async () => {
    await register();
    expect((await register()).status).toBe(409);
  });
  it('rejects short password', async () => {
    expect((await register({ ...creds, password: '123' })).status).toBe(400);
  });
});

describe('login', () => {
  beforeEach(() => register());
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
  it('rejects wrong password and unknown email with the same message', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: creds.email, password: 'wrongpass1' });
    const b = await request(app).post('/api/auth/login').send({ email: 'no@one.com', password: 'wrongpass1' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.message).toBe(b.body.message);
  });
});

describe('protected routes', () => {
  it('GET /me works with a token and fails without', async () => {
    const { body } = await register();
    const ok = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.accessToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.user.email).toBe(creds.email);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });
  it('rejects a garbage token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer nonsense');
    expect(res.status).toBe(401);
  });
});

describe('refresh rotation', () => {
  it('issues a new pair and rejects reuse of the old refresh token', async () => {
    const { body } = await register();
    const first = await request(app).post('/api/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.refreshToken).not.toBe(body.refreshToken);
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(reuse.status).toBe(401);
  });
});

describe('logout', () => {
  it('blacklists the access token and revokes the refresh token', async () => {
    const { body } = await register();
    const out = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .send({ refreshToken: body.refreshToken });
    expect(out.status).toBe(200);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.accessToken}`);
    expect(me.status).toBe(401);
    const ref = await request(app).post('/api/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(ref.status).toBe(401);
  });
});

describe('requireRole', () => {
  const run = (role) => {
    const next = jest.fn();
    requireRole('admin')({ user: { role } }, {}, next);
    return next.mock.calls[0][0];
  };
  it('allows the right role', () => expect(run('admin')).toBeUndefined());
  it('blocks the wrong role with 403', () => expect(run('customer').status).toBe(403));
});
