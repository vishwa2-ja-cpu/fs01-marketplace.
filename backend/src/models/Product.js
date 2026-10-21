const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    price: { type: Number, required: true, min: 0 }, // in rupees; converted to paise at payment time
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [String], // S3 URLs
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true }, // false = soft-deleted
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
