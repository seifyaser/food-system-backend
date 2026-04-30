const Coupon = require('../models/Coupon');

class CouponService {
  static async getValidCouponByCode(code) {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gte: Date.now() }
    });

    if (!coupon) {
      const error = new Error('Invalid or expired coupon');
      error.statusCode = 400;
      throw error;
    }

    return coupon;
  }

  static calculateDiscount(coupon, cartTotal) {
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.value) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.value;
    }

    const finalTotal = cartTotal - discountAmount;

    return {
      discountAmount,
      finalTotal: finalTotal < 0 ? 0 : finalTotal,
      couponId: coupon._id
    };
  }

  static async applyCoupon(code, cartTotal) {
    const coupon = await this.getValidCouponByCode(code);

    return {
      ...this.calculateDiscount(coupon, cartTotal),
      code: coupon.code
    };
  }

  static async createCoupon(data) {
    return await Coupon.create(data);
  }
}

module.exports = CouponService;
