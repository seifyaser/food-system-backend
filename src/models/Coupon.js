const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    trim: true,
    uppercase: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Please add a discount type']
  },
  value: {
    type: Number,
    required: [true, 'Please add discount value']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Please add expiration date']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
