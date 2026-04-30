const asyncHandler = require('../utils/asyncHandler');
const ProductService = require('../services/productService');

exports.getProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.getProducts(req.query);
  res.status(200).json({
    success: true,
    count: result.count,
    pagination: result.pagination,
    data: result.data
  });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);
  res.status(200).json({
    success: true,
    data: product
  });
});
