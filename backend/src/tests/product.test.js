jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed.example/upload'),
}));

const request = require('supertest');
const app = require('../app');
const h = require('./helpers');

let admin;
beforeAll(h.connect);
afterAll(h.disconnect);
beforeEach(async () => {
  await h.clear();
  admin = await h.makeAdmin();
});

const create = (token, body = h.sampleProduct()) =>
  request(app).post('/api/products').set(h.auth(token)).send(body);

describe('product CRUD', () => {
  it('a pending vendor cannot create products', async () => {
    const v = await h.makeUser('vendor');
    await request(app).post('/api/vendors/apply').set(h.auth(v.token)).send({ storeName: 'Shop' });
    expect((await create(v.token)).status).toBe(403);
  });

  it('customers cannot create products', async () => {
    const c = await h.makeUser('customer');
    expect((await create(c.token)).status).toBe(403);
  });

  it('an approved vendor creates a product; category is normalised', async () => {
    const v = await h.makeApprovedVendor(admin);
    const res = await create(v.token);
    expect(res.status).toBe(201);
    expect(res.body.product.category).toBe('electronics');
    expect(res.body.product.vendorId).toBe(v.vendorId);
  });

  it('rejects invalid data (negative price, fractional stock)', async () => {
    const v = await h.makeApprovedVendor(admin);
    expect((await create(v.token, h.sampleProduct({ price: -5 }))).status).toBe(400);
    expect((await create(v.token, h.sampleProduct({ stock: 1.5 }))).status).toBe(400);
  });

  it('vendor can update own product but not another vendor\'s', async () => {
    const a = await h.makeApprovedVendor(admin);
    const b = await h.makeApprovedVendor(admin);
    const { body } = await create(a.token);
    const id = body.product._id;

    const own = await request(app).patch(`/api/products/${id}`).set(h.auth(a.token)).send({ price: 8999 });
    expect(own.status).toBe(200);
    expect(own.body.product.price).toBe(8999);

    const other = await request(app).patch(`/api/products/${id}`).set(h.auth(b.token)).send({ price: 1 });
    expect(other.status).toBe(403);
    const del = await request(app).delete(`/api/products/${id}`).set(h.auth(b.token));
    expect(del.status).toBe(403);
  });

  it('GET /products/mine only returns the vendor\'s own products', async () => {
    const a = await h.makeApprovedVendor(admin);
    const b = await h.makeApprovedVendor(admin);
    await create(a.token);
    await create(b.token, h.sampleProduct({ title: 'Other vendor item' }));
    const res = await request(app).get('/api/products/mine').set(h.auth(a.token));
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].title).toBe('Test Phone');
  });

  it('delete is a soft delete: hidden publicly and from /mine', async () => {
    const v = await h.makeApprovedVendor(admin);
    const { body } = await create(v.token);
    const id = body.product._id;
    expect((await request(app).delete(`/api/products/${id}`).set(h.auth(v.token))).status).toBe(200);
    expect((await request(app).get(`/api/products/${id}`)).status).toBe(404);
    const mine = await request(app).get('/api/products/mine').set(h.auth(v.token));
    expect(mine.body.products).toHaveLength(0);
  });
});

describe('public listing', () => {
  it('lists active products with pagination and hides suspended vendors', async () => {
    const a = await h.makeApprovedVendor(admin);
    const b = await h.makeApprovedVendor(admin);
    for (let i = 0; i < 3; i++) await create(a.token, h.sampleProduct({ title: `A item ${i}` }));
    await create(b.token, h.sampleProduct({ title: 'B item' }));

    const all = await request(app).get('/api/products?limit=3');
    expect(all.status).toBe(200);
    expect(all.body.total).toBe(4);
    expect(all.body.items).toHaveLength(3);
    expect(all.body.pages).toBe(2);

    await request(app).patch(`/api/admin/vendors/${b.vendorId}/suspend`).set(h.auth(admin.token));
    const after = await request(app).get('/api/products');
    expect(after.body.total).toBe(3);
  });
});

describe('S3 presigned upload', () => {
  const presign = (token, body) => request(app).post('/api/uploads/presign').set(h.auth(token)).send(body);

  it('requires login and a vendor/admin role', async () => {
    expect((await request(app).post('/api/uploads/presign').send({ contentType: 'image/png' })).status).toBe(401);
    const c = await h.makeUser('customer');
    expect((await presign(c.token, { contentType: 'image/png' })).status).toBe(403);
  });

  it('rejects non-image types', async () => {
    const v = await h.makeUser('vendor');
    expect((await presign(v.token, { contentType: 'application/pdf' })).status).toBe(400);
  });

  it('returns an upload URL and the final file URL for images', async () => {
    const v = await h.makeUser('vendor');
    const res = await presign(v.token, { contentType: 'image/jpeg' });
    expect(res.status).toBe(200);
    expect(res.body.uploadUrl).toBe('https://signed.example/upload');
    expect(res.body.fileUrl).toMatch(/^https:\/\/test-bucket\.s3\.ap-south-1\.amazonaws\.com\/products\/.+\.jpg$/);
  });
});
