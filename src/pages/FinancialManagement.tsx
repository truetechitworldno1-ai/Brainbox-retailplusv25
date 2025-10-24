import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar,
  FileText,
  Calculator,
  CreditCard,
  Upload,
  Download
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import ImportExportModal from '../components/ImportExportModal';
import ReportGenerator from '../components/ReportGenerator';

export default function FinancialManagement() {
  const { sales, analytics } = useData();
  const [dateRange, setDateRange] = useState('today');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const paymentMethods = [
    { method: 'cash', label: 'Cash', color: 'bg-green-100 text-green-800' },
    { method: 'pos', label: 'POS', color: 'bg-blue-100 text-blue-800' },
    { method: 'transfer', label: 'Transfer', color: 'bg-purple-100 text-purple-800' },
    { method: 'debit', label: 'Debit', color: 'bg-orange-100 text-orange-800' },
    { method: 'credit', label: 'Credit', color: 'bg-red-100 text-red-800' },
  ];

  const getPaymentMethodStats = () => {
    const stats = paymentMethods.map(method => {
      let total = 0;
      let count = 0;
      
      sales.forEach(sale => {
        if (sale.paymentMethod === method.method) {
          total += sale.total;
          count += 1;
        } else if (sale.paymentMethod === 'split') {
          sale.paymentDetails.forEach(detail => {
            if (detail.method === method.method) {
              total += detail.amount;
              count += 1;
            }
          });
        }
      });
      
      return {
        ...method,
        total,
        count,
        percentage: 0, // Will be calculated below
      };
    });
    
    // Recalculate percentages
    const totalRevenue = stats.reduce((sum, stat) => sum + stat.total, 0);
    stats.forEach(stat => {
      stat.percentage = totalRevenue > 0 ? (stat.total / totalRevenue) * 100 : 0;
    });
    
    return stats;
  };

  const paymentStats = getPaymentMethodStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="mt-2 text-gray-600">Track revenue, expenses, and financial reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="12hours">Last 12 Hours</option>
            <option value="24hours">Last 24 Hours</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="day_before_yesterday">Day Before Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₦{analytics.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.3%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900">₦{(analytics.totalRevenue * 0.35).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8.7%</span>
            <span className="text-gray-500 ml-1">margin</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₦{(analytics.totalRevenue * 0.45).toLocaleString()}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-600 font-medium">-3.2%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tax Collected</p>
              <p className="text-2xl font-bold text-gray-900">₦{(analytics.totalRevenue * 0.075).toLocaleString()}</p>
            </div>
            <Calculator className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            7.5% VAT
          </div>
        </div>
      </div>

      {/* Payment Methods Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Payment Methods Breakdown
          </h3>
          
          <div className="space-y-4">
            {paymentStats.map((stat) => (
              <div key={stat.method} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${stat.color}`}>
                    {stat.label}
                  </span>
                  <span className="text-sm text-gray-600">{stat.count} transactions</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₦{stat.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{stat.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Accounting Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-700 font-medium">Assets</span>
              <span className="font-bold text-green-900">₦{(analytics.totalRevenue * 1.2).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-red-700 font-medium">Liabilities</span>
              <span className="font-bold text-red-900">₦{(analytics.totalRevenue * 0.3).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700 font-medium">Equity</span>
              <span className="font-bold text-blue-900">₦{(analytics.totalRevenue * 0.9).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-700 font-medium">Accounts Receivable</span>
              <span className="font-bold text-yellow-900">₦{(analytics.totalRevenue * 0.15).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Receipt #</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Method</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 10).map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{sale.receiptNumber}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {sale.timestamp.toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paymentMethods.find(m => m.method === sale.paymentMethod)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    ₦{sale.total.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import/Export Modals */}
      <ImportExportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        mode="import"
      />
      <ImportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        mode="export"
      />
      <ReportGenerator
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}