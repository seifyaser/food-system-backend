const express = require('express');
const Joi = require('joi');
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

const createOrderSchema = Joi.object({
  paymentMethod: Joi.string().valid('cash').default('cash')
});

router.use(protect);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
