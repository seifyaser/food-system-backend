const asyncHandler = require('../utils/asyncHandler');
const OrderService = require('../services/orderService');
const ProductService = require('../services/productService');
const Product = require('../models/Product');

// --- ORDERS ---

exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await OrderService.getAllOrders();
  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await OrderService.updateOrderStatus(req.params.id, status);
  res.status(200).json({
    success: true,
    data: order
  });
});

// --- PRODUCTS ---

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.createProduct(req.body);
  res.status(201).json({
    success: true,
    data: product
  });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  await product.deleteOne();
  res.status(200).json({
    success: true,
    data: {}
  });
});
