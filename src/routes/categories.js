const express = require('express');
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Public route to get all categories
router.get('/', getCategories);

// Admin only route to create a category (for seeding/testing)
router.post('/', protect, authorize('admin'), createCategory);

module.exports = router;
