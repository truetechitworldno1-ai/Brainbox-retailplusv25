import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, Calendar, Download } from 'lucide-react';
import { VATReport } from '../types';
import { supabase } from '../lib/supabase';

export default function VATAnalysis() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [report, setReport] = useState<VATReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    generateReport();
  }, [period]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      if (!supabase) {
        // Demo data for offline mode
        setReport(generateDemoReport(startDate, endDate));
        setLoading(false);
        return;
      }

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const processedReport = processSalesData(sales || [], startDate, endDate);
      setReport(processedReport);
    } catch (error) {
      console.error('Error generating VAT report:', error);
      const { startDate, endDate } = getDateRange();
      setReport(generateDemoReport(startDate, endDate));
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      switch (period) {
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      endDate = new Date();
    }

    return { startDate, endDate };
  };

  const processSalesData = (sales: any[], startDate: Date, endDate: Date): VATReport => {
    let totalSales = 0;
    let taxableSales = 0;
    let nonTaxableSales = 0;
    let totalVAT = 0;
    const taxRateMap = new Map<number, { salesAmount: number; vatAmount: number; transactionCount: number }>();
    const dailyMap = new Map<string, { totalSales: number; vatCollected: number }>();

    sales.forEach((sale) => {
      const saleAmount = parseFloat(sale.total_amount) || 0;
      const vatAmount = parseFloat(sale.tax_amount) || 0;
      const subtotal = parseFloat(sale.subtotal) || saleAmount;

      totalSales += saleAmount;
      totalVAT += vatAmount;

      if (vatAmount > 0) {
        taxableSales += subtotal;
        const taxRate = subtotal > 0 ? ((vatAmount / subtotal) * 100) : 0;
        const roundedRate = Math.round(taxRate * 10) / 10;

        const existing = taxRateMap.get(roundedRate) || { salesAmount: 0, vatAmount: 0, transactionCount: 0 };
        taxRateMap.set(roundedRate, {
          salesAmount: existing.salesAmount + subtotal,
          vatAmount: existing.vatAmount + vatAmount,
          transactionCount: existing.transactionCount + 1
        });
      } else {
        nonTaxableSales += saleAmount;
      }

      // Daily breakdown
      const dateKey = new Date(sale.created_at).toISOString().split('T')[0];
      const daily = dailyMap.get(dateKey) || { totalSales: 0, vatCollected: 0 };
      dailyMap.set(dateKey, {
        totalSales: daily.totalSales + saleAmount,
        vatCollected: daily.vatCollected + vatAmount
      });
    });

    const salesByTaxRate = Array.from(taxRateMap.entries()).map(([taxRate, data]) => ({
      taxRate,
      ...data
    })).sort((a, b) => b.salesAmount - a.salesAmount);

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        ...data
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      period,
      startDate,
      endDate,
      totalSales,
      taxableSales,
      nonTaxableSales,
      totalVAT,
      salesByTaxRate,
      dailyBreakdown
    };
  };

  const generateDemoReport = (startDate: Date, endDate: Date): VATReport => {
    return {
      period,
      startDate,
      endDate,
      totalSales: 1250000,
      taxableSales: 950000,
      nonTaxableSales: 300000,
      totalVAT: 71250,
      salesByTaxRate: [
        { taxRate: 7.5, salesAmount: 950000, vatAmount: 71250, transactionCount: 145 }
      ],
      dailyBreakdown: []
    };
  };

  const exportReport = () => {
    if (!report) return;

    const csvContent = [
      ['VAT Analysis Report'],
      ['Period', period],
      ['Start Date', report.startDate.toLocaleDateString()],
      ['End Date', report.endDate.toLocaleDateString()],
      [''],
      ['Summary'],
      ['Total Sales', report.totalSales.toFixed(2)],
      ['Taxable Sales', report.taxableSales.toFixed(2)],
      ['Non-Taxable Sales', report.nonTaxableSales.toFixed(2)],
      ['Total VAT Collected', report.totalVAT.toFixed(2)],
      [''],
      ['Sales by Tax Rate'],
      ['Tax Rate (%)', 'Sales Amount', 'VAT Amount', 'Transaction Count'],
      ...report.salesByTaxRate.map(item => [
        item.taxRate,
        item.salesAmount.toFixed(2),
        item.vatAmount.toFixed(2),
        item.transactionCount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vat-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 border-2 border-green-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-green-900 flex items-center gap-2">
                <FileText className="w-7 h-7 md:w-8 md:h-8" />
                VAT Analysis
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Comprehensive tax reporting and analysis
              </p>
            </div>
            <button
              onClick={exportReport}
              disabled={!report || loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
            >
              <Download className="w-5 h-5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-green-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Report Period
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className={`px-4 py-3 rounded-lg font-medium capitalize transition-all min-h-[48px] ${
                  period === p
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
              />
            </div>
          </div>

          {(customStartDate || customEndDate) && (
            <button
              onClick={generateReport}
              className="mt-3 w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all min-h-[44px]"
            >
              Generate Custom Report
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Generating VAT report...</p>
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                      ₦{report.totalSales.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taxable Sales</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                      ₦{report.taxableSales.toLocaleString()}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Non-Taxable</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                      ₦{report.nonTaxableSales.toLocaleString()}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total VAT</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                      ₦{report.totalVAT.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Sales by Tax Rate */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-green-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
                Sales by Tax Rate
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 md:px-4 text-sm md:text-base font-semibold text-gray-700">Tax Rate</th>
                      <th className="text-right py-3 px-2 md:px-4 text-sm md:text-base font-semibold text-gray-700">Sales Amount</th>
                      <th className="text-right py-3 px-2 md:px-4 text-sm md:text-base font-semibold text-gray-700">VAT Amount</th>
                      <th className="text-right py-3 px-2 md:px-4 text-sm md:text-base font-semibold text-gray-700">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.salesByTaxRate.length > 0 ? (
                      report.salesByTaxRate.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 md:px-4 text-sm md:text-base">{item.taxRate}%</td>
                          <td className="py-3 px-2 md:px-4 text-right text-sm md:text-base">
                            ₦{item.salesAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 md:px-4 text-right font-semibold text-green-600 text-sm md:text-base">
                            ₦{item.vatAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 md:px-4 text-right text-sm md:text-base">
                            {item.transactionCount}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No taxable sales in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Breakdown */}
            {report.dailyBreakdown && report.dailyBreakdown.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-green-200">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
                  Daily Breakdown
                </h2>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 md:px-4 text-sm md:text-base font-semibold text-gray-700">Date</th>
                        <th className="text-right py-3 px-2 md:px-4 text-sm md:text-base font-semibold text-gray-700">Total Sales</th>
                        <th className="text-right py-3 px-2 md:px-4 text-sm md:text-base font-semibold text-gray-700">VAT Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.dailyBreakdown.map((day, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 md:px-4 text-sm md:text-base">
                            {day.date.toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 md:px-4 text-right text-sm md:text-base">
                            ₦{day.totalSales.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 md:px-4 text-right font-semibold text-green-600 text-sm md:text-base">
                            ₦{day.vatCollected.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a period to generate VAT report</p>
          </div>
        )}
      </div>
    </div>
  );
}
