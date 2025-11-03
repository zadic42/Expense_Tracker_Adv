import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { budgetAPI, transactionAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext'

const BudgetManagement = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const { isDark } = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    alerts: {
      enabled: true,
      threshold: 80,
    },
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAlerts();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchBudgets = async () => {
    try {
      setFetchLoading(true);
      const response = await budgetAPI.getAll({ isActive: 'true' });
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      showError('Failed to load budgets');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await transactionAPI.getAll({ type: 'expense' });
      const uniqueCategories = [...new Set(response.data.map(t => t.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const checkAlerts = async () => {
    try {
      const response = await budgetAPI.checkAlerts();
      if (response.data.alerts && response.data.alerts.length > 0) {
        response.data.alerts.forEach(alert => {
          showWarning(alert.message);
        });
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.amount) {
      showError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      if (editingBudget) {
        await budgetAPI.update(editingBudget._id, formData);
        showSuccess('Budget updated successfully');
      } else {
        await budgetAPI.create(formData);
        showSuccess('Budget created successfully');
      }

      await fetchBudgets();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving budget:', error);
      showError(error.response?.data?.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await budgetAPI.delete(id);
      showSuccess('Budget deleted successfully');
      await fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      showError('Failed to delete budget');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      alerts: budget.alerts,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingBudget(null);
    setFormData({
      category: '',
      amount: '',
      period: 'monthly',
      alerts: {
        enabled: true,
        threshold: 80,
      },
    });
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`min-h-screen p-6 mt-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Budget Management
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-slate-600'}>
            Set and track your spending budgets
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Total Budgets
              </span>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {budgets.length}
            </p>
          </div>

          <div className={`rounded-2xl shadow-lg p-6 border-l-4 border-green-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Total Budget
              </span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              ₹{budgets.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
            </p>
          </div>

          <div className={`rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Total Spent
              </span>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              ₹{budgets.reduce((sum, b) => sum + (b.spent || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Add Budget Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Budget
          </button>
        </div>

        {/* Budgets List */}
        <div className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Your Budgets
            </h2>
          </div>

          {fetchLoading ? (
            <div className={`p-12 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Loading budgets...
            </div>
          ) : budgets.length === 0 ? (
            <div className={`p-12 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              <p className="text-lg mb-2">No budgets yet</p>
              <p className="text-sm">Click "Add Budget" to get started</p>
            </div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-slate-200'}`}>
              {budgets.map((budget) => (
                <div 
                  key={budget._id} 
                  className={`p-6 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                          <DollarSign className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {budget.category}
                          </h3>
                          <p className={`text-sm capitalize ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            {budget.period} Budget
                          </p>
                        </div>
                        {budget.shouldAlert && (
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            Alert
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                            Spent: ₹{budget.spent?.toFixed(2) || '0.00'} / ₹{budget.amount.toFixed(2)}
                          </span>
                          <span className={`text-sm font-semibold ${budget.percentage >= 100 ? 'text-red-600' : budget.percentage >= 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {budget.percentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-3 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}>
                          <div
                            className={`h-full ${getProgressColor(budget.percentage || 0)} transition-all duration-300`}
                            style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                          />
                        </div>
                        <div className={`flex justify-between mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                          <span>Remaining: ₹{budget.remaining?.toFixed(2) || budget.amount.toFixed(2)}</span>
                          <span>
                            {budget.startDate && new Date(budget.startDate).toLocaleDateString()} -{' '}
                            {budget.endDate && new Date(budget.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(budget)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark 
                            ? 'text-gray-400 hover:bg-gray-700' 
                            : 'text-slate-600 hover:bg-blue-50'
                        }`}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget._id)}
                        className={`p-2 text-red-600 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`rounded-2xl max-w-md w-full shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`sticky top-0 border-b p-6 flex items-center justify-between ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
              }`}>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {editingBudget ? 'Edit Budget' : 'Add Budget'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <svg className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      Period *
                    </label>
                    <select
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.alerts.enabled}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alerts: { ...formData.alerts, enabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                        Enable Alerts
                      </span>
                    </label>
                    {formData.alerts.enabled && (
                      <div className="mt-2">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                          Alert Threshold (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.alerts.threshold}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              alerts: { ...formData.alerts, threshold: parseInt(e.target.value) },
                            })
                          }
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                          Get alerted when you've spent this percentage of your budget
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={loading}
                    className={`flex-1 px-6 py-3 border rounded-xl transition-colors font-medium disabled:opacity-50 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
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

export default BudgetManagement;