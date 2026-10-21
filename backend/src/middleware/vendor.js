const Vendor = require('../models/Vendor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Only vendors whose store has been approved by an admin may continue.
// Puts the vendor document on req.vendor.
module.exports = asyncHandler(async (req, _res, next) => {
  const vendor = await Vendor.findOne({ userId: req.user.id });
  if (!vendor) throw new AppError(403, 'Apply for a vendor account first');
  if (vendor.status !== 'approved') throw new AppError(403, `Your vendor account is ${vendor.status}`);
  req.vendor = vendor;
  next();
});
