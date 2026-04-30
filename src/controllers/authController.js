const asyncHandler = require('../utils/asyncHandler');
const AuthService = require('../services/authService');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role
    }
  });
};

exports.register = asyncHandler(async (req, res) => {
  logger.info(`Register attempt for email: ${req.body.email}`);
  const user = await AuthService.registerUser(req.body);
  sendTokenResponse(user, 201, res);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password, fcmToken } = req.body;
  logger.info(`Login attempt for email: ${email}`);

  const user = await AuthService.loginUser(email, password, fcmToken);
  sendTokenResponse(user, 200, res);
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await AuthService.getUserById(req.user.id);
  res.status(200).json({
    success: true,
    data: user
  });
});
