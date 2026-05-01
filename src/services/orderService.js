const Order = require('../models/Order');
const Cart = require('../models/Cart');
const NotificationService = require('./notificationService');
const User = require('../models/User');
const CouponService = require('./couponService');

class OrderService {
  static formatOrder(order) {
    const rawOrder = order.toObject ? order.toObject() : { ...order };
    const rawUser = rawOrder.userId;
    const rawCoupon = rawOrder.appliedCoupon?.couponId;

    const formattedItems = rawOrder.items.map((item) => {
      const rawProduct = item.productId && typeof item.productId === 'object'
        ? item.productId
        : null;

      return {
        orderItemId: item._id,
        productId: rawProduct ? rawProduct._id : item.productId,
        product: rawProduct
          ? {
              name: rawProduct.name,
              image: rawProduct.image
            }
          : null,
        quantity: item.quantity,
        price: item.price
      };
    });

    const formattedStatusHistory = rawOrder.statusHistory.map((entry) => ({
      statusHistoryId: entry._id,
      status: entry.status,
      timestamp: entry.timestamp
    }));

    return {
      orderId: rawOrder._id,
      userId: rawUser && typeof rawUser === 'object' ? rawUser._id : rawUser,
      user: rawUser && typeof rawUser === 'object'
        ? {
            name: rawUser.name,
            email: rawUser.email
          }
        : null,
      items: formattedItems,
      totalPrice: rawOrder.totalPrice,
      subtotalPrice: rawOrder.subtotalPrice,
      discountAmount: rawOrder.discountAmount,
      appliedCoupon: {
        couponId: rawCoupon && typeof rawCoupon === 'object' ? rawCoupon._id : rawCoupon,
        code: rawOrder.appliedCoupon?.code || null,
        coupon: rawCoupon && typeof rawCoupon === 'object'
          ? {
              discountType: rawCoupon.discountType,
              value: rawCoupon.value
            }
          : null
      },
      status: rawOrder.status,
      deliveryAddress: rawOrder.deliveryAddress,
      note: rawOrder.note || null,
      paymentMethod: rawOrder.paymentMethod,
      statusHistory: formattedStatusHistory,
      createdAt: rawOrder.createdAt,
      updatedAt: rawOrder.updatedAt
    };
  }

  static async createOrder(userId, paymentMethod) {
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      const error = new Error('Cart is empty');
      error.statusCode = 400;
      throw error;
    }

    if (
      !cart.deliveryAddress ||
      !cart.deliveryAddress.address ||
      cart.deliveryAddress.lat === null ||
      cart.deliveryAddress.lng === null
    ) {
      const error = new Error('Delivery address with lat and lng is required in cart before placing an order');
      error.statusCode = 400;
      throw error;
    }

    let subtotalPrice = 0;
    const orderItems = [];

    // Calculate subtotal and build order items (snapshot price at checkout time)
    for (const item of cart.items) {
      const product = item.productId;
      if (!product || !product.isAvailable) {
        const error = new Error(`Product ${product ? product.name : 'Unknown'} is not available`);
        error.statusCode = 400;
        throw error;
      }

      subtotalPrice += product.price * item.quantity;
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // --- Bug #1 Fix: Apply cart coupon to the order ---
    let discountAmount = 0;
    let totalPrice = subtotalPrice;
    let appliedCoupon = { couponId: null, code: null };

    const couponCode = cart.appliedCoupon?.code;
    if (couponCode) {
      try {
        const coupon = await CouponService.getValidCouponByCode(couponCode);
        const discount = CouponService.calculateDiscount(coupon, subtotalPrice);
        discountAmount = discount.discountAmount;
        totalPrice = discount.finalTotal;
        appliedCoupon = { couponId: coupon._id, code: coupon.code };
      } catch {
        // Coupon expired or deactivated between cart and checkout — proceed without it
        discountAmount = 0;
        totalPrice = subtotalPrice;
        appliedCoupon = { couponId: null, code: null };
      }
    }
    // --- End fix ---

    const order = await Order.create({
      userId,
      items: orderItems,
      subtotalPrice,
      discountAmount,
      totalPrice,
      appliedCoupon,
      deliveryAddress: {
        address: cart.deliveryAddress.address,
        lat: cart.deliveryAddress.lat,
        lng: cart.deliveryAddress.lng
      },
      note: cart.note || null,
      paymentMethod,
      status: 'PENDING'
    });

    // Clear cart
    cart.items = [];
    cart.deliveryAddress = {
      address: null,
      lat: null,
      lng: null
    };
    cart.note = null;
    cart.appliedCoupon = {
      couponId: null,
      code: null
    };
    await cart.save();

    return await this.getOrderById(order._id);
  }

  static async getMyOrders(userId) {
    const orders = await Order.find({ userId })
      .sort('-createdAt')
      .populate('items.productId', 'name image')
      .populate('appliedCoupon.couponId', 'code discountType value');

    return orders.map((order) => this.formatOrder(order));
  }

  static async getOrderById(orderId) {
    const order = await Order.findById(orderId)
      .populate('items.productId', 'name image')
      .populate('appliedCoupon.couponId', 'code discountType value');
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }
    return this.formatOrder(order);
  }

  // Admin method
  static async getAllOrders() {
    const orders = await Order.find()
      .sort('-createdAt')
      .populate('userId', 'name email')
      .populate('appliedCoupon.couponId', 'code discountType value');

    return orders.map((order) => this.formatOrder(order));
  }

  // Admin method
  static async updateOrderStatus(orderId, status) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date() });
    await order.save();

    // Trigger Notification
    const user = await User.findById(order.userId);
    if (user && user.fcmToken) {
      await NotificationService.notifyOrderStatusChanged(user, order._id, status);
    }

    return await this.getOrderById(order._id);
  }
}

module.exports = OrderService;
