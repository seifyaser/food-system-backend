const express = require('express');
const Joi = require('joi');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

// Validation Schemas
//Joi هو مكتبة في Node.js بتستخدمها عشان تتحقق من البيانات (validation) اللي جاية من اليوزر قبل ما تدخلها السيستم.
const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().required(),
  role: Joi.string().valid('user', 'admin').optional()
});

const loginSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().required(),
  fcmToken: Joi.string().optional()
});

// Routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

module.exports = router;
