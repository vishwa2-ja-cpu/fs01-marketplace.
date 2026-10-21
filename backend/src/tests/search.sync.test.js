// Checks that product/vendor changes trigger an Elasticsearch update (service mocked, real MongoDB).
jest.mock('../services/search', () => ({
  indexProduct: jest.fn(),
  removeProduct: jest.fn(),
  syncVendor: jest.fn(),
  ensureIndex: jest.fn(),
  searchProducts: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const search = require('../services/search');
const h = require('./helpers');

let admin;
beforeAll(h.connect);
afterAll(h.disconnect);
beforeEach(async () => {
  await h.clear();
  admin = await h.makeAdmin();
});

const create = (token, body = h.sampleProduct()) => request(app).post('/api/products').set(h.auth(token)).send(body);

describe('search index stays in sync', () => {
  it('indexes a product when it is created', async () => {
    const v = await h.makeApprovedVendor(admin);
    jest.clearAllMocks();
    const res = await create(v.token);
    expect(search.indexProduct).toHaveBeenCalledTimes(1);
    const [product, vendor] = search.indexProduct.mock.calls[0];
    expect(String(product._id)).toBe(res.body.product._id);
    expect(vendor.status).toBe('approved');
  });

  it('re-indexes when a product is updated', async () => {
    const v = await h.makeApprovedVendor(admin);
    const { body } = await create(v.token);
    jest.clearAllMocks();
    await request(app).patch(`/api/products/${body.product._id}`).set(h.auth(v.token)).send({ price: 8999 });
    expect(search.indexProduct).toHaveBeenCalledTimes(1);
    expect(search.indexProduct.mock.calls[0][0].price).toBe(8999);
  });

  it('removes the product from the index when deleted', async () => {
    const v = await h.makeApprovedVendor(admin);
    const { body } = await create(v.token);
    jest.clearAllMocks();
    await request(app).delete(`/api/products/${body.product._id}`).set(h.auth(v.token));
    expect(String(search.removeProduct.mock.calls[0][0])).toBe(body.product._id);
  });

  it('does not index a product the vendor is not allowed to edit', async () => {
    const a = await h.makeApprovedVendor(admin);
    const b = await h.makeApprovedVendor(admin);
    const { body } = await create(a.token);
    jest.clearAllMocks();
    const res = await request(app).patch(`/api/products/${body.product._id}`).set(h.auth(b.token)).send({ price: 1 });
    expect(res.status).toBe(403);
    expect(search.indexProduct).not.toHaveBeenCalled();
  });

  it('syncs all of a vendor\'s products when the vendor is suspended', async () => {
    const v = await h.makeApprovedVendor(admin);
    jest.clearAllMocks();
    await request(app).patch(`/api/admin/vendors/${v.vendorId}/suspend`).set(h.auth(admin.token));
    expect(search.syncVendor).toHaveBeenCalledTimes(1);
    expect(search.syncVendor.mock.calls[0][0].status).toBe('suspended');
  });

  it('syncs the store name when a vendor renames their store', async () => {
    const v = await h.makeApprovedVendor(admin);
    jest.clearAllMocks();
    await request(app).patch('/api/vendors/me').set(h.auth(v.token)).send({ storeName: 'Brand New Name' });
    expect(search.syncVendor.mock.calls[0][0].storeName).toBe('Brand New Name');
  });
});
