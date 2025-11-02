const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   GET /api/accounts
// @desc    Get all accounts for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/accounts/:id
// @desc    Get single account
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/accounts
// @desc    Create a new account
// @access  Private
router.post(
  '/',
  protect,
  [
    body('name').notEmpty().withMessage('Account name is required'),
    body('type').isIn(['checking', 'savings', 'cash', 'investment', 'credit']).withMessage('Invalid account type'),
    body('balance').isFloat().withMessage('Balance must be a number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-yellow-500',
        'bg-indigo-500',
        'bg-red-500',
        'bg-teal-500',
      ];

      // If this is the first account, set it as default
      const accountCount = await Account.countDocuments({ user: req.user._id });
      const isDefault = accountCount === 0;

      // If setting as default, unset other defaults
      if (req.body.isDefault) {
        await Account.updateMany({ user: req.user._id }, { isDefault: false });
      }

      const account = await Account.create({
        ...req.body,
        user: req.user._id,
        color: req.body.color || colors[accountCount % colors.length],
        isDefault: req.body.isDefault !== undefined ? req.body.isDefault : isDefault,
      });

      res.status(201).json(account);
    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/accounts/:id
// @desc    Update an account
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      await Account.updateMany({ user: req.user._id, _id: { $ne: req.params.id } }, { isDefault: false });
    }

    // Update account
    Object.keys(req.body).forEach((key) => {
      if (key !== 'user' && key !== '_id') {
        account[key] = req.body[key];
      }
    });

    await account.save();

    res.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete an account
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await Account.findByIdAndDelete(req.params.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/accounts/transfer
// @desc    Transfer funds between accounts
// @access  Private
router.post(
  '/transfer',
  protect,
  [
    body('from').notEmpty().withMessage('Source account is required'),
    body('to').notEmpty().withMessage('Destination account is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { from, to, amount } = req.body;

      if (from === to) {
        return res.status(400).json({ message: 'Source and destination accounts cannot be the same' });
      }

      const fromAccount = await Account.findOne({ _id: from, user: req.user._id });
      const toAccount = await Account.findOne({ _id: to, user: req.user._id });

      if (!fromAccount || !toAccount) {
        return res.status(404).json({ message: 'Account not found' });
      }

      if (fromAccount.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      // Update balances
      fromAccount.balance -= amount;
      toAccount.balance += amount;

      await fromAccount.save();
      await toAccount.save();

      res.json({
        message: 'Transfer successful',
        fromAccount,
        toAccount,
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

