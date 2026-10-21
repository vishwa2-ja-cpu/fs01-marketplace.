const Vendor = require('../models/Vendor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { syncVendor } = require('../services/search');

const listVendors = asyncHandler(async (req, res) => {
  const filter = ['pending', 'approved', 'suspended'].includes(req.query.status) ? { status: req.query.status } : {};
  const vendors = await Vendor.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email');
  res.json({ vendors });
});

const setStatus = (status) =>
  asyncHandler(async (req, res) => {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!vendor) throw new AppError(404, 'Vendor not found');
    await syncVendor(vendor); // suspended vendors disappear from search immediately
    res.json({ vendor });
  });

module.exports = { listVendors, approve: setStatus('approved'), suspend: setStatus('suspended') };
