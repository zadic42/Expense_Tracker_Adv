const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date query
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) dateQuery.date.$lte = new Date(endDate);
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateQuery.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const query = { user: req.user._id, ...dateQuery };

    // Get transactions
    const transactions = await Transaction.find(query);

    // Calculate expense breakdown by category
    const expenseData = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, transaction) => {
        const existing = acc.find((item) => item.name === transaction.category);
        if (existing) {
          existing.value += transaction.amount;
        } else {
          acc.push({ name: transaction.category, value: transaction.amount });
        }
        return acc;
      }, []);

    // Calculate income vs expense by month
    const incomeVsExpense = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
      const existing = acc.find((item) => item.month === month);
      
      if (existing) {
        if (transaction.type === 'income') {
          existing.income += transaction.amount;
        } else {
          existing.expense += transaction.amount;
        }
      } else {
        acc.push({
          month,
          income: transaction.type === 'income' ? transaction.amount : 0,
          expense: transaction.type === 'expense' ? transaction.amount : 0,
        });
      }
      return acc;
    }, []);

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get account balances
    const accounts = await Account.find({ user: req.user._id });
    const accountBalances = accounts.map((acc) => ({
      name: acc.name,
      balance: acc.balance,
    }));

    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .select('payee category subcategory amount type date');

    // Top categories
    const topCategories = expenseData
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((cat) => ({
        name: cat.name,
        value: cat.value,
      }));

    res.json({
      expenseData,
      incomeVsExpense,
      accountBalances,
      recentTransactions,
      topCategories,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

