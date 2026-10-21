const { z } = require('zod');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { indexProduct, removeProduct } = require('../services/search');

const base = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).default(''),
  category: z.string().min(2).max(40),
  price: z.number().positive().max(10000000),
  stock: z.number().int().min(0).max(100000),
  images: z.array(z.string().url()).max(8).default([]),
});
const schemas = { create: base, update: base.partial().strict() };

// Public: only active products from approved vendors.
const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);
  const approved = await Vendor.find({ status: 'approved' }).distinct('_id');
  const filter = { isActive: true, vendorId: { $in: approved } };
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('vendorId', 'storeName'),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('vendorId', 'storeName status');
  if (!product || product.vendorId?.status !== 'approved') throw new AppError(404, 'Product not found');
  res.json({ product });
});

const mine = asyncHandler(async (req, res) => {
  const products = await Product.find({ vendorId: req.vendor._id, isActive: true }).sort({ createdAt: -1 });
  res.json({ products });
});

const create = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, vendorId: req.vendor._id });
  await indexProduct(product, req.vendor);
  res.status(201).json({ product });
});

// A vendor may only touch their own products.
async function loadOwned(req) {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) throw new AppError(404, 'Product not found');
  if (!product.vendorId.equals(req.vendor._id)) throw new AppError(403, 'This is not your product');
  return product;
}

const update = asyncHandler(async (req, res) => {
  const product = await loadOwned(req);
  Object.assign(product, req.body);
  await product.save();
  await indexProduct(product, req.vendor);
  res.json({ product });
});

// Soft delete: keeps the record so old orders still reference it.
const remove = asyncHandler(async (req, res) => {
  const product = await loadOwned(req);
  product.isActive = false;
  await product.save();
  await removeProduct(product._id);
  res.json({ message: 'Product removed' });
});

module.exports = { schemas, list, getOne, mine, create, update, remove };
