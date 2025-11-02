import React, { useState, useEffect } from 'react';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon, XMarkIcon, DocumentArrowUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import { transactionAPI, accountAPI, uploadAPI } from '../services/api';
import { useToast } from '../hooks/useToast';

const TransactionManager = () => {
  const { showSuccess, showError } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [sortBy, setSortBy] = useState('date'); // date, amount, category
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    subcategory: '',
    amount: '',
    paymentMode: '',
    payee: '',
    account: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    remarks: '',
    attachment: null,
    attachmentFile: null
  });

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other']
  };

  const subcategories = {
    Food: ['Groceries', 'Restaurants', 'Delivery', 'Snacks'],
    Transport: ['Fuel', 'Public Transit', 'Taxi', 'Maintenance'],
    Shopping: ['Clothing', 'Electronics', 'Home', 'Personal Care'],
    Bills: ['Electricity', 'Water', 'Internet', 'Phone', 'Rent'],
    Entertainment: ['Movies', 'Games', 'Streaming', 'Events'],
    Health: ['Medicine', 'Doctor', 'Insurance', 'Gym'],
    Education: ['Courses', 'Books', 'Tuition', 'Supplies'],
    Salary: ['Monthly', 'Bonus', 'Incentive'],
    Freelance: ['Projects', 'Consulting', 'Commission'],
    Investment: ['Dividends', 'Interest', 'Capital Gains'],
    Business: ['Sales', 'Services', 'Contracts'],
    Gift: ['Birthday', 'Festival', 'Wedding'],
    Other: ['Miscellaneous']
  };

  const paymentModes = ['Credit Card', 'Debit Card', 'UPI', 'Cash', 'Net Banking', 'Mobile Wallet', 'Cheque'];

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, [filterType, dateRange, sortBy, sortOrder]);

  const fetchTransactions = async () => {
    try {
      setFetchLoading(true);
      const params = {};
      if (filterType !== 'all') {
        params.type = filterType;
      }
      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }
      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }
      const response = await transactionAPI.getAll(params);
      let transactions = response.data;

      // Sort transactions
      transactions.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
          comparison = new Date(a.date) - new Date(b.date);
        } else if (sortBy === 'amount') {
          comparison = a.amount - b.amount;
        } else if (sortBy === 'category') {
          comparison = a.category.localeCompare(b.category);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setTransactions(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showError('Failed to load transactions');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.subcategory || !formData.amount || !formData.paymentMode ||
      !formData.payee || !formData.account || !formData.date || !formData.time) {
      showError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      // Upload file if exists
      let attachmentPath = '';
      if (formData.attachmentFile) {
        try {
          const uploadResponse = await uploadAPI.uploadFile(formData.attachmentFile);
          attachmentPath = uploadResponse.data.filename;
        } catch (uploadError) {
          showError('Failed to upload file');
          setLoading(false);
          return;
        }
      }

      // Prepare transaction data
      const transactionData = {
        type: transactionType,
        category: formData.category,
        subcategory: formData.subcategory,
        amount: parseFloat(formData.amount),
        paymentMode: formData.paymentMode,
        payee: formData.payee,
        account: formData.account,
        date: formData.date,
        time: formData.time,
        remarks: formData.remarks || '',
        attachment: attachmentPath || formData.attachment || '',
      };

      if (editingTransaction) {
        // Update existing transaction
        await transactionAPI.update(editingTransaction._id, transactionData);
        showSuccess('Transaction updated successfully');
      } else {
        // Create new transaction
        await transactionAPI.create(transactionData);
        showSuccess('Transaction added successfully');
      }

      await fetchTransactions();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
      showError(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      type: transactionType,
      category: '',
      subcategory: '',
      amount: '',
      paymentMode: '',
      payee: '',
      account: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      remarks: '',
      attachment: null,
      attachmentFile: null
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, attachmentFile: file, attachment: file.name });
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionAPI.delete(id);
      showSuccess('Transaction deleted successfully');
      await fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showError('Failed to delete transaction');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionType(transaction.type);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      subcategory: transaction.subcategory,
      amount: transaction.amount.toString(),
      paymentMode: transaction.paymentMode,
      payee: transaction.payee,
      account: transaction.account,
      date: new Date(transaction.date).toISOString().split('T')[0],
      time: transaction.time || new Date(transaction.date).toTimeString().slice(0, 5),
      remarks: transaction.remarks || '',
      attachment: transaction.attachment || '',
      attachmentFile: null
    });
    setShowModal(true);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.payee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Transaction Manager</h1>
          <p className="text-slate-600">Track your income and expenses with ease</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-100">Total Income</span>
              <ArrowUpIcon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">₹{totalIncome.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-rose-100">Total Expenses</span>
              <ArrowDownIcon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">₹{totalExpense.toFixed(2)}</p>
          </div>

          <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-amber-500 to-amber-600'} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className={balance >= 0 ? 'text-blue-100' : 'text-amber-100'}>Balance</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">₹</div>
            </div>
            <p className="text-3xl font-bold">₹{balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => { setTransactionType('income'); setShowModal(true); resetForm(); }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowUpIcon className="w-5 h-5" />
            Add Income
          </button>

          <button
            onClick={() => { setTransactionType('expense'); setShowModal(true); resetForm(); }}
            className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowDownIcon className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by payee, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setFilterType('all'); }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  All
                </button>
                <button
                  onClick={() => { setFilterType('income'); }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${filterType === 'income' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Income
                </button>
                <button
                  onClick={() => { setFilterType('expense'); }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${filterType === 'expense' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-2`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sort By
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                      >
                        <option value="date">Date</option>
                        <option value="amount">Amount</option>
                        <option value="category">Category</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 bg-white text-slate-800"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setDateRange({ startDate: '', endDate: '' });
                      setSortBy('date');
                      setSortOrder('desc');
                    }}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Recent Transactions</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {fetchLoading ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-lg">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-lg">No transactions yet</p>
                <p className="text-sm mt-2">Add your first transaction to get started</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpIcon className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ArrowDownIcon className="w-5 h-5 text-rose-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{transaction.payee}</h3>
                          <p className="text-sm text-slate-500">{transaction.category} • {transaction.subcategory}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-slate-500">Payment Mode</span>
                          <p className="font-medium text-slate-700">{transaction.paymentMode}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Account</span>
                          <p className="font-medium text-slate-700">{transaction.account}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Date & Time</span>
                          <p className="font-medium text-slate-700">
                            {new Date(transaction.date).toLocaleDateString()} {transaction.time}
                          </p>
                        </div>
                        {transaction.attachment && (
                          <div>
                            <span className="text-slate-500">Attachment</span>
                            <p className="font-medium text-blue-600 flex items-center gap-1">
                              <DocumentArrowUpIcon className="w-4 h-4" />
                              {transaction.attachment}
                            </p>
                          </div>
                        )}
                      </div>

                      {transaction.remarks && (
                        <div className="mt-3 text-sm">
                          <span className="text-slate-500">Remarks: </span>
                          <span className="text-slate-700">{transaction.remarks}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-4">
                      <span className={`text-2xl font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{parseFloat(transaction.amount).toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteTransaction(transaction._id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingTransaction ? 'Edit' : 'Add'} {transactionType === 'income' ? 'Income' : 'Expense'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories[transactionType].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subcategory *</label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      disabled={!formData.category}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                    >
                      <option value="">Select Subcategory</option>
                      {formData.category && subcategories[formData.category]?.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Mode *</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Mode</option>
                      {paymentModes.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {transactionType === 'income' ? 'Payer' : 'Payee'} *
                    </label>
                    <input
                      type="text"
                      value={formData.payee}
                      onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Account *</label>
                    <select
                      value={formData.account}
                      onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc._id} value={acc.name}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Time *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Add notes..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Attachment</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 transition-colors">
                          <DocumentArrowUpIcon className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-600">
                            {formData.attachment || 'Upload JPG, PNG, or PDF'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    disabled={loading}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`flex-1 px-6 py-3 ${transactionType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'} text-white rounded-xl transition-colors font-medium shadow-lg disabled:opacity-50`}
                  >
                    {loading ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionManager;
