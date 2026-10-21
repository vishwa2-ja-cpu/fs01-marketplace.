const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 1000 },
    logoUrl: String,
    status: { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending', index: true },
    // Percent the platform keeps from each sale (used in Step 6).
    commissionRate: { type: Number, default: () => Number(process.env.DEFAULT_COMMISSION_PERCENT || 10), min: 0, max: 100 },
    // Razorpay Route / Stripe Connect linked account id (filled in Step 6).
    payoutAccountId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);
