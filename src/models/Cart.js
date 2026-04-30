const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity can not be less than 1'],
      default: 1
    }
  }],
  appliedCoupon: {
    couponId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Coupon',
      default: null
    },
    code: {
      type: String,
      default: null
    }
  },
  deliveryAddress: {
    address: {
      type: String,
      default: null
    },
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  note: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);
