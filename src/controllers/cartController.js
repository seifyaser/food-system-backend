const asyncHandler = require('../utils/asyncHandler');
const CartService = require('../services/cartService');

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await CartService.getCart(req.user.id);
  res.status(200).json({
    success: true,
    data: cart
  });
});

exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, couponCode, couponcode, deliveryAddress, note } = req.body;
  const cart = await CartService.addItemToCart(
    req.user.id,
    productId,
    quantity || 1,
    couponCode || couponcode,
    deliveryAddress,
    note
  );
  res.status(200).json({
    success: true,
    data: cart
  });
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  const productId = req.body?.productId || req.query?.productId;
  const itemId = req.body?.itemId || req.params?.itemId || req.query?.itemId;
  const cart = await CartService.removeItemFromCart(req.user.id, { productId, itemId });
  res.status(200).json({
    success: true,
    data: cart
  });
});
