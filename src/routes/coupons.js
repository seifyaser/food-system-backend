const express = require('express');
const Joi = require('joi');
const { applyCoupon, createCoupon } = require('../controllers/couponController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

const applyCouponSchema = Joi.object({
  code: Joi.string().required(),
  cartTotal: Joi.number().min(0).required()
});

router.post('/apply', protect, validate(applyCouponSchema), applyCoupon);

// Admin only route
router.post('/', protect, authorize('admin'), createCoupon);

module.exports = router;
