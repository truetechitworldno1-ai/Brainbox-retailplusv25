import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, Package, TrendingUp, TrendingDown, DollarSign, X, BarChart3, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportGenerator({ isOpen, onClose }: ReportGeneratorProps) {
  const { sales, products, customers, suppliers, systemSettings } = useData();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('today');
  const [reportType, setReportType] = useState('comprehensive');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  if (!isOpen) return null;

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

    // Items Sold Analysis with Available Quantity
    const itemsSold = new Map<string, {
      productId: string;
      productName: string;
      category: string;
      brand: string;
      quantitySold: number;
      revenue: number;
      availableStock: number;
      costPrice: number;
      sellingPrice: number;
      profit: number;
      profitMargin: number;
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
        } else {
          itemsSold.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            category: product?.category || 'Unknown',
            brand: product?.brand || 'Unknown',
            quantitySold: item.quantity,
            revenue: item.total,
            availableStock: product?.stock || 0,
            costPrice: product?.costPrice || 0,
            sellingPrice: product?.sellingPrice || 0,
            profit: itemProfit,
            profitMargin: itemProfit / item.total * 100
          });
        }
      });
    });

    const itemsArray = Array.from(itemsSold.values());
    
    // Top and Worst Sellers
    const topSellers = [...itemsArray]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);
    
    const worstSellers = [...itemsArray]
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 10);

    // Staff Performance Analysis
    const staffPerformance = new Map<string, {
      staffId: string;
      staffName: string;
      salesCount: number;
      totalRevenue: number;
      itemsProcessed: number;
      averageSaleValue: number;
      totalProfit: number;
      workingHours: number;
      salesPerHour: number;
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
        existing.salesPerHour = existing.salesCount / existing.workingHours;
      } else {
        const workingHours = 8; // Default 8 hours, would be dynamic in real system
        staffPerformance.set(sale.cashierId, {
          staffId: sale.cashierId,
          staffName: sale.cashierId === '1' ? 'System Administrator' : `Staff ${sale.cashierId}`,
          salesCount: 1,
          totalRevenue: sale.total,
          itemsProcessed: itemCount,
          averageSaleValue: sale.total,
          totalProfit: saleProfit,
          workingHours,
          salesPerHour: 1 / workingHours
        });
      }
    });

    const staffArray = Array.from(staffPerformance.values());

    // Payment Methods Analysis
    const paymentMethods = new Map<string, { count: number; total: number; percentage: number }>();
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
        });
      } else {
        const existing = paymentMethods.get(sale.paymentMethod);
        if (existing) {
          existing.count += 1;
          existing.total += sale.total;
        } else {
          paymentMethods.set(sale.paymentMethod, { count: 1, total: sale.total, percentage: 0 });
        }
      }
    });

    // Calculate percentages
    paymentMethods.forEach((data) => {
      data.percentage = totalSalesRevenue > 0 ? (data.total / totalSalesRevenue) * 100 : 0;
    });

    // Low Stock Analysis
    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    
    // Expiring Products Analysis
    const expiringItems = products.filter(p => {
      if (!p.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((p.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30; // Items expiring in 30 days
    });

    // Customer Analysis
    const customerAnalysis = {
      totalCustomers: customers.length,
      loyaltyCustomers: customers.filter(c => c.loyaltyCard.isActive).length,
      totalLoyaltyPoints: customers.reduce((sum, c) => sum + c.loyaltyCard.points, 0),
      averageLoyaltyPoints: customers.length > 0 ? customers.reduce((sum, c) => sum + c.loyaltyCard.points, 0) / customers.length : 0,
      topCustomers: customers
        .sort((a, b) => b.loyaltyCard.totalSpent - a.loyaltyCard.totalSpent)
        .slice(0, 10)
    };

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
        totalProfit: itemsArray.reduce((sum, item) => sum + item.profit, 0),
        profitMargin: totalSalesRevenue > 0 ? (itemsArray.reduce((sum, item) => sum + item.profit, 0) / totalSalesRevenue) * 100 : 0
      },
      itemsSold: itemsArray,
      topSellers,
      worstSellers,
      staffPerformance: staffArray,
      paymentMethods: Array.from(paymentMethods.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        total: data.total,
        percentage: data.percentage
      })),
      customerAnalysis,
      lowStockItems,
      expiringItems,
      inventoryValue: products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0),
      totalProducts: products.length
    };
  };

  const downloadDetailedReport = () => {
    const reportData = generateReportData();
    const { startDate, endDate } = reportData.dateRange;
    
    let reportContent = `BRAINBOX RETAILPLUS - COMPREHENSIVE SALES REPORT\n`;
    reportContent += `${'='.repeat(60)}\n`;
    reportContent += `Generated by: ${user?.name} (${user?.role})\n`;
    reportContent += `Report Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n`;
    reportContent += `Business: ${systemSettings.businessName}\n`;
    reportContent += `Currency: ${systemSettings.currency}\n\n`;

    // EXECUTIVE SUMMARY
    reportContent += `EXECUTIVE SUMMARY\n`;
    reportContent += `================\n`;
    reportContent += `Total Sales Transactions: ${reportData.summary.totalSales}\n`;
    reportContent += `Total Revenue: ${systemSettings.currency}${reportData.summary.totalRevenue.toLocaleString()}\n`;
    reportContent += `Total Items Sold: ${reportData.summary.totalItems}\n`;
    reportContent += `Average Sale Value: ${systemSettings.currency}${reportData.summary.averageSale.toFixed(2)}\n`;
    reportContent += `Total Profit: ${systemSettings.currency}${reportData.summary.totalProfit.toLocaleString()}\n`;
    reportContent += `Profit Margin: ${reportData.summary.profitMargin.toFixed(2)}%\n`;
    reportContent += `Total Discounts Given: ${systemSettings.currency}${reportData.summary.totalDiscount.toLocaleString()}\n`;
    reportContent += `Total Tax Collected: ${systemSettings.currency}${reportData.summary.totalTax.toLocaleString()}\n\n`;

    // DETAILED ITEMS SOLD ANALYSIS
    reportContent += `DETAILED ITEMS SOLD ANALYSIS\n`;
    reportContent += `===========================\n`;
    reportContent += `Product Name`.padEnd(30) + `Category`.padEnd(15) + `Brand`.padEnd(15) + `Qty Sold`.padEnd(10) + `Revenue`.padEnd(15) + `Available Stock`.padEnd(15) + `Profit`.padEnd(15) + `Margin%\n`;
    reportContent += `${'='.repeat(130)}\n`;
    reportData.itemsSold.forEach(item => {
      reportContent += `${item.productName.padEnd(30)}${item.category.padEnd(15)}${item.brand.padEnd(15)}${item.quantitySold.toString().padEnd(10)}${systemSettings.currency}${item.revenue.toLocaleString().padEnd(14)}${item.availableStock.toString().padEnd(15)}${systemSettings.currency}${item.profit.toLocaleString().padEnd(14)}${item.profitMargin.toFixed(1)}%\n`;
    });
    reportContent += `\n`;

    // TOP SELLING ITEMS
    reportContent += `TOP SELLING ITEMS (BEST PERFORMERS)\n`;
    reportContent += `===================================\n`;
    reportContent += `Rank`.padEnd(6) + `Product Name`.padEnd(30) + `Qty Sold`.padEnd(10) + `Revenue`.padEnd(15) + `Profit`.padEnd(15) + `Available Stock\n`;
    reportContent += `${'='.repeat(80)}\n`;
    reportData.topSellers.forEach((item, index) => {
      reportContent += `#${(index + 1).toString().padEnd(5)}${item.productName.padEnd(30)}${item.quantitySold.toString().padEnd(10)}${systemSettings.currency}${item.revenue.toLocaleString().padEnd(14)}${systemSettings.currency}${item.profit.toLocaleString().padEnd(14)}${item.availableStock}\n`;
    });
    reportContent += `\n`;

    // WORST SELLING ITEMS
    reportContent += `LOW PERFORMING ITEMS (NEED ATTENTION)\n`;
    reportContent += `====================================\n`;
    reportContent += `Rank`.padEnd(6) + `Product Name`.padEnd(30) + `Qty Sold`.padEnd(10) + `Revenue`.padEnd(15) + `Available Stock`.padEnd(15) + `Recommendation\n`;
    reportContent += `${'='.repeat(90)}\n`;
    reportData.worstSellers.forEach((item, index) => {
      const recommendation = item.quantitySold === 0 ? 'Consider promotion' : 
                           item.availableStock > 50 ? 'Reduce stock' : 'Monitor closely';
      reportContent += `#${(index + 1).toString().padEnd(5)}${item.productName.padEnd(30)}${item.quantitySold.toString().padEnd(10)}${systemSettings.currency}${item.revenue.toLocaleString().padEnd(14)}${item.availableStock.toString().padEnd(15)}${recommendation}\n`;
    });
    reportContent += `\n`;

    // STAFF PERFORMANCE ANALYSIS
    reportContent += `STAFF PERFORMANCE ANALYSIS\n`;
    reportContent += `==========================\n`;
    reportContent += `Staff Name`.padEnd(25) + `Sales Count`.padEnd(12) + `Revenue`.padEnd(15) + `Items Processed`.padEnd(16) + `Avg Sale`.padEnd(12) + `Profit Generated\n`;
    reportContent += `${'='.repeat(95)}\n`;
    reportData.staffPerformance.forEach(staff => {
      reportContent += `${staff.staffName.padEnd(25)}${staff.salesCount.toString().padEnd(12)}${systemSettings.currency}${staff.totalRevenue.toLocaleString().padEnd(14)}${staff.itemsProcessed.toString().padEnd(16)}${systemSettings.currency}${staff.averageSaleValue.toLocaleString().padEnd(11)}${systemSettings.currency}${staff.totalProfit.toLocaleString()}\n`;
    });
    reportContent += `\n`;

    // PAYMENT METHODS BREAKDOWN
    reportContent += `PAYMENT METHODS BREAKDOWN\n`;
    reportContent += `========================\n`;
    reportContent += `Method`.padEnd(15) + `Transactions`.padEnd(15) + `Total Amount`.padEnd(18) + `Percentage`.padEnd(12) + `Average Transaction\n`;
    reportContent += `${'='.repeat(75)}\n`;
    reportData.paymentMethods.forEach(method => {
      const avgTransaction = method.count > 0 ? method.total / method.count : 0;
      reportContent += `${method.method.toUpperCase().padEnd(15)}${method.count.toString().padEnd(15)}${systemSettings.currency}${method.total.toLocaleString().padEnd(17)}${method.percentage.toFixed(1)}%`.padEnd(12) + `${systemSettings.currency}${avgTransaction.toLocaleString()}\n`;
    });
    reportContent += `\n`;

    // CUSTOMER ANALYSIS
    reportContent += `CUSTOMER ANALYSIS\n`;
    reportContent += `================\n`;
    reportContent += `Total Registered Customers: ${reportData.customerAnalysis.totalCustomers}\n`;
    reportContent += `Active Loyalty Members: ${reportData.customerAnalysis.loyaltyCustomers}\n`;
    reportContent += `Total Loyalty Points Issued: ${reportData.customerAnalysis.totalLoyaltyPoints.toLocaleString()}\n`;
    reportContent += `Average Loyalty Points per Customer: ${reportData.customerAnalysis.averageLoyaltyPoints.toFixed(0)}\n\n`;

    reportContent += `TOP CUSTOMERS BY SPENDING\n`;
    reportContent += `========================\n`;
    reportContent += `Customer Name`.padEnd(25) + `Total Spent`.padEnd(15) + `Loyalty Points`.padEnd(15) + `Tier`.padEnd(10) + `Last Purchase\n`;
    reportContent += `${'='.repeat(80)}\n`;
    reportData.customerAnalysis.topCustomers.forEach(customer => {
      reportContent += `${customer.name.padEnd(25)}${systemSettings.currency}${customer.loyaltyCard.totalSpent.toLocaleString().padEnd(14)}${customer.loyaltyCard.points.toString().padEnd(15)}${customer.loyaltyCard.tier.padEnd(10)}${customer.lastPurchase.toLocaleDateString()}\n`;
    });
    reportContent += `\n`;

    // INVENTORY ANALYSIS
    reportContent += `INVENTORY ANALYSIS\n`;
    reportContent += `=================\n`;
    reportContent += `Total Products in System: ${reportData.totalProducts}\n`;
    reportContent += `Total Inventory Value: ${systemSettings.currency}${reportData.inventoryValue.toLocaleString()}\n`;
    reportContent += `Low Stock Items: ${reportData.lowStockItems.length}\n`;
    reportContent += `Items Expiring Soon (30 days): ${reportData.expiringItems.length}\n\n`;

    // LOW STOCK ALERTS
    if (reportData.lowStockItems.length > 0) {
      reportContent += `LOW STOCK ALERTS\n`;
      reportContent += `===============\n`;
      reportContent += `Product Name`.padEnd(30) + `Current Stock`.padEnd(15) + `Minimum Stock`.padEnd(15) + `Reorder Urgency\n`;
      reportContent += `${'='.repeat(75)}\n`;
      reportData.lowStockItems.forEach(item => {
        const urgency = item.stock === 0 ? 'CRITICAL' : item.stock <= item.minStock / 2 ? 'HIGH' : 'MEDIUM';
        reportContent += `${item.name.padEnd(30)}${item.stock.toString().padEnd(15)}${item.minStock.toString().padEnd(15)}${urgency}\n`;
      });
      reportContent += `\n`;
    }

    // EXPIRING PRODUCTS
    if (reportData.expiringItems.length > 0) {
      reportContent += `PRODUCTS EXPIRING SOON\n`;
      reportContent += `=====================\n`;
      reportContent += `Product Name`.padEnd(30) + `Expiry Date`.padEnd(15) + `Days Remaining`.padEnd(15) + `Stock`.padEnd(10) + `Action Required\n`;
      reportContent += `${'='.repeat(85)}\n`;
      reportData.expiringItems.forEach(item => {
        const daysRemaining = Math.ceil((item.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const action = daysRemaining <= 0 ? 'REMOVE NOW' : daysRemaining <= 7 ? 'DISCOUNT/PROMOTE' : 'MONITOR';
        reportContent += `${item.name.padEnd(30)}${item.expiryDate!.toLocaleDateString().padEnd(15)}${daysRemaining.toString().padEnd(15)}${item.stock.toString().padEnd(10)}${action}\n`;
      });
      reportContent += `\n`;
    }

    // BUSINESS INSIGHTS
    reportContent += `BUSINESS INSIGHTS & RECOMMENDATIONS\n`;
    reportContent += `==================================\n`;
    
    if (reportData.topSellers.length > 0) {
      reportContent += `• Best Performing Product: ${reportData.topSellers[0].productName} (${reportData.topSellers[0].quantitySold} units sold)\n`;
    }
    
    if (reportData.worstSellers.length > 0) {
      reportContent += `• Needs Attention: ${reportData.worstSellers[0].productName} (${reportData.worstSellers[0].quantitySold} units sold)\n`;
    }
    
    const mostUsedPayment = reportData.paymentMethods.reduce((prev, current) => 
      prev.percentage > current.percentage ? prev : current
    );
    reportContent += `• Most Popular Payment Method: ${mostUsedPayment.method.toUpperCase()} (${mostUsedPayment.percentage.toFixed(1)}%)\n`;
    
    if (reportData.summary.profitMargin < 20) {
      reportContent += `• Warning: Low profit margin (${reportData.summary.profitMargin.toFixed(1)}%). Consider reviewing pricing strategy.\n`;
    }
    
    if (reportData.lowStockItems.length > 0) {
      reportContent += `• Urgent: ${reportData.lowStockItems.length} items need restocking.\n`;
    }
    
    reportContent += `\n`;

    // SYSTEM INFORMATION
    reportContent += `SYSTEM INFORMATION\n`;
    reportContent += `=================\n`;
    reportContent += `System Version: BRAINBOX RETAILPLUS v1.0\n`;
    reportContent += `Subscription Plan: ${systemSettings.subscriptionPlan.toUpperCase()}\n`;
    reportContent += `Tax Settings: ${systemSettings.taxEnabled ? `Enabled (${systemSettings.taxRate}%)` : 'Disabled'}\n`;
    reportContent += `Loyalty Program: ${systemSettings.loyaltyEnabled ? `Enabled (${systemSettings.defaultRewardPercentage}% default)` : 'Disabled'}\n`;
    reportContent += `Discount Settings: ${systemSettings.discountEnabled ? `Enabled (Max ${systemSettings.maxDiscountPercentage}%)` : 'Disabled'}\n`;
    reportContent += `Audio Alerts: ${systemSettings.features.audioAlerts ? 'Enabled' : 'Disabled'}\n`;
    reportContent += `Multi-Store Support: ${systemSettings.features.storeTransfer ? 'Enabled' : 'Disabled'}\n`;
    reportContent += `API Integration: ${systemSettings.features.apiIntegration ? 'Enabled' : 'Disabled'}\n\n`;

    reportContent += `Report generated by BRAINBOX RETAILPLUS\n`;
    reportContent += `© 2025 Powered by TIW - Technology Innovation Worldwide\n`;
    reportContent += `For support: contact@tiw-global.com\n`;

    // Download the report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BRAINBOX_Detailed_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.txt`;
    a.download = `BrainBox-RetailPlus_V25_Detailed_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reportData = generateReportData();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-3" />
              Comprehensive Sales Report
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Report Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <>
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
              </>
            )}
          </div>

          {/* Executive Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Revenue</span>
              </div>
              <p className="text-xl font-bold text-blue-900 mt-1">{systemSettings.currency}{reportData.summary.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-blue-700">Profit: {systemSettings?.currency || '₦'}{reportData.summary.totalProfit.toLocaleString()} ({reportData.summary.profitMargin.toFixed(1)}%)</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Total Sales</span>
              </div>
              <p className="text-xl font-bold text-green-900 mt-1">{reportData.summary.totalSales}</p>
              <p className="text-xs text-green-700">Avg: {systemSettings?.currency || '₦'}{reportData.summary.averageSale.toFixed(0)}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Items Sold</span>
              </div>
              <p className="text-xl font-bold text-purple-900 mt-1">{reportData.summary.totalItems}</p>
              <p className="text-xs text-purple-700">Products: {reportData.itemsSold.length}</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Staff Active</span>
              </div>
              <p className="text-xl font-bold text-orange-900 mt-1">{reportData.staffPerformance.length}</p>
              <p className="text-xs text-orange-700">Cashiers & Staff</p>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="space-y-6">
            {/* Items Sold Analysis Table */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Detailed Items Sold Analysis
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Qty Sold</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Available Stock</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Profit</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Margin %</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.itemsSold.map((item, index) => (
                      <tr key={item.productId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.productName}</td>
                        <td className="py-3 px-4 text-gray-600">{item.category}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{item.quantitySold}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{systemSettings.currency}{item.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{item.availableStock}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">{systemSettings.currency}{item.profit.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{item.profitMargin.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.availableStock <= 10 
                              ? 'bg-red-100 text-red-800' 
                              : item.availableStock <= 50 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.availableStock <= 10 ? 'Low' : item.availableStock <= 50 ? 'Medium' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Sellers Table */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Top Selling Items (Best Performers)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rank</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Brand</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Qty Sold</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Profit</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topSellers.map((item, index) => (
                      <tr key={item.productId} className="border-b border-gray-100 hover:bg-green-50">
                        <td className="py-3 px-4 font-bold text-green-600">#{index + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{item.productName}</td>
                        <td className="py-3 px-4 text-gray-600">{item.brand}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{item.quantitySold}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{systemSettings.currency}{item.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">{systemSettings.currency}{item.profit.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{item.availableStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Worst Sellers Table */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                  Low Performing Items (Need Attention)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rank</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Qty Sold</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Available Stock</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.worstSellers.map((item, index) => {
                      const recommendation = item.quantitySold === 0 ? 'Consider promotion' : 
                                           item.availableStock > 50 ? 'Reduce stock' : 'Monitor closely';
                      return (
                        <tr key={item.productId} className="border-b border-gray-100 hover:bg-red-50">
                          <td className="py-3 px-4 font-bold text-red-600">#{index + 1}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{item.productName}</td>
                          <td className="py-3 px-4 text-gray-600">{item.category}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{item.quantitySold}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">{systemSettings.currency}{item.revenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{item.availableStock}</td>
                          <td className="py-3 px-4 text-left">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              recommendation === 'Consider promotion' ? 'bg-orange-100 text-orange-800' :
                              recommendation === 'Reduce stock' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {recommendation}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff Performance Table */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Staff Performance Analysis
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Staff Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Sales Count</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Total Revenue</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Items Processed</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Avg Sale Value</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Profit Generated</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.staffPerformance.map((staff) => {
                      const performance = staff.salesCount > 10 ? 'Excellent' : 
                                        staff.salesCount > 5 ? 'Good' : 
                                        staff.salesCount > 0 ? 'Average' : 'Needs Improvement';
                      return (
                        <tr key={staff.staffId} className="border-b border-gray-100 hover:bg-blue-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{staff.staffName}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {staff.staffId === '1' ? 'Administrator' : 'Cashier'}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900">{staff.salesCount}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">{systemSettings.currency}{staff.totalRevenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{staff.itemsProcessed}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{systemSettings.currency}{staff.averageSaleValue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">{systemSettings.currency}{staff.totalProfit.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              performance === 'Excellent' ? 'bg-green-100 text-green-800' :
                              performance === 'Good' ? 'bg-blue-100 text-blue-800' :
                              performance === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {performance}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Methods Table */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                  Payment Methods Breakdown
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Method</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Transactions</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Total Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Percentage</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Avg Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.paymentMethods.map((method) => {
                      const avgTransaction = method.count > 0 ? method.total / method.count : 0;
                      return (
                        <tr key={method.method} className="border-b border-gray-100 hover:bg-purple-50">
                          <td className="py-3 px-4 font-medium text-gray-900 capitalize">{method.method}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{method.count}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">{systemSettings.currency}{method.total.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{method.percentage.toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right text-gray-900">{systemSettings.currency}{avgTransaction.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Analysis Table */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Top Customers Analysis
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rank</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Customer Name</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Total Spent</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Loyalty Points</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tier</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customerAnalysis.topCustomers.map((customer, index) => (
                      <tr key={customer.id} className="border-b border-gray-100 hover:bg-indigo-50">
                        <td className="py-3 px-4 font-bold text-indigo-600">#{index + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{customer.name}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{systemSettings.currency}{customer.loyaltyCard.totalSpent.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{customer.loyaltyCard.points}</td>
                        <td className="py-3 px-4 text-left">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.loyaltyCard.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                            customer.loyaltyCard.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                            customer.loyaltyCard.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {customer.loyaltyCard.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left text-gray-600">{customer.lastPurchase.toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Alerts */}
            {(reportData.lowStockItems.length > 0 || reportData.expiringItems.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Items */}
                {reportData.lowStockItems.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                        Low Stock Alerts
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {reportData.lowStockItems.slice(0, 10).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div>
                              <p className="font-medium text-yellow-900">{item.name}</p>
                              <p className="text-sm text-yellow-700">Current: {item.stock} | Min: {item.minStock}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.stock === 0 ? 'bg-red-100 text-red-800' :
                              item.stock <= item.minStock / 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.stock === 0 ? 'OUT OF STOCK' : 
                               item.stock <= item.minStock / 2 ? 'CRITICAL' : 'LOW'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expiring Items */}
                {reportData.expiringItems.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-red-600" />
                        Products Expiring Soon
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {reportData.expiringItems.slice(0, 10).map((item) => {
                          const daysRemaining = Math.ceil((item.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div>
                                <p className="font-medium text-red-900">{item.name}</p>
                                <p className="text-sm text-red-700">
                                  {daysRemaining <= 0 ? 'EXPIRED' : `${daysRemaining} days remaining`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-red-600">{item.expiryDate!.toLocaleDateString()}</p>
                                <p className="text-xs text-red-500">Stock: {item.stock}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={downloadDetailedReport}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Detailed Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}