const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   GET /api/budgets
// @desc    Get all budgets for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = { user: req.user._id };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    // Calculate spent amounts for each budget
    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = budget.startDate;
        const endDate = budget.endDate || new Date();

        // Get total expenses for this category in the budget period
        const transactions = await Transaction.find({
          user: req.user._id,
          type: 'expense',
          category: budget.category,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        });

        const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        // Check if alert should be triggered
        const shouldAlert =
          budget.alerts.enabled &&
          percentage >= budget.alerts.threshold &&
          remaining > 0;

        return {
          ...budget.toObject(),
          spent,
          remaining,
          percentage: Math.min(percentage, 100),
          shouldAlert,
        };
      })
    );

    res.json(budgetsWithProgress);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get single budget
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Calculate spent amount
    const startDate = budget.startDate;
    const endDate = budget.endDate || new Date();

    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      category: budget.category,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    const shouldAlert =
      budget.alerts.enabled &&
      percentage >= budget.alerts.threshold &&
      remaining > 0;

    res.json({
      ...budget.toObject(),
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      shouldAlert,
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Private
router.post(
  '/',
  protect,
  [
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('period').optional().isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const budget = await Budget.create({
        ...req.body,
        user: req.user._id,
      });

      res.status(201).json(budget);
    } catch (error) {
      console.error('Create budget error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Update budget
    Object.keys(req.body).forEach((key) => {
      if (key !== 'user' && key !== '_id') {
        budget[key] = req.body[key];
      }
    });

    await budget.save();

    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/budgets/alerts/check
// @desc    Check for budget alerts
// @access  Private
router.get('/alerts/check', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({
      user: req.user._id,
      isActive: true,
      'alerts.enabled': true,
    });

    const alerts = [];

    for (const budget of budgets) {
      const startDate = budget.startDate;
      const endDate = budget.endDate || new Date();

      const transactions = await Transaction.find({
        user: req.user._id,
        type: 'expense',
        category: budget.category,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      if (percentage >= budget.alerts.threshold) {
        alerts.push({
          budgetId: budget._id,
          category: budget.category,
          budgetAmount: budget.amount,
          spent,
          remaining: budget.amount - spent,
          percentage,
          message: `You've spent ${percentage.toFixed(1)}% of your ${budget.category} budget`,
        });
      }
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Check budget alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

