const asyncHandler = require('../utils/asyncHandler');
const CategoryService = require('../services/categoryService');

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await CategoryService.getCategories();
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.createCategory(req.body);
  res.status(201).json({
    success: true,
    data: category
  });
});
