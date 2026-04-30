const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true // Snapshot of price at the time of order
    }
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  subtotalPrice: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
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
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'],
    default: 'PENDING'
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  deliveryAddress: {
    address: {
      type: String,
      required: [true, 'Please add a delivery address']
    },
    lat: {
      type: Number,
      required: [true, 'Please add delivery latitude']
    },
    lng: {
      type: Number,
      required: [true, 'Please add delivery longitude']
    }
  },
  note: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash'],
    default: 'cash'
  }
}, {
  timestamps: true
});

// Pre-save middleware to add initial status to history if it's new
orderSchema.pre('save', function() {
  if (this.isNew) {
    this.statusHistory.push({ status: this.status, timestamp: new Date() });
  }
});

module.exports = mongoose.model('Order', orderSchema);
