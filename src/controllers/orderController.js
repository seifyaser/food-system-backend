const asyncHandler = require('../utils/asyncHandler');
const OrderService = require('../services/orderService');

exports.createOrder = asyncHandler(async (req, res) => {
  const { paymentMethod } = req.body;
  const order = await OrderService.createOrder(req.user.id, paymentMethod);
  res.status(201).json({
    success: true,
    data: order
  });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await OrderService.getMyOrders(req.user.id);
  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await OrderService.getOrderById(req.params.id);
  
  // Check ownership
  if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});
