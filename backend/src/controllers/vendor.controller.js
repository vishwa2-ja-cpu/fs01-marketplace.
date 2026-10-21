const { z } = require('zod');
const Vendor = require('../models/Vendor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const schemas = {
  apply: z.object({ storeName: z.string().min(2).max(80), description: z.string().max(1000).default('') }),
  update: z.object({
    storeName: z.string().min(2).max(80).optional(),
    description: z.string().max(1000).optional(),
    logoUrl: z.string().url().optional(),
  }),
};

const apply = asyncHandler(async (req, res) => {
  if (await Vendor.exists({ userId: req.user.id })) throw new AppError(409, 'You have already applied');
  const vendor = await Vendor.create({ ...req.body, userId: req.user.id });
  res.status(201).json({ vendor });
});

const getMe = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user.id });
  if (!vendor) throw new AppError(404, 'No vendor profile yet');
  res.json({ vendor });
});

const updateMe = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOneAndUpdate({ userId: req.user.id }, req.body, { new: true, runValidators: true });
  if (!vendor) throw new AppError(404, 'No vendor profile yet');
  res.json({ vendor });
});

module.exports = { schemas, apply, getMe, updateMe };
