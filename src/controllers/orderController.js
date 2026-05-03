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
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const result = await OrderService.getMyOrders(req.user.id, page, limit);
  res.status(200).json({
    success: true,
    count: result.orders.length,
    pagination: result.pagination,
    data: result.orders
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
