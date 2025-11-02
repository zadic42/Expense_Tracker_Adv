import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Database, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { transactionAPI } from '../services/api';
import { useToast } from '../hooks/useToast';

const DataManagement = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAll({ limit: 1000 });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Type', 'Category', 'Subcategory', 'Amount', 'Payee', 'Payment Mode', 'Account', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...transactions.map(t => 
          `${new Date(t.date).toISOString().split('T')[0]},"${t.type}","${t.category}","${t.subcategory}",${t.amount},"${t.payee}","${t.paymentMode}","${t.account}","${t.remarks || ''}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showSuccess('Transactions exported to CSV successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export transactions');
    }
  };

  const exportToPDF = () => {
    try {
      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .income { color: #059669; }
              .expense { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1>Transaction Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Payee</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map(t => `
                  <tr>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>${t.type}</td>
                    <td>${t.category}</td>
                    <td>${t.payee}</td>
                    <td class="${t.type}">${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}</td>
                    <td>${t.paymentMode}</td>
                    <td>${t.account}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
      showSuccess('PDF report generated');
    } catch (error) {
      console.error('PDF export error:', error);
      showError('Failed to export PDF');
    }
  };

  const validateCSV = (data) => {
    const errors = [];
    const requiredHeaders = ['date', 'type', 'category', 'amount', 'payee'];
    
    if (!data || data.length === 0) {
      errors.push('CSV file is empty');
      return errors;
    }

    const headers = Object.keys(data[0]).map(h => h.toLowerCase());
    requiredHeaders.forEach(header => {
      if (!headers.includes(header)) {
        errors.push(`Missing required column: ${header}`);
      }
    });

    data.forEach((row, index) => {
      if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        errors.push(`Row ${index + 2}: Invalid date format (use YYYY-MM-DD)`);
      }
      if (!row.payee || row.payee.trim() === '') {
        errors.push(`Row ${index + 2}: Payee is required`);
      }
      if (!row.amount || isNaN(parseFloat(row.amount))) {
        errors.push(`Row ${index + 2}: Invalid amount`);
      }
      if (!row.type || !['income', 'expense'].includes(row.type.toLowerCase())) {
        errors.push(`Row ${index + 2}: Type must be 'income' or 'expense'`);
      }
    });

    return errors;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setImportStatus(null);
      setValidationErrors([]);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setValidationErrors([]);

    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setValidationErrors(['CSV file must have at least a header row and one data row']);
        setImportStatus('error');
        setImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      const errors = validateCSV(data);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setImportStatus('error');
      } else {
        // Import transactions
        let successCount = 0;
        let failCount = 0;

        for (const row of data) {
          try {
            await transactionAPI.create({
              type: row.type.toLowerCase(),
              category: row.category || 'Other',
              subcategory: row.subcategory || 'Miscellaneous',
              amount: parseFloat(row.amount),
              paymentMode: row.paymentmode || row['payment mode'] || 'Cash',
              payee: row.payee,
              account: row.account || 'Main Account',
              date: row.date,
              time: row.time || new Date().toTimeString().slice(0, 5),
              remarks: row.remarks || row.notes || '',
            });
            successCount++;
          } catch (error) {
            console.error('Error importing transaction:', error);
            failCount++;
          }
        }

        if (successCount > 0) {
          showSuccess(`Successfully imported ${successCount} transaction(s)`);
          if (failCount > 0) {
            showWarning(`${failCount} transaction(s) failed to import`);
          }
          setImportStatus('success');
          setImportFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          await fetchTransactions();
        } else {
          showError('Failed to import transactions');
          setImportStatus('error');
        }
      }
    } catch (error) {
      setValidationErrors([`Error reading file: ${error.message}`]);
      setImportStatus('error');
      showError('Failed to read CSV file');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleContent = `date,type,category,subcategory,amount,payee,paymentmode,account,remarks
2024-11-01,expense,Food,Groceries,-75.50,Grocery Store,Cash,Main Account,Weekly groceries
2024-11-02,income,Salary,Monthly,3000.00,Company,Net Banking,Main Account,Monthly salary
2024-11-03,expense,Bills,Electricity,-120.00,Electric Company,UPI,Main Account,Electric bill`;

    const blob = new Blob([sampleContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showSuccess('Sample CSV downloaded');
  };

  const createBackup = () => {
    try {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        transactions: transactions,
        settings: { currency: 'INR', theme: 'light' }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      showSuccess('Backup created successfully');
    } catch (error) {
      console.error('Backup error:', error);
      showError('Failed to create backup');
    }
  };

  const restoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.transactions || !Array.isArray(backupData.transactions)) {
        showError('Invalid backup file format');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const transaction of backupData.transactions) {
        try {
          await transactionAPI.create({
            type: transaction.type,
            category: transaction.category,
            subcategory: transaction.subcategory || 'Miscellaneous',
            amount: transaction.amount,
            paymentMode: transaction.paymentMode,
            payee: transaction.payee,
            account: transaction.account,
            date: transaction.date,
            time: transaction.time || new Date().toTimeString().slice(0, 5),
            remarks: transaction.remarks || '',
            attachment: transaction.attachment || '',
          });
          successCount++;
        } catch (error) {
          console.error('Error restoring transaction:', error);
          failCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`Successfully restored ${successCount} transaction(s)`);
        if (failCount > 0) {
          showWarning(`${failCount} transaction(s) failed to restore`);
        }
        await fetchTransactions();
      } else {
        showError('Failed to restore transactions');
      }
    } catch (error) {
      console.error('Restore error:', error);
      showError('Failed to restore backup');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Data Management</h1>
          <p className="text-slate-600">Export, import, and backup your financial data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Export Data</h2>
                <p className="text-sm text-slate-600">Download your transactions</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={exportToCSV}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Export as CSV</div>
                    <div className="text-xs text-blue-100">Spreadsheet format</div>
                  </div>
                </div>
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={exportToPDF}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Export as PDF</div>
                    <div className="text-xs text-red-100">Printable format</div>
                  </div>
                </div>
                <Download className="w-5 h-5" />
              </button>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-700 mb-2">Export Details</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Includes {transactions.length} transaction records</li>
                  <li>• Preserves categories and dates</li>
                  <li>• Compatible with Excel and Google Sheets</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Import Data</h2>
                <p className="text-sm text-slate-600">Upload CSV transactions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-700 font-medium mb-1">
                    {importFile ? importFile.name : 'Click to upload CSV file'}
                  </p>
                  <p className="text-sm text-slate-500">or drag and drop</p>
                </label>
              </div>

              {importFile && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import Transactions'}
                </button>
              )}

              {importStatus === 'success' && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">Import successful!</span>
                </div>
              )}

              {importStatus === 'error' && validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">Validation Errors:</span>
                  </div>
                  <ul className="text-sm text-red-600 space-y-1 ml-7">
                    {validationErrors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li className="text-red-500 italic">...and {validationErrors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}

              <button
                onClick={downloadSampleCSV}
                className="w-full py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
              >
                Download Sample CSV
              </button>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-700 mb-2">CSV Format</h3>
                <p className="text-xs text-slate-600 mb-2">Required columns:</p>
                <code className="text-xs bg-slate-200 px-2 py-1 rounded block text-slate-800">
                  date, type, category, amount, payee
                </code>
              </div>
            </div>
          </div>

          {/* Backup Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Data Backup</h2>
                <p className="text-sm text-slate-600">Create and restore complete backups</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={createBackup}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Create Backup</div>
                    <div className="text-xs text-purple-100">Full data export</div>
                  </div>
                </div>
                <Download className="w-5 h-5" />
              </button>

              <label className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all shadow-md hover:shadow-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Restore Backup</div>
                    <div className="text-xs text-slate-100">Import backup file</div>
                  </div>
                </div>
                <Upload className="w-5 h-5" />
                <input
                  type="file"
                  accept=".json"
                  onChange={restoreBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">What's Included</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• All transactions</li>
                  <li>• Categories & budgets</li>
                  <li>• App settings</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">File Format</h4>
                <p className="text-sm text-blue-700">JSON format with timestamp and version info</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2">Recommendation</h4>
                <p className="text-sm text-amber-700">Create weekly backups for data safety</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Current Data Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{transactions.length}</div>
              <div className="text-sm text-slate-600 mt-1">Transactions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {new Set(transactions.map(t => t.category)).size}
              </div>
              <div className="text-sm text-slate-600 mt-1">Categories</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {transactions.length > 0 ? Math.ceil((new Date() - new Date(transactions[transactions.length - 1].date)) / (1000 * 60 * 60 * 24)) : 0}
              </div>
              <div className="text-sm text-slate-600 mt-1">Days of Data</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">
                {(JSON.stringify(transactions).length / 1024).toFixed(2)}KB
              </div>
              <div className="text-sm text-slate-600 mt-1">Data Size</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;