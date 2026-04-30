const asyncHandler = require('../utils/asyncHandler');
const CouponService = require('../services/couponService');

exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;
  const result = await CouponService.applyCoupon(code, cartTotal);
  res.status(200).json({
    success: true,
    data: result
  });
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await CouponService.createCoupon(req.body);
  res.status(201).json({
    success: true,
    data: coupon
  });
});
