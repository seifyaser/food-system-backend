const express = require('express');
const Joi = require('joi');
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

const cartItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().min(1).optional(),
  couponCode: Joi.string().trim().optional(),
  couponcode: Joi.string().trim().optional(),
  deliveryAddress: Joi.object({
    address: Joi.string().trim().required(),
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).optional(),
  note: Joi.string().trim().allow('').optional()
}).oxor('couponCode', 'couponcode');

const removeItemSchema = Joi.object({
  productId: Joi.string().optional(),
  itemId: Joi.string().optional()
}).or('productId', 'itemId');

router.use(protect);

router.get('/', getCart);
router.post('/add', validate(cartItemSchema), addToCart);
router.delete('/item', validate(removeItemSchema), removeFromCart);
router.delete('/item/:itemId', removeFromCart);

module.exports = router;
