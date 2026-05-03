const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    index: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  // Use String (not Number) to preserve
  // leading zeros and allow regex validation for Egyptian phone format
 phone: {
  type: String,
  required: [true, 'Please add a phone number'],
  match: [
    /^01[0125][0-9]{8}$/, // Egyptian phone number pattern
    'Please add a valid Egyptian phone number'
  ]
},
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Hide password in responses
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  fcmToken: {
    type: String
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
