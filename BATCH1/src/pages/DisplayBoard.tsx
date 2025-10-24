import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Wifi,
  WifiOff,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Building,
  Volume2,
  Star,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Brain
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAudio } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext';

export default function DisplayBoard() {
  const { products, customers, sales, stores, transfers, analytics, isOnline } = useData();
  const { isAudioEnabled } = useAudio();
  const { user, hasPermission } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todaySales = sales.filter(sale => 
    sale.timestamp.toDateString() === new Date().toDateString()
  );

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const expiringItems = products.filter(p => 
    p.expiryDate && 
    p.expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const activeStores = stores.filter(s => s.isActive);
  const pendingTransfers = transfers.filter(t => t.status === 'pending');

  const systemStatus = {
    online: isOnline,
    audio: isAudioEnabled,
    stores: activeStores.length,
    users: 1, // Would be dynamic in real system
    lastSync: new Date()
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      {/* Header */}

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* Only show network status when offline */}
        {!systemStatus.online && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <WifiOff className="h-6 w-6 text-red-400" />
              <div>
                <p className="text-white font-medium">Network</p>
                <p className="text-sm text-red-400">Offline Mode</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <Volume2 className={`h-6 w-6 ${systemStatus.audio ? 'text-green-400' : 'text-gray-400'}`} />
            <div>
              <p className="text-white font-medium">Audio</p>
              <p className={`text-sm ${systemStatus.audio ? 'text-green-400' : 'text-gray-400'}`}>
                {systemStatus.audio ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <Building className="h-6 w-6 text-blue-400" />
            <div>
              <p className="text-white font-medium">Stores</p>
              <p className="text-sm text-blue-400">{systemStatus.stores} Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-purple-400" />
            <div>
              <p className="text-white font-medium">Users</p>
              <p className="text-sm text-purple-400">{systemStatus.users} Online</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-yellow-400" />
            <div>
              <p className="text-white font-medium">Last Sync</p>
              <p className="text-sm text-yellow-400">
                {systemStatus.lastSync.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Today's Performance */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2" />
            Today's Performance
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">Revenue</p>
                  <p className="text-2xl font-bold text-white">₦{todayRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-blue-400 font-medium">Sales</p>
                  <p className="text-2xl font-bold text-white">{todaySales.length}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-purple-400 font-medium">Customers</p>
                  <p className="text-2xl font-bold text-white">{customers.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Package className="h-6 w-6 mr-2" />
            Inventory Status
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Total Products</span>
                <span className="text-2xl font-bold text-white">{products.length}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-400 font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Low Stock
                </span>
                <span className="text-2xl font-bold text-yellow-400">{lowStockItems.length}</span>
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-400 font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Expiring Soon
                </span>
                <span className="text-2xl font-bold text-red-400">{expiringItems.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Features */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Star className="h-6 w-6 mr-2" />
            System Features
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-white text-sm">Multi-Barcode Support</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-white text-sm">Store Transfers</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-white text-sm">Audio Alerts</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-white text-sm">Loyalty Program</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-white text-sm">Offline Mode</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-white text-sm">QuickBooks Export</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-white text-sm">API Integration</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Critical Alerts */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-red-400" />
            Critical Alerts
          </h3>
          
          <div className="space-y-3">
            {lowStockItems.slice(0, 3).map((item, index) => (
              <div key={index} className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-red-400 text-sm">Stock: {item.stock}</span>
                </div>
              </div>
            ))}
            
            {expiringItems.slice(0, 2).map((item, index) => (
              <div key={index} className="p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-yellow-400 text-sm">
                    Expires: {item.expiryDate?.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Operations */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Building className="h-6 w-6 mr-2" />
            Store Operations
          </h3>
          
          <div className="space-y-3">
            {activeStores.map((store) => (
              <div key={store.id} className="p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{store.name}</p>
                    <p className="text-blue-200 text-sm">{store.manager}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                </div>
              </div>
            ))}
            
            {pendingTransfers.length > 0 && (
              <div className="p-3 bg-orange-500/20 border border-orange-400/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Pending Transfers</span>
                  <span className="text-orange-400 font-bold">{pendingTransfers.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{analytics.totalSales}</p>
            <p className="text-blue-200 text-sm">Total Sales</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">₦{analytics.totalRevenue.toLocaleString()}</p>
            <p className="text-blue-200 text-sm">Total Revenue</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{customers.filter(c => c.isActive).length}</p>
            <p className="text-blue-200 text-sm">Active Customers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{products.filter(p => p.stock > 0).length}</p>
            <p className="text-blue-200 text-sm">In Stock</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stores.length}</p>
            <p className="text-blue-200 text-sm">Store Locations</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {Math.round(customers.reduce((sum, c) => sum + c.loyaltyCard.points, 0) / customers.length) || 0}
            </p>
            <p className="text-blue-200 text-sm">Avg Loyalty Points</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-blue-200 text-sm">
          © 2025 BrainBox-RetailPlus V25 - Licensed Software | Truetech IT World
        </p>
        <p className="text-blue-300 text-xs mt-1">
          Licensed to: {user?.name} ({user?.role}) | Version 2.5.0 | All Rights Reserved
        </p>
      </div>
    </div>
  );
}