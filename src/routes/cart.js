const express = require('express');
const Joi = require('joi');
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

const cartItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().min(1).optional(),

  // Unified field name (supports old "couponcode" via rename)
  couponCode: Joi.string().trim().optional(),

  deliveryAddress: Joi.object({
    address: Joi.string().trim().required(),
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).optional(),

  note: Joi.string().trim().allow('').optional()
})
.rename('couponcode', 'couponCode', { ignoreUndefined: true }); // handle legacy field

const removeItemSchema = Joi.object({
  productId: Joi.string().optional(),
  itemId: Joi.string().optional()
}).or('productId', 'itemId'); // لازم واحد على الأقل

// Protect all routes (authenticated users only)
router.use(protect);

// Routes
router.get('/', getCart);
router.post('/add', validate(cartItemSchema), addToCart);
router.delete('/item', validate(removeItemSchema), removeFromCart);
router.delete('/item/:itemId', removeFromCart);

module.exports = router;