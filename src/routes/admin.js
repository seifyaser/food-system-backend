const express = require('express');
const Joi = require('joi');
const { getAllOrders, updateOrderStatus, createProduct, deleteProduct } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// Orders
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED').required(),
  driverName: Joi.string().optional(),
  driverPhone: Joi.string().optional()
});

router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', validate(updateStatusSchema), updateOrderStatus);

// Products
const createProductSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).required(),
  price: Joi.number().min(0).required(),
  categoryId: Joi.string().optional(),
  categoryName: Joi.string().optional(),
  image: Joi.string().optional(),
  isAvailable: Joi.boolean().optional()
}).or('categoryId', 'categoryName');

router.post('/products', validate(createProductSchema), createProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
