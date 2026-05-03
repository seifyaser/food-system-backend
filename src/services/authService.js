const User = require('../models/User');

class AuthService {
 static async registerUser(userData) {
  const { name, email, password, phone } = userData;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  // Create user (force role to user)
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: "user"
  });

  return user;
}

  static async loginUser(phone, password, fcmToken) {
    // Check for user
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Update FCM token if provided
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    return user;
  }

  static async getUserById(userId) {
    return await User.findById(userId);
  }
}

module.exports = AuthService;
