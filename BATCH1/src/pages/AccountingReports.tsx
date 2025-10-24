import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, DollarSign, PieChart, BarChart3, AlertCircle } from 'lucide-react';
import { accountingService } from '../services/AccountingService';
import { AccountingReport } from '../types';
import { useAuth } from '../contexts/AuthContext';

const AccountingReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AccountingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AccountingReport | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const canAccessReports = user && ['accountant', 'supervisor', 'auditor', 'manager'].includes(user.role);

  const generateReport = async (type: AccountingReport['type']) => {
    if (!user || !canAccessReports) return;
    
    setLoading(true);
    try {
      let report: AccountingReport;
      
      switch (type) {
        case 'profit_loss':
          report = await accountingService.generateProfitLossReport(dateRange.start, dateRange.end, user.id);
          break;
        case 'balance_sheet':
          report = await accountingService.generateBalanceSheetReport(dateRange.end, user.id);
          break;
        case 'cash_flow':
          report = await accountingService.generateCashFlowReport(dateRange.start, dateRange.end, user.id);
          break;
        case 'expense_report':
          report = await accountingService.generateExpenseReport(dateRange.start, dateRange.end, user.id);
          break;
        default:
          return;
      }
      
      setReports(prev => [report, ...prev]);
      setSelectedReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (report: AccountingReport) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!canAccessReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You need accountant, supervisor, auditor, or manager role to access accounting reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Accounting Reports</h1>
        <div className="text-sm text-gray-600">
          Role: <span className="font-medium capitalize">{user?.role}</span>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Report Period
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Report Generation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => generateReport('profit_loss')}
          disabled={loading}
          className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 disabled:opacity-50 flex flex-col items-center gap-3"
        >
          <TrendingUp className="w-8 h-8" />
          <span className="font-medium">Profit & Loss</span>
        </button>

        <button
          onClick={() => generateReport('balance_sheet')}
          disabled={loading}
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex flex-col items-center gap-3"
        >
          <BarChart3 className="w-8 h-8" />
          <span className="font-medium">Balance Sheet</span>
        </button>

        <button
          onClick={() => generateReport('cash_flow')}
          disabled={loading}
          className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex flex-col items-center gap-3"
        >
          <DollarSign className="w-8 h-8" />
          <span className="font-medium">Cash Flow</span>
        </button>

        <button
          onClick={() => generateReport('expense_report')}
          disabled={loading}
          className="bg-orange-600 text-white p-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex flex-col items-center gap-3"
        >
          <PieChart className="w-8 h-8" />
          <span className="font-medium">Expense Report</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Generating report...</span>
        </div>
      )}

      {/* Generated Reports List */}
      {reports.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Generated Reports</h2>
          </div>
          <div className="divide-y">
            {reports.map((report) => (
              <div key={report.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-600">
                      Generated on {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    View
                  </button>
                  <button
                    onClick={() => downloadReport(report)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Viewer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{selectedReport.title}</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {selectedReport.type === 'profit_loss' && (
                <ProfitLossView data={selectedReport.data} />
              )}
              {selectedReport.type === 'balance_sheet' && (
                <BalanceSheetView data={selectedReport.data} />
              )}
              {selectedReport.type === 'cash_flow' && (
                <CashFlowView data={selectedReport.data} />
              )}
              {selectedReport.type === 'expense_report' && (
                <ExpenseReportView data={selectedReport.data} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Report View Components
const ProfitLossView: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-800">Revenue</h3>
        <p className="text-2xl font-bold text-green-900">₦{data.revenue.toLocaleString()}</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="font-medium text-red-800">Cost of Goods</h3>
        <p className="text-2xl font-bold text-red-900">₦{data.cost.toLocaleString()}</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800">Gross Profit</h3>
        <p className="text-2xl font-bold text-blue-900">₦{data.grossProfit.toLocaleString()}</p>
        <p className="text-sm text-blue-700">{data.grossMargin.toFixed(1)}% margin</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-medium text-purple-800">Net Profit</h3>
        <p className="text-2xl font-bold text-purple-900">₦{data.netProfit.toLocaleString()}</p>
        <p className="text-sm text-purple-700">{data.netMargin.toFixed(1)}% margin</p>
      </div>
    </div>
  </div>
);

const BalanceSheetView: React.FC<{ data: any }> = ({ data }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Assets</h3>
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium">Current Assets</h4>
          <div className="text-sm space-y-1 mt-2">
            <div className="flex justify-between">
              <span>Cash</span>
              <span>₦{data.assets.currentAssets.cash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Inventory</span>
              <span>₦{data.assets.currentAssets.inventory.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total Current</span>
              <span>₦{data.assets.currentAssets.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium">Fixed Assets</h4>
          <div className="text-sm space-y-1 mt-2">
            <div className="flex justify-between">
              <span>Equipment</span>
              <span>₦{data.assets.fixedAssets.equipment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total Fixed</span>
              <span>₦{data.assets.fixedAssets.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <div className="flex justify-between font-bold">
            <span>Total Assets</span>
            <span>₦{data.assets.totalAssets.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Liabilities & Equity</h3>
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium">Liabilities</h4>
          <div className="text-sm space-y-1 mt-2">
            <div className="flex justify-between">
              <span>Accounts Payable</span>
              <span>₦{data.liabilities.currentLiabilities.accountsPayable.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total Liabilities</span>
              <span>₦{data.liabilities.totalLiabilities.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="flex justify-between font-bold">
            <span>Owner's Equity</span>
            <span>₦{data.equity.totalEquity.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CashFlowView: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-800">Operating Activities</h3>
        <p className="text-xl font-bold text-green-900">₦{data.operatingActivities.netCashFromOperations.toLocaleString()}</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800">Investing Activities</h3>
        <p className="text-xl font-bold text-blue-900">₦{data.investingActivities.netCashFromInvesting.toLocaleString()}</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-medium text-purple-800">Financing Activities</h3>
        <p className="text-xl font-bold text-purple-900">₦{data.financingActivities.netCashFromFinancing.toLocaleString()}</p>
      </div>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <span className="font-medium">Net Cash Flow</span>
        <span className="text-2xl font-bold">₦{data.netCashFlow.toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const ExpenseReportView: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Expense Categories</h3>
        <div className="space-y-2">
          {data.categories.map((category: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">{category.name}</span>
              <div className="text-right">
                <div className="font-bold">₦{category.amount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">{category.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="space-y-3">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800">Total Expenses</h4>
            <p className="text-2xl font-bold text-red-900">₦{data.totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800">Average Monthly</h4>
            <p className="text-xl font-bold text-blue-900">₦{data.averageMonthlyExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AccountingReports;