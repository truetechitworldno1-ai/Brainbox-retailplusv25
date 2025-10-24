import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import ExpiryAlertPanel from '../components/ExpiryAlertPanel';
import ReportGenerator from '../components/ReportGenerator';

export default function Dashboard() {
  const { products, customers, sales, analytics, notifications } = useData();
  const { user, hasPermission } = useAuth();
  const { playBestSellerAlert, playWorstSellerAlert } = useAudio();
  const { isOnline } = useOfflineSync();
  const [showReportModal, setShowReportModal] = useState(false);

  const stats = [
    {
      name: 'Total Revenue',
      value: `₦${analytics.totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Total Sales',
      value: analytics.totalSales.toString(),
      change: '+8.2%',
      changeType: 'positive',
      icon: ShoppingCart,
    },
    {
      name: 'Active Customers',
      value: customers.filter(c => c.isActive).length.toString(),
      change: '+15.3%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Products in Stock',
      value: products.filter(p => p.stock > 0).length.toString(),
      change: '-2.1%',
      changeType: 'negative',
      icon: Package,
    },
  ];

  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  
  // Filter alerts based on user role
  const shouldShowStockAlerts = user && [
    'global_admin', 
    'business_owner', 
    'manager', 
    'inventory', 
    'supervisor'
  ].includes(user.role);
  
  // Cashier view - only show sales metrics
  const isCashierView = user?.role === 'cashier';

  return (
    <div className="min-h-full p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Welcome to BRAINBOX RETAILPLUS {!isOnline ? '(Offline Mode)' : ''}
              {user?.role === 'cashier' && ' - Cashier Counter'}
            </p>
            {!isOnline && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-xs text-yellow-800">
                  🔗 <strong>Multi-Device Sync Disabled:</strong> Check your Supabase connection to enable real-time sync across devices
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isCashierView && (
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-blue-600 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 sm:space-x-2 touch-target text-sm sm:text-base"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Generate Report</span>
                <span className="sm:hidden">Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-3 lg:gap-6 mb-6 ${
          isCashierView ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'
        }`}>
          {stats.map((stat) => (
            <div key={stat.name} className="bg-green-50 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-green-800">{stat.name}</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-green-900 mt-1">{stat.value}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
                </div>
              </div>
              {!isCashierView && (
                <div className="mt-4 flex items-center">
                  <span className={`text-xs sm:text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2 hidden md:inline">from last month</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Generator Modal */}
      <ReportGenerator
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* Performance Alerts */}
      {!isCashierView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {shouldShowStockAlerts && <ExpiryAlertPanel />}
        
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Alerts</h3>
              <div className="flex space-x-2">
                <button
                  onClick={playBestSellerAlert}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm hover:bg-green-200 transition-colors touch-target"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Best Seller</span>
                  <span className="sm:hidden">Best</span>
                </button>
                <button
                  onClick={playWorstSellerAlert}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm hover:bg-red-200 transition-colors touch-target"
                >
                  <TrendingDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Low Performer</span>
                  <span className="sm:hidden">Low</span>
                </button>
              </div>
            </div>
          
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Best Seller</p>
                    <p className="text-xs sm:text-sm text-green-700">Premium Coffee Beans</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-bold text-green-900">156 units</p>
                  <p className="text-xs text-green-600">This week</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Low Performer</p>
                    <p className="text-xs sm:text-sm text-red-700">Organic Tea Bags</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-bold text-red-900">3 units</p>
                  <p className="text-xs text-red-600">This week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {shouldShowStockAlerts && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All items are well stocked</p>
            ) : (
              lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="text-sm sm:text-base font-medium text-yellow-900">{item.name}</p>
                    <p className="text-xs sm:text-sm text-yellow-700">Current: {item.stock} | Min: {item.minStock}</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          {isCashierView ? 'Your Recent Sales' : 'Recent Activity'}
        </h3>
        <div className="space-y-4">
          {sales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-900">Sale #{sale.receiptNumber}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{sale.items.length} items</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm sm:text-base font-bold text-gray-900">₦{sale.total.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-gray-500 capitalize">{sale.paymentMethod}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}