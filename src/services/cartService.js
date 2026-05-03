const Cart = require('../models/Cart');
const Product = require('../models/Product');
const CouponService = require('./couponService');

class CartService {
  static formatCart(cart, couponSummary = null) {
    const rawCart = cart.toObject ? cart.toObject() : { ...cart };

    const items = rawCart.items.map((item) => {
      const product = item.productId && typeof item.productId === 'object'
        ? item.productId
        : null;
      const productPrice = product ? product.price : 0;

      return {
        cartItemId: item._id,
        productId: product ? product._id : item.productId,
        product,
        quantity: item.quantity,
        totalPrice: productPrice * item.quantity
      };
    });

    const subtotalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = couponSummary ? couponSummary.discountAmount : 0;
    const finalTotal = couponSummary ? couponSummary.finalTotal : subtotalPrice;

    return {
      cartId: rawCart._id,
      userId: rawCart.userId,
      items,
      deliveryAddress: rawCart.deliveryAddress && rawCart.deliveryAddress.address
        ? rawCart.deliveryAddress
        : null,
      note: rawCart.note || null,
      createdAt: rawCart.createdAt,
      updatedAt: rawCart.updatedAt,
      appliedCoupon: couponSummary
        ? {
            couponId: couponSummary.couponId,
            code: couponSummary.code
          }
        : null,
      subtotalPrice,
      discountAmount,
      cartTotal: subtotalPrice,
      finalTotal
    };
  }

  static clearStoredCoupon(cart) {
    if (!cart.appliedCoupon || (!cart.appliedCoupon.code && !cart.appliedCoupon.couponId)) {
      return false;
    }

    cart.appliedCoupon = {
      couponId: null,
      code: null
    };

    return true;
  }

  static async getOrCreateCart(userId) {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    return cart;
  }

  static async populateCart(cart) {
    await cart.populate('items.productId', 'name price image isAvailable');
    return cart;
  }

  static async buildCartResponse(cart, couponCode = null) {
    if (!couponCode || !couponCode.trim()) {
      // If no new coupon is provided, we use the stored one if it exists
      if (cart.appliedCoupon && cart.appliedCoupon.code) {
        couponCode = cart.appliedCoupon.code;
      } else {
        return this.formatCart(cart);
      }
    } else {
      couponCode = couponCode.trim();
    }

    try {
      const coupon = await CouponService.getValidCouponByCode(couponCode);
      
      // Save valid coupon to cart permanently
      cart.appliedCoupon = { couponId: coupon._id, code: coupon.code };
      await cart.save();

      const subtotalPrice = cart.items.reduce((sum, item) => {
        const productPrice = item.productId && typeof item.productId === 'object' ? item.productId.price : 0;
        return sum + (productPrice * item.quantity);
      }, 0);

      const couponSummary = {
        ...CouponService.calculateDiscount(coupon, subtotalPrice),
        code: coupon.code,
        couponId: coupon._id
      };

      return this.formatCart(cart, couponSummary);
    } catch (error) {
      // If coupon is invalid/expired, clear it
      const wasStored = cart.appliedCoupon && cart.appliedCoupon.code === couponCode;
      
      if (this.clearStoredCoupon(cart)) {
        await cart.save();
      }
      
      // If the error was just from the previously saved coupon being invalid now, 
      // return the cart without throwing the error to the user
      if (wasStored) {
        return this.formatCart(cart);
      }
      throw error;
    }
  }

  static async getCart(userId) {
    const cart = await this.getOrCreateCart(userId);
    await this.populateCart(cart);

    return await this.buildCartResponse(cart);
  }

  static async addItemToCart(userId, productId, quantity, couponCode, deliveryAddress, note) {
    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      const error = new Error('Product not found or unavailable');
      error.statusCode = 404;
      throw error;
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity }]
      });
    } else {
      // Check if product exists in cart
      const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);

      if (itemIndex > -1) {
        // Update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({ productId, quantity });
      }
      await cart.save();
    }

    if (deliveryAddress) {
      cart.deliveryAddress = {
        address: deliveryAddress.address,
        lat: deliveryAddress.lat,
        lng: deliveryAddress.lng
      };
      await cart.save();
    }

    if (typeof note !== 'undefined') {
      cart.note = note || null;
      await cart.save();
    }

    await this.populateCart(cart);

    return await this.buildCartResponse(cart, couponCode);
  }

  static async removeItemFromCart(userId, identifiers) {
    const { productId, itemId } = identifiers || {};
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      const error = new Error('Cart not found');
      error.statusCode = 404;
      throw error;
    }

    const pullCriteria = {};

    if (productId) {
      pullCriteria.productId = productId;
    }

    if (itemId) {
      pullCriteria._id = itemId;
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId, items: { $elemMatch: pullCriteria } },
      { $pull: { items: pullCriteria } },
      { new: true }
    ).populate('items.productId', 'name price image isAvailable');

    if (!updatedCart) {
      const error = new Error('Cart item not found');
      error.statusCode = 404;
      throw error;
    }

    if (updatedCart.items.length === 0) {
      updatedCart.deliveryAddress = {
        address: null,
        lat: null,
        lng: null
      };
      updatedCart.note = null;
      updatedCart.appliedCoupon = {
        couponId: null,
        code: null
      };
      await updatedCart.save();
      await this.populateCart(updatedCart);
    }

    return await this.buildCartResponse(updatedCart);
  }
}

module.exports = CartService;
