import React, { useState } from 'react';
import { Split, CreditCard, DollarSign, User, Calendar, Download, Eye } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function SplitPaymentAnalysis() {
  const { sales, employees } = useData();
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = customEndDate ? new Date(customEndDate) : now;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  const filteredSales = sales.filter(sale =>
    sale.timestamp >= startDate &&
    sale.timestamp <= endDate &&
    sale.paymentMethod === 'split'
  );

  const getCashierName = (cashierId: string) => {
    const employee = employees.find(e => e.id === cashierId);
    return employee ? employee.name : 'Unknown';
  };

  const calculateMethodTotals = () => {
    const methodTotals = new Map<string, { count: number; total: number }>();

    filteredSales.forEach(sale => {
      if (sale.paymentDetails && Array.isArray(sale.paymentDetails)) {
        sale.paymentDetails.forEach(detail => {
          const existing = methodTotals.get(detail.method);
          if (existing) {
            existing.count += 1;
            existing.total += detail.amount;
          } else {
            methodTotals.set(detail.method, { count: 1, total: detail.amount });
          }
        });
      }
    });

    return Array.from(methodTotals.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total
    }));
  };

  const methodTotals = calculateMethodTotals();
  const grandTotal = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  const exportToCSV = () => {
    let csv = 'Split Payment Analysis Report\n\n';
    csv += `Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n`;

    csv += 'Receipt Number,Date,Time,Items,Subtotal,Tax,Discount,Total,Payment Methods,Cashier\n';

    filteredSales.forEach(sale => {
      const paymentMethodsStr = sale.paymentDetails
        .map((p: any) => `${p.method.toUpperCase()}:₦${p.amount.toLocaleString()}`)
        .join(' + ');

      csv += `${sale.receiptNumber},`;
      csv += `${new Date(sale.timestamp).toLocaleDateString()},`;
      csv += `${new Date(sale.timestamp).toLocaleTimeString()},`;
      csv += `${sale.items.length},`;
      csv += `₦${sale.subtotal.toLocaleString()},`;
      csv += `₦${sale.tax.toLocaleString()},`;
      csv += `₦${sale.discount.toLocaleString()},`;
      csv += `₦${sale.total.toLocaleString()},`;
      csv += `"${paymentMethodsStr}",`;
      csv += `${getCashierName(sale.cashierId)}\n`;
    });

    csv += '\n\nPayment Method Breakdown\n';
    csv += 'Method,Transactions,Total Amount\n';
    methodTotals.forEach(method => {
      csv += `${method.method.toUpperCase()},${method.count},₦${method.total.toLocaleString()}\n`;
    });

    csv += `\nGrand Total,${filteredSales.length},₦${grandTotal.toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `split_payment_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const viewSaleDetail = (sale: any) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Split className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Split Payment Analysis</h2>
              <p className="text-gray-600">Detailed breakdown of split payment transactions</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Split Transactions</p>
                <p className="text-2xl font-bold text-blue-900">{filteredSales.length}</p>
              </div>
              <Split className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Grand Total</p>
                <p className="text-2xl font-bold text-green-900">₦{grandTotal.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Payment Methods Used</p>
                <p className="text-2xl font-bold text-purple-900">{methodTotals.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg Split Value</p>
                <p className="text-2xl font-bold text-orange-900">
                  ₦{filteredSales.length > 0 ? (grandTotal / filteredSales.length).toFixed(0) : 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Total Split by Payment Method
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {methodTotals.map((method) => (
              <div key={method.method} className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 uppercase">{method.method}</p>
                <p className="text-xl font-bold text-gray-900">₦{method.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{method.count} transactions</p>
                <div className="mt-2 bg-blue-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(method.total / grandTotal) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((method.total / grandTotal) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Split Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Split</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No split payment transactions found for the selected date range
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {sale.receiptNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          <p>{new Date(sale.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{new Date(sale.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          {sale.paymentDetails.map((detail: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded uppercase">
                                {detail.method}
                              </span>
                              <span className="text-gray-900 font-medium">
                                ₦{detail.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ₦{sale.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{getCashierName(sale.cashierId)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => viewSaleDetail(sale)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Split Payment Details
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Receipt Info */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Receipt Number</p>
                    <p className="font-bold text-blue-900">{selectedSale.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Date & Time</p>
                    <p className="font-bold text-blue-900">
                      {new Date(selectedSale.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Cashier</p>
                    <p className="font-bold text-blue-900">{getCashierName(selectedSale.cashierId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Payment Method</p>
                    <p className="font-bold text-blue-900 uppercase">{selectedSale.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Items Sold */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Items Sold</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                            ₦{item.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                            ₦{item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Split Details */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Split Breakdown</h4>
                <div className="space-y-3">
                  {selectedSale.paymentDetails.map((detail: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900 uppercase">{detail.method}</p>
                          <p className="text-sm text-gray-500">Payment {idx + 1} of {selectedSale.paymentDetails.length}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">₦{detail.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          {((detail.amount / selectedSale.total) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">₦{selectedSale.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-red-600">-₦{selectedSale.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">₦{selectedSale.tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Grand Total</span>
                      <span className="text-lg font-bold text-green-600">₦{selectedSale.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
