const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  period: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  alerts: {
    enabled: {
      type: Boolean,
      default: true,
    },
    threshold: {
      type: Number,
      default: 80, // Alert when 80% of budget is spent
      min: 0,
      max: 100,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
budgetSchema.index({ user: 1, category: 1 });
budgetSchema.index({ user: 1, isActive: 1 });

// Pre-save hook to update endDate based on period
budgetSchema.pre('save', function (next) {
  if (this.period === 'monthly') {
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    this.endDate = endDate;
  } else if (this.period === 'yearly') {
    const endDate = new Date(this.startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    this.endDate = endDate;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);

