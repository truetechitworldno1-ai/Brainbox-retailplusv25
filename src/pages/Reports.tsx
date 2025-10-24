import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  User,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  CreditCard,
  Clock,
  AlertTriangle,
  Phone,
  Tag,
  ShoppingCart,
  Filter,
  Eye,
  Split
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import SplitPaymentAnalysis from '../components/SplitPaymentAnalysis';

export default function Reports() {
  const { sales, products, customers, suppliers, systemSettings, categories, employees } = useData();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedReport, setSelectedReport] = useState('comprehensive');

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report', icon: FileText },
    { value: 'split_payment', label: 'Split Payment Analysis', icon: Split },
    { value: 'items_sold', label: 'Items Sold Details', icon: Package },
    { value: 'payment_methods', label: 'Payment Methods Analysis', icon: CreditCard },
    { value: 'categories', label: 'Categories Summary', icon: Tag },
    { value: 'sales_by_phone', label: 'Sales by Phone Summary', icon: Phone },
    { value: 'staff_performance', label: 'Staff Performance', icon: Users },
    { value: 'inventory_status', label: 'Inventory Status', icon: BarChart3 },
    { value: 'gift_expense', label: 'Gift Expense Report', icon: AlertTriangle },
    { value: 'gift_income', label: 'Gift Income Report', icon: TrendingUp },
  ];

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (dateRange) {
      case '12hours':
        startDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '24hours':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'day_before_yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
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

  const generateReportData = () => {
    const { startDate, endDate } = getDateRange();
    const filteredSales = sales.filter(sale => 
      sale.timestamp >= startDate && sale.timestamp <= endDate
    );

    // Items Sold Analysis
    const itemsSold = new Map<string, {
      productId: string;
      productName: string;
      category: string;
      brand: string;
      quantitySold: number;
      revenue: number;
      profit: number;
      profitMargin: number;
      barcodes: string[];
    }>();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = itemsSold.get(item.productId);
        const product = products.find(p => p.id === item.productId);
        const itemProfit = (item.unitPrice - (product?.costPrice || 0)) * item.quantity;
        
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += item.total;
          existing.profit += itemProfit;
          existing.profitMargin = existing.profit / existing.revenue * 100;
          if (!existing.barcodes.includes(item.barcode)) {
            existing.barcodes.push(item.barcode);
          }
        } else {
          itemsSold.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            category: product?.category || 'Unknown',
            brand: product?.brand || 'Unknown',
            quantitySold: item.quantity,
            revenue: item.total,
            profit: itemProfit,
            profitMargin: itemProfit / item.total * 100,
            barcodes: [item.barcode]
          });
        }
      });
    });

    // Payment Methods Analysis
    const paymentMethods = new Map<string, { count: number; total: number; percentage: number }>();
    const paymentMethodsSplit = new Map<string, {
      totalAmount: number;
      splitAmount: number;
      nonSplitAmount: number;
      splitCount: number;
      nonSplitCount: number;
      totalCount: number;
      cashiers: Set<string>;
    }>();
    const totalSalesRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

    filteredSales.forEach(sale => {
      if (sale.paymentMethod === 'split') {
        sale.paymentDetails.forEach(detail => {
          const existing = paymentMethods.get(detail.method);
          if (existing) {
            existing.count += 1;
            existing.total += detail.amount;
          } else {
            paymentMethods.set(detail.method, { count: 1, total: detail.amount, percentage: 0 });
          }

          // Track split amounts separately
          const splitTracking = paymentMethodsSplit.get(detail.method);
          if (splitTracking) {
            splitTracking.splitAmount += detail.amount;
            splitTracking.totalAmount += detail.amount;
            splitTracking.splitCount += 1;
            splitTracking.totalCount += 1;
            splitTracking.cashiers.add(sale.cashierId);
          } else {
            paymentMethodsSplit.set(detail.method, {
              totalAmount: detail.amount,
              splitAmount: detail.amount,
              nonSplitAmount: 0,
              splitCount: 1,
              nonSplitCount: 0,
              totalCount: 1,
              cashiers: new Set([sale.cashierId])
            });
          }
        });
      } else {
        const existing = paymentMethods.get(sale.paymentMethod);
        if (existing) {
          existing.count += 1;
          existing.total += sale.total;
        } else {
          paymentMethods.set(sale.paymentMethod, { count: 1, total: sale.total, percentage: 0 });
        }

        // Track non-split amounts
        const splitTracking = paymentMethodsSplit.get(sale.paymentMethod);
        if (splitTracking) {
          splitTracking.nonSplitAmount += sale.total;
          splitTracking.totalAmount += sale.total;
          splitTracking.nonSplitCount += 1;
          splitTracking.totalCount += 1;
          splitTracking.cashiers.add(sale.cashierId);
        } else {
          paymentMethodsSplit.set(sale.paymentMethod, {
            totalAmount: sale.total,
            splitAmount: 0,
            nonSplitAmount: sale.total,
            splitCount: 0,
            nonSplitCount: 1,
            totalCount: 1,
            cashiers: new Set([sale.cashierId])
          });
        }
      }
    });

    paymentMethods.forEach((data) => {
      data.percentage = totalSalesRevenue > 0 ? (data.total / totalSalesRevenue) * 100 : 0;
    });

    // Categories Summary
    const categorySummary = categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category.name);
      const categorySales = filteredSales.flatMap(sale => 
        sale.items.filter(item => {
          const product = products.find(p => p.id === item.productId);
          return product?.category === category.name;
        })
      );
      
      const totalSold = categorySales.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = categorySales.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...category,
        totalProducts: categoryProducts.length,
        totalSold,
        totalRevenue,
        averagePrice: categoryProducts.length > 0 
          ? categoryProducts.reduce((sum, p) => sum + p.sellingPrice, 0) / categoryProducts.length 
          : 0,
        lowStockCount: categoryProducts.filter(p => p.stock <= p.minStock).length
      };
    });

    // Sales by Phone Summary (customers with phone numbers)
    const salesByPhone = customers
      .filter(customer => customer.phone)
      .map(customer => {
        const customerSales = filteredSales.filter(sale => sale.customerId === customer.id);
        const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalItems = customerSales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );
        
        return {
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.phone,
          email: customer.email,
          salesCount: customerSales.length,
          totalSpent,
          totalItems,
          loyaltyPoints: customer.loyaltyCard.points,
          tier: customer.loyaltyCard.tier,
          lastPurchase: customer.lastPurchase
        };
      })
      .filter(customer => customer.salesCount > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Staff Performance
    const staffPerformance = new Map<string, {
      staffId: string;
      staffName: string;
      salesCount: number;
      totalRevenue: number;
      itemsProcessed: number;
      averageSaleValue: number;
      totalProfit: number;
    }>();

    filteredSales.forEach(sale => {
      const existing = staffPerformance.get(sale.cashierId);
      const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      const saleProfit = sale.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + ((item.unitPrice - (product?.costPrice || 0)) * item.quantity);
      }, 0);
      
      if (existing) {
        existing.salesCount += 1;
        existing.totalRevenue += sale.total;
        existing.itemsProcessed += itemCount;
        existing.totalProfit += saleProfit;
        existing.averageSaleValue = existing.totalRevenue / existing.salesCount;
      } else {
        staffPerformance.set(sale.cashierId, {
          staffId: sale.cashierId,
          staffName: sale.cashierId === '1' ? 'System Administrator' : `Staff ${sale.cashierId}`,
          salesCount: 1,
          totalRevenue: sale.total,
          itemsProcessed: itemCount,
          totalProfit: saleProfit,
          averageSaleValue: sale.total
        });
      }
    });

    return {
      dateRange: { startDate, endDate },
      summary: {
        totalSales: filteredSales.length,
        totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
        totalItems: filteredSales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        ),
        averageSale: filteredSales.length > 0 
          ? filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length 
          : 0,
        totalDiscount: filteredSales.reduce((sum, sale) => sum + sale.discount, 0),
        totalTax: filteredSales.reduce((sum, sale) => sum + sale.tax, 0),
      },
      itemsSold: Array.from(itemsSold.values()),
      paymentMethods: Array.from(paymentMethods.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        total: data.total,
        percentage: data.percentage
      })),
      paymentMethodsSplit: Array.from(paymentMethodsSplit.entries()).map(([method, data]) => ({
        method,
        totalAmount: data.totalAmount,
        splitAmount: data.splitAmount,
        nonSplitAmount: data.nonSplitAmount,
        splitCount: data.splitCount,
        nonSplitCount: data.nonSplitCount,
        totalCount: data.totalCount,
        cashiers: Array.from(data.cashiers)
      })),
      categorySummary,
      salesByPhone,
      staffPerformance: Array.from(staffPerformance.values())
    };
  };

  const downloadReport = () => {
    const reportData = generateReportData();
    const { startDate, endDate } = reportData.dateRange;
    
    let reportContent = `BRAINBOX RETAILPLUS - ${selectedReport.toUpperCase().replace('_', ' ')} REPORT\n`;
    reportContent += `${'='.repeat(80)}\n`;
    reportContent += `Generated by: ${user?.name} (${user?.role})\n`;
    reportContent += `Report Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n`;
    reportContent += `Business: ${systemSettings.businessName}\n\n`;

    switch (selectedReport) {
      case 'items_sold':
        reportContent += `ITEMS SOLD DETAILS\n`;
        reportContent += `==================\n`;
        reportContent += `Product Name`.padEnd(30) + `Category`.padEnd(15) + `Brand`.padEnd(15) + `Qty Sold`.padEnd(10) + `Revenue`.padEnd(15) + `Profit`.padEnd(15) + `Barcodes Used\n`;
        reportContent += `${'='.repeat(115)}\n`;
        reportData.itemsSold.forEach(item => {
          reportContent += `${item.productName.padEnd(30)}${item.category.padEnd(15)}${item.brand.padEnd(15)}${item.quantitySold.toString().padEnd(10)}₦${item.revenue.toLocaleString().padEnd(14)}₦${item.profit.toLocaleString().padEnd(14)}${item.barcodes.join(', ')}\n`;
        });
        break;

      case 'payment_methods':
        reportContent += `PAYMENT METHODS ANALYSIS\n`;
        reportContent += `========================\n`;
        reportContent += `Method`.padEnd(15) + `Transactions`.padEnd(15) + `Total Amount`.padEnd(18) + `Percentage`.padEnd(12) + `Average Transaction\n`;
        reportContent += `${'='.repeat(75)}\n`;
        reportData.paymentMethods.forEach(method => {
          const avgTransaction = method.count > 0 ? method.total / method.count : 0;
          reportContent += `${method.method.toUpperCase().padEnd(15)}${method.count.toString().padEnd(15)}₦${method.total.toLocaleString().padEnd(17)}${method.percentage.toFixed(1)}%`.padEnd(12) + `₦${avgTransaction.toLocaleString()}\n`;
        });
        break;

      case 'categories':
        reportContent += `CATEGORIES SUMMARY\n`;
        reportContent += `==================\n`;
        reportContent += `Category`.padEnd(20) + `Products`.padEnd(10) + `Items Sold`.padEnd(12) + `Revenue`.padEnd(15) + `Avg Price`.padEnd(12) + `Low Stock\n`;
        reportContent += `${'='.repeat(85)}\n`;
        reportData.categorySummary.forEach(category => {
          reportContent += `${category.name.padEnd(20)}${category.totalProducts.toString().padEnd(10)}${category.totalSold.toString().padEnd(12)}₦${category.totalRevenue.toLocaleString().padEnd(14)}₦${category.averagePrice.toLocaleString().padEnd(11)}${category.lowStockCount}\n`;
        });
        break;

      case 'sales_by_phone':
        reportContent += `SALES BY PHONE SUMMARY\n`;
        reportContent += `======================\n`;
        reportContent += `Customer Name`.padEnd(25) + `Phone`.padEnd(18) + `Sales`.padEnd(8) + `Total Spent`.padEnd(15) + `Items`.padEnd(8) + `Loyalty Points`.padEnd(15) + `Tier\n`;
        reportContent += `${'='.repeat(105)}\n`;
        reportData.salesByPhone.forEach(customer => {
          reportContent += `${customer.customerName.padEnd(25)}${customer.phone.padEnd(18)}${customer.salesCount.toString().padEnd(8)}₦${customer.totalSpent.toLocaleString().padEnd(14)}${customer.totalItems.toString().padEnd(8)}${customer.loyaltyPoints.toString().padEnd(15)}${customer.tier}\n`;
        });
        break;

      case 'staff_performance':
        reportContent += `STAFF PERFORMANCE ANALYSIS\n`;
        reportContent += `===========================\n`;
        reportContent += `Staff Name`.padEnd(25) + `Sales Count`.padEnd(12) + `Revenue`.padEnd(15) + `Items Processed`.padEnd(16) + `Avg Sale`.padEnd(12) + `Profit Generated\n`;
        reportContent += `${'='.repeat(95)}\n`;
        reportData.staffPerformance.forEach(staff => {
          reportContent += `${staff.staffName.padEnd(25)}${staff.salesCount.toString().padEnd(12)}₦${staff.totalRevenue.toLocaleString().padEnd(14)}${staff.itemsProcessed.toString().padEnd(16)}₦${staff.averageSaleValue.toLocaleString().padEnd(11)}₦${staff.totalProfit.toLocaleString()}\n`;
        });
        break;

      default:
        // Comprehensive report
        reportContent += `EXECUTIVE SUMMARY\n`;
        reportContent += `=================\n`;
        reportContent += `Total Sales: ${reportData.summary.totalSales}\n`;
        reportContent += `Total Revenue: ₦${reportData.summary.totalRevenue.toLocaleString()}\n`;
        reportContent += `Total Items Sold: ${reportData.summary.totalItems}\n`;
        reportContent += `Average Sale: ₦${reportData.summary.averageSale.toFixed(2)}\n\n`;
        
        reportContent += `TOP SELLING ITEMS\n`;
        reportContent += `=================\n`;
        reportData.itemsSold.sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10).forEach((item, index) => {
          reportContent += `${index + 1}. ${item.productName} - ${item.quantitySold} units (₦${item.revenue.toLocaleString()})\n`;
        });
    }

    reportContent += `\n\nReport generated by BRAINBOX RETAILPLUS\n`;
    reportContent += `\n\nReport generated by BrainBox-RetailPlus V25\n`;
    reportContent += `© 2025 Powered by TIW\n`;

    // Download the report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BRAINBOX_${selectedReport}_Report_${startDate.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reportData = generateReportData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detailed Reports</h1>
          <p className="mt-2 text-gray-600">Comprehensive business analytics and reporting</p>
        </div>
        <button
          onClick={downloadReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="12hours">Last 12 Hours</option>
              <option value="24hours">Last 24 Hours</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="day_before_yesterday">Day Before Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-blue-900 mt-1">₦{reportData.summary.totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Total Sales</span>
          </div>
          <p className="text-xl font-bold text-green-900 mt-1">{reportData.summary.totalSales}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Items Sold</span>
          </div>
          <p className="text-xl font-bold text-purple-900 mt-1">{reportData.summary.totalItems}</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Avg Sale</span>
          </div>
          <p className="text-xl font-bold text-orange-900 mt-1">₦{reportData.summary.averageSale.toFixed(0)}</p>
        </div>
      </div>

      {/* Report Content Based on Selection */}
      {selectedReport === 'split_payment' ? (
        <SplitPaymentAnalysis />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {selectedReport === 'items_sold' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Items Sold Details
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Brand</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Qty Sold</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Profit</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Barcodes Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.itemsSold.map((item) => (
                      <tr key={item.productId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.productName}</td>
                        <td className="py-3 px-4 text-gray-600">{item.category}</td>
                        <td className="py-3 px-4 text-gray-600">{item.brand}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{item.quantitySold}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">₦{item.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">₦{item.profit.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="flex flex-wrap gap-1">
                            {item.barcodes.map((barcode, index) => (
                              <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                {barcode}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'payment_methods' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Methods Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {reportData.paymentMethods.map((method) => (
                      <div key={method.method} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{method.method}</p>
                          <p className="text-sm text-gray-600">{method.count} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₦{method.total.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{method.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Payment Distribution</h4>
                    <div className="space-y-2">
                      {reportData.paymentMethods.map((method) => (
                        <div key={method.method} className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${method.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 w-12">{method.percentage.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Split Payment Summary */}
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Split className="h-5 w-5 mr-2" />
                  Split Payment Breakdown by Method
                </h3>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Understanding this report:</strong> Shows how each payment method was used in both regular and split transactions.
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Total</strong> = All transactions • <strong>Split</strong> = Used in split payments • <strong>Regular</strong> = Standalone payments
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {reportData.paymentMethodsSplit.map((method) => {
                    const getCashierNames = (cashierIds: string[]) => {
                      return cashierIds.map(id => {
                        const emp = employees.find(e => e.id === id);
                        return emp ? emp.name : 'Unknown';
                      }).join(', ');
                    };

                    return (
                      <div key={method.method} className="border-2 border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold text-gray-900 uppercase flex items-center">
                            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                            {method.method}
                          </h4>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">₦{method.totalAmount.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Total for the day</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Total */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-green-700">Total Amount</p>
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-900">₦{method.totalAmount.toLocaleString()}</p>
                            <p className="text-sm text-green-700 mt-1">{method.totalCount} transactions</p>
                            <div className="mt-2 bg-green-200 rounded-full h-1">
                              <div className="bg-green-600 h-1 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                          </div>

                          {/* Split Amount */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-blue-700">Split Payments</p>
                              <Split className="h-4 w-4 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-blue-900">₦{method.splitAmount.toLocaleString()}</p>
                            <p className="text-sm text-blue-700 mt-1">{method.splitCount} transactions</p>
                            <div className="mt-2 bg-blue-200 rounded-full h-1">
                              <div
                                className="bg-blue-600 h-1 rounded-full"
                                style={{ width: `${method.totalAmount > 0 ? (method.splitAmount / method.totalAmount * 100) : 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              {method.totalAmount > 0 ? ((method.splitAmount / method.totalAmount) * 100).toFixed(1) : 0}% of total
                            </p>
                          </div>

                          {/* Regular Amount */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-700">Regular Payments</p>
                              <CreditCard className="h-4 w-4 text-gray-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">₦{method.nonSplitAmount.toLocaleString()}</p>
                            <p className="text-sm text-gray-700 mt-1">{method.nonSplitCount} transactions</p>
                            <div className="mt-2 bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-gray-600 h-1 rounded-full"
                                style={{ width: `${method.totalAmount > 0 ? (method.nonSplitAmount / method.totalAmount * 100) : 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {method.totalAmount > 0 ? ((method.nonSplitAmount / method.totalAmount) * 100).toFixed(1) : 0}% of total
                            </p>
                          </div>
                        </div>

                        {/* Cashiers Responsible */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <User className="h-4 w-4 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-purple-900">Cashiers/Employees Responsible:</p>
                              <p className="text-sm text-purple-700 mt-1">{getCashierNames(method.cashiers)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Total Summary */}
                <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">Grand Total (All Methods)</h4>
                      <p className="text-sm text-gray-600">Total revenue from all payment methods for the selected period</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">
                        ₦{reportData.paymentMethodsSplit.reduce((sum, m) => sum + m.totalAmount, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {reportData.paymentMethodsSplit.reduce((sum, m) => sum + m.totalCount, 0)} total transactions
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600">Total Split Trans.</p>
                      <p className="text-lg font-bold text-blue-900">
                        {reportData.paymentMethodsSplit.reduce((sum, m) => sum + m.splitCount, 0)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600">Total Regular Trans.</p>
                      <p className="text-lg font-bold text-gray-900">
                        {reportData.paymentMethodsSplit.reduce((sum, m) => sum + m.nonSplitCount, 0)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600">Split Amount</p>
                      <p className="text-lg font-bold text-blue-900">
                        ₦{reportData.paymentMethodsSplit.reduce((sum, m) => sum + m.splitAmount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600">Regular Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₦{reportData.paymentMethodsSplit.reduce((sum, m) => sum + m.nonSplitAmount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'categories' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Categories Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.categorySummary.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Products:</span>
                        <span className="font-medium">{category.totalProducts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items Sold:</span>
                        <span className="font-medium">{category.totalSold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">₦{category.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Price:</span>
                        <span className="font-medium">₦{category.averagePrice.toFixed(0)}</span>
                      </div>
                      {category.lowStockCount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Low Stock:</span>
                          <span className="font-medium">{category.lowStockCount} items</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedReport === 'sales_by_phone' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Sales by Phone Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Sales</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Total Spent</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Items</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tier</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salesByPhone.map((customer) => (
                      <tr key={customer.customerId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{customer.customerName}</td>
                        <td className="py-3 px-4 text-gray-600">{customer.phone}</td>
                        <td className="py-3 px-4 text-gray-600">{customer.email || 'N/A'}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{customer.salesCount}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">₦{customer.totalSpent.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{customer.totalItems}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                            customer.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                            customer.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {customer.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{customer.lastPurchase.toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'staff_performance' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Staff Performance Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Staff Name</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Sales Count</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Total Revenue</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Items Processed</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Avg Sale Value</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Profit Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.staffPerformance.map((staff) => (
                      <tr key={staff.staffId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{staff.staffName}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{staff.salesCount}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">₦{staff.totalRevenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{staff.itemsProcessed}</td>
                        <td className="py-3 px-4 text-right text-gray-900">₦{staff.averageSaleValue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">₦{staff.totalProfit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'comprehensive' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Comprehensive Business Report
              </h3>
              
              {/* Top Selling Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Top Selling Items</h4>
                <div className="space-y-2">
                  {reportData.itemsSold
                    .sort((a, b) => b.quantitySold - a.quantitySold)
                    .slice(0, 5)
                    .map((item, index) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-green-600">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">{item.category} - {item.brand}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{item.quantitySold} units</p>
                        <p className="text-sm text-green-600">₦{item.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Payment Methods Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {reportData.paymentMethods.map((method) => (
                    <div key={method.method} className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="font-medium text-blue-900 capitalize">{method.method}</p>
                      <p className="text-sm text-blue-700">{method.count} transactions</p>
                      <p className="font-bold text-blue-900">₦{method.total.toLocaleString()}</p>
                      <p className="text-xs text-blue-600">{method.percentage.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}