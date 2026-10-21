const request = require('supertest');
const app = require('../app');
const h = require('./helpers');

beforeAll(h.connect);
afterAll(h.disconnect);
beforeEach(h.clear);

describe('vendor onboarding', () => {
  it('customers cannot apply as vendors', async () => {
    const c = await h.makeUser('customer');
    const res = await request(app).post('/api/vendors/apply').set(h.auth(c.token)).send({ storeName: 'Nope' });
    expect(res.status).toBe(403);
  });

  it('a vendor applies and starts as pending; applying twice is rejected', async () => {
    const v = await h.makeUser('vendor');
    const first = await request(app).post('/api/vendors/apply').set(h.auth(v.token)).send({ storeName: 'My Shop' });
    expect(first.status).toBe(201);
    expect(first.body.vendor.status).toBe('pending');
    expect(first.body.vendor.commissionRate).toBe(10);
    const second = await request(app).post('/api/vendors/apply').set(h.auth(v.token)).send({ storeName: 'Again' });
    expect(second.status).toBe(409);
  });

  it('GET /vendors/me returns the profile, 404 before applying', async () => {
    const v = await h.makeUser('vendor');
    expect((await request(app).get('/api/vendors/me').set(h.auth(v.token))).status).toBe(404);
    await request(app).post('/api/vendors/apply').set(h.auth(v.token)).send({ storeName: 'My Shop' });
    const res = await request(app).get('/api/vendors/me').set(h.auth(v.token));
    expect(res.body.vendor.storeName).toBe('My Shop');
  });
});

describe('admin vendor management', () => {
  it('non-admins cannot list or approve vendors', async () => {
    const v = await h.makeUser('vendor');
    expect((await request(app).get('/api/admin/vendors').set(h.auth(v.token))).status).toBe(403);
  });

  it('admin lists by status, approves and suspends', async () => {
    const admin = await h.makeAdmin();
    const v = await h.makeUser('vendor');
    const applied = await request(app).post('/api/vendors/apply').set(h.auth(v.token)).send({ storeName: 'Shop' });
    const id = applied.body.vendor._id;

    const pending = await request(app).get('/api/admin/vendors?status=pending').set(h.auth(admin.token));
    expect(pending.body.vendors).toHaveLength(1);

    const approved = await request(app).patch(`/api/admin/vendors/${id}/approve`).set(h.auth(admin.token));
    expect(approved.body.vendor.status).toBe('approved');

    const suspended = await request(app).patch(`/api/admin/vendors/${id}/suspend`).set(h.auth(admin.token));
    expect(suspended.body.vendor.status).toBe('suspended');
  });

  it('returns 404 for a malformed vendor id', async () => {
    const admin = await h.makeAdmin();
    const res = await request(app).patch('/api/admin/vendors/not-an-id/approve').set(h.auth(admin.token));
    expect(res.status).toBe(404);
  });
});
