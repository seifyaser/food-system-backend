const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name can not be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  categoryId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add index for searching
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
