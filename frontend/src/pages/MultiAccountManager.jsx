import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowRightLeft, Wallet, DollarSign, RefreshCw } from 'lucide-react';
import { accountAPI } from '../services/api';
import { useToast } from '../hooks/useToast';

const MultiAccountManager = () => {
  const { showSuccess, showError } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'checking', balance: '', isDefault: false });
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '' });

  const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'cash', label: 'Cash in Hand' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'credit', label: 'Credit Card' },
  ];

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-yellow-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setFetchLoading(true);
      const response = await accountAPI.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      showError('Failed to load accounts');
    } finally {
      setFetchLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: 'checking', balance: '', isDefault: false });
    setShowModal(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setFormData({ 
      name: account.name, 
      type: account.type, 
      balance: account.balance.toString(),
      isDefault: account.isDefault || false
    });
    setShowModal(true);
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      await accountAPI.delete(id);
      showSuccess('Account deleted successfully');
      await fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      showError(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.balance === '') {
      showError('Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const balance = parseFloat(formData.balance) || 0;

      if (editingAccount) {
        await accountAPI.update(editingAccount._id, {
          name: formData.name,
          type: formData.type,
          balance,
          isDefault: formData.isDefault
        });
        showSuccess('Account updated successfully');
      } else {
        await accountAPI.create({
          name: formData.name,
          type: formData.type,
          balance,
          isDefault: formData.isDefault
        });
        showSuccess('Account created successfully');
      }

      await fetchAccounts();
      setShowModal(false);
      setFormData({ name: '', type: 'checking', balance: '', isDefault: false });
    } catch (error) {
      console.error('Error saving account:', error);
      showError(error.response?.data?.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    const amount = parseFloat(transferData.amount);
    const fromId = transferData.from;
    const toId = transferData.to;

    if (!amount || !fromId || !toId || fromId === toId) {
      showError('Please select valid accounts and amount');
      return;
    }

    try {
      setLoading(true);
      await accountAPI.transfer({
        from: fromId,
        to: toId,
        amount
      });
      
      showSuccess('Transfer completed successfully');
      await fetchAccounts();
      setShowTransferModal(false);
      setTransferData({ from: '', to: '', amount: '' });
    } catch (error) {
      console.error('Error transferring funds:', error);
      showError(error.response?.data?.message || 'Failed to transfer funds');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = () => {
    fetchAccounts();
    showSuccess('Balances synchronized successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Multi-Account Management</h1>
          <p className="text-slate-600">Manage all your financial accounts in one place</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Total Balance</span>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">₹{totalBalance.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Total Accounts</span>
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{accounts.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between">
            <div>
              <span className="text-slate-600 text-sm font-medium block mb-2">Quick Actions</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium"
                >
                  Transfer
                </button>
                <button
                  onClick={handleSync}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition text-sm font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Your Accounts</h2>
            <button
              onClick={handleAddAccount}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Account
            </button>
          </div>

          {fetchLoading ? (
            <div className="text-center py-12 text-slate-500">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg mb-2">No accounts yet</p>
              <p className="text-sm">Click "Add Account" to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map(account => (
                <div key={account._id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${account.color || colors[0]} rounded-lg flex items-center justify-center`}>
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{account.name}</h3>
                        <p className="text-xs text-slate-500 capitalize">{account.type}</p>
                        {account.isDefault && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mt-1 inline-block">Default</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-1">Current Balance</p>
                    <p className="text-2xl font-bold text-slate-800">₹{account.balance.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Account Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Account Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Main Checking"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accountTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                {!editingAccount && (
                  <div className="mb-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Set as default account</span>
                    </label>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowModal(false); setFormData({ name: '', type: 'checking', balance: '', isDefault: false }); }}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Transfer Funds</h3>
              </div>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">From Account</label>
                  <select
                    value={transferData.from}
                    onChange={(e) => setTransferData({ ...transferData, from: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select account</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} (₹{acc.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">To Account</label>
                  <select
                    value={transferData.to}
                    onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select account</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowTransferModal(false); setTransferData({ from: '', to: '', amount: '' }); }}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium disabled:opacity-50"
                  >
                    {loading ? 'Transferring...' : 'Transfer'}
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

export default MultiAccountManager;
