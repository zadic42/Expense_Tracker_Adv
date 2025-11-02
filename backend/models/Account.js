const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide an account name'],
  },
  type: {
    type: String,
    required: true,
    enum: ['checking', 'savings', 'cash', 'investment', 'credit'],
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  color: {
    type: String,
    default: 'bg-blue-500',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
accountSchema.index({ user: 1 });

module.exports = mongoose.model('Account', accountSchema);

