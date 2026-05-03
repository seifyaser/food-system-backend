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
        productId: rawProduct ? rawProduct._id : item.productId,
        name: rawProduct ? rawProduct.name : undefined,
        image: rawProduct ? rawProduct.image : undefined,
        quantity: item.quantity,
        price: item.price
      };
    });

    const statusLabels = {
      'PENDING': 'Pending',
      'ACCEPTED': 'Accepted',
      'PREPARING': 'Preparing',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'REJECTED': 'Rejected'
    };

    const timeline = rawOrder.statusHistory.map((entry) => ({
      status: entry.status,
      at: entry.timestamp
    }));

    let coupon = null;
    if (rawOrder.appliedCoupon && rawOrder.appliedCoupon.code) {
      coupon = {
        id: rawCoupon && typeof rawCoupon === 'object' ? rawCoupon._id : rawCoupon,
        code: rawOrder.appliedCoupon.code,
        discount: rawOrder.discountAmount
      };
    }

    return {
      id: rawOrder._id,
      userId: rawUser && typeof rawUser === 'object' ? rawUser._id : rawUser,
      items: formattedItems,
      pricing: {
        subtotal: rawOrder.subtotalPrice,
        discount: rawOrder.discountAmount,
        total: rawOrder.totalPrice
      },
      coupon,
      status: {
        code: rawOrder.status,
        label: statusLabels[rawOrder.status] || rawOrder.status
      },
      delivery: {
        address: rawOrder.deliveryAddress.address,
        location: {
          lat: rawOrder.deliveryAddress.lat,
          lng: rawOrder.deliveryAddress.lng
        },
        driver: rawOrder.driver && (rawOrder.driver.name || rawOrder.driver.phone)
          ? { name: rawOrder.driver.name, phone: rawOrder.driver.phone }
          : null
      },
      payment: {
        method: rawOrder.paymentMethod
      },
      note: rawOrder.note || null,
      timeline,
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

  static async getMyOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ userId });
    const orders = await Order.find({ userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('items.productId', 'name image')
      .populate('appliedCoupon.couponId', 'code discountType value');

    return {
      pagination: { page, limit, total },
      orders: orders.map((order) => this.formatOrder(order))
    };
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
  static async getAllOrders(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments();
    const orders = await Order.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('items.productId', 'name image')
      .populate('appliedCoupon.couponId', 'code discountType value');

    return {
      pagination: { page, limit, total },
      orders: orders.map((order) => this.formatOrder(order))
    };
  }

  // Admin method
  static async updateOrderStatus(orderId, status, driverInfo = {}) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date() });

    if (status === 'OUT_FOR_DELIVERY' && (driverInfo.driverName || driverInfo.driverPhone)) {
      order.driver = {
        name: driverInfo.driverName || null,
        phone: driverInfo.driverPhone || null
      };
    }

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
