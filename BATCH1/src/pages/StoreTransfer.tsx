import React, { useState } from 'react';
import { Search, Plus, ArrowRight, Package, Building, Clock, CheckCircle, XCircle, AlertTriangle, Minus, Route, Warehouse, MapPin, Users, BarChart3, Truck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { StoreTransfer, TransferItem } from '../types';

export default function StoreTransferPage() {
  const { stores, transfers, products, addTransfer, updateTransfer, warehouses, outlets, stockLevels, allLocations } = useData();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('transfers');
  const [selectedFromStore, setSelectedFromStore] = useState('');
  const [selectedToStore, setSelectedToStore] = useState('');
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [transferType, setTransferType] = useState('warehouse_to_hq');
  const [priority, setPriority] = useState('medium');
  const [transportMethod, setTransportMethod] = useState('van');

  const tabs = [
    { id: 'transfers', label: 'Active Transfers', icon: ArrowRight },
    { id: 'outlets', label: 'Outlets & HQ', icon: Building },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'stock', label: 'Stock Levels', icon: Package }
  ];

  const getStockLevel = (storeId: string, productId: string) => {
    return stockLevels.find(level => level.storeId === storeId && level.productId === productId);
  };

  const filteredTransfers = transfers.filter(transfer => {
    const fromStore = stores.find(s => s.id === transfer.fromStoreId);
    const toStore = stores.find(s => s.id === transfer.toStoreId);
    return (
      fromStore?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toStore?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const addItemToTransfer = (productId: string, barcode: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = transferItems.find(item => item.productId === productId);
    
    if (existingItem) {
      setTransferItems(transferItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setTransferItems([...transferItems, {
        productId,
        productName: product.name,
        quantity: 1,
        barcode,
        unitCost: product.price
      }]);
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setTransferItems(transferItems.filter((_, i) => i !== index));
      return;
    }
    
    setTransferItems(transferItems.map((item, i) =>
      i === index ? { ...item, quantity } : item
    ));
  };

  const createTransfer = () => {
    if (!selectedFromStore || !selectedToStore || transferItems.length === 0) return;

    addTransfer({
      fromStoreId: selectedFromStore,
      toStoreId: selectedToStore,
      items: transferItems,
      status: 'pending',
      requestedBy: user?.id || '1',
      notes,
      priority,
      transportMethod,
      transferDate: new Date()
    });

    // Reset form
    setSelectedFromStore('');
    setSelectedToStore('');
    setTransferItems([]);
    setNotes('');
    setShowCreateModal(false);
  };

  const handleUpdateTransfer = (id: string, updates: Partial<StoreTransfer>) => {
    updateTransfer(id, updates);
    
    // Show success notification
    if (updates.status) {
      const statusMessages = {
        'in_transit': 'Transfer approved and in transit',
        'completed': 'Transfer completed successfully',
        'cancelled': 'Transfer cancelled'
      };
      
      // This would need notification context, but we'll use console for now
      console.log(statusMessages[updates.status as keyof typeof statusMessages] || 'Transfer updated');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_transit': return <ArrowRight className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multi-Outlet Transfer System</h1>
          <p className="mt-2 text-gray-600">Manage transfers between warehouses, headquarters, outlets, and stores</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowRouteModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Route className="h-4 w-4" />
            <span>Manage Routes</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Transfer</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Active Transfers Tab */}
          {activeTab === 'transfers' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transfers by location or transfer ID..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Transfer List */}
              <div className="space-y-4">
                {filteredTransfers.map((transfer) => {
                  const fromLocation = allLocations.find(l => l.id === transfer.fromStoreId);
                  const toLocation = allLocations.find(l => l.id === transfer.toStoreId);
                  
                  return (
                    <div key={transfer.id} className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {fromLocation?.locationType === 'warehouse' ? (
                              <Warehouse className="h-5 w-5 text-purple-600" />
                            ) : fromLocation?.locationType === 'outlet' ? (
                              <Building className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Package className="h-5 w-5 text-green-600" />
                            )}
                            <div>
                              <span className="font-medium text-gray-900">{fromLocation?.name}</span>
                              <p className="text-xs text-gray-500">{fromLocation?.code} - {fromLocation?.locationType}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                          <div className="flex items-center space-x-2">
                            {toLocation?.locationType === 'warehouse' ? (
                              <Warehouse className="h-5 w-5 text-purple-600" />
                            ) : toLocation?.locationType === 'outlet' ? (
                              <Building className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Package className="h-5 w-5 text-green-600" />
                            )}
                            <div>
                              <span className="font-medium text-gray-900">{toLocation?.name}</span>
                              <p className="text-xs text-gray-500">{toLocation?.code} - {toLocation?.locationType}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            transfer.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            transfer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            transfer.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {transfer.priority?.toUpperCase() || 'MEDIUM'}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                            {getStatusIcon(transfer.status)}
                            <span className="ml-1 capitalize">{transfer.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Transfer ID</p>
                          <p className="font-medium text-gray-900">#{transfer.id.slice(-6)}</p>
                          {transfer.trackingNumber && (
                            <p className="text-xs text-blue-600">{transfer.trackingNumber}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Items</p>
                          <p className="font-medium text-gray-900">{transfer.items.length} products</p>
                          <p className="text-xs text-gray-500">
                            Total: {transfer.items.reduce((sum, item) => sum + item.quantity, 0)} units
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Transfer Date</p>
                          <p className="font-medium text-gray-900">{transfer.transferDate.toLocaleDateString()}</p>
                          {transfer.estimatedDeliveryTime && (
                            <p className="text-xs text-blue-600">
                              ETA: {transfer.estimatedDeliveryTime.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Transport</p>
                          <p className="font-medium text-gray-900 capitalize">{transfer.transportMethod || 'Van'}</p>
                          {transfer.driverInfo && (
                            <p className="text-xs text-gray-500">{transfer.driverInfo.name}</p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Transfer Items</h4>
                        <div className="space-y-2">
                          {transfer.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-3">
                                <Package className="h-4 w-4 text-gray-400" />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                                  {item.batchNumber && (
                                    <p className="text-xs text-gray-500">Batch: {item.batchNumber}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                {item.condition !== 'new' && (
                                  <p className="text-xs text-orange-600 capitalize">{item.condition}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {transfer.items.length > 3 && (
                            <p className="text-sm text-gray-500 text-center">
                              +{transfer.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {transfer.notes && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">{transfer.notes}</p>
                        </div>
                      )}

                      <div className="mt-4 flex space-x-2">
                        {transfer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateTransfer(transfer.id, { 
                                status: 'in_transit', 
                                approvedBy: user?.id,
                                dispatchedBy: user?.id 
                              })}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                            >
                              Approve & Dispatch
                            </button>
                            <button
                              onClick={() => handleUpdateTransfer(transfer.id, { status: 'cancelled' })}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {transfer.status === 'in_transit' && (
                          <button
                            onClick={() => handleUpdateTransfer(transfer.id, { 
                              status: 'completed', 
                              completedDate: new Date(),
                              actualDeliveryTime: new Date(),
                              receivedBy: user?.id 
                            })}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                          >
                            Mark as Received
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outlets & HQ Tab */}
          {activeTab === 'outlets' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {outlets.map((outlet) => (
                  <div key={outlet.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-3 rounded-lg ${
                        outlet.type === 'headquarters' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <Building className={`h-6 w-6 ${
                          outlet.type === 'headquarters' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{outlet.name}</h3>
                        <p className="text-sm text-gray-600">{outlet.code} - {outlet.type.toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{outlet.city}, {outlet.state}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{outlet.manager}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Stock: {outlet.currentStock.toLocaleString()}/{outlet.capacity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{((outlet.currentStock / outlet.capacity) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(outlet.currentStock / outlet.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warehouses Tab */}
          {activeTab === 'warehouses' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {warehouses.map((warehouse) => (
                  <div key={warehouse.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Warehouse className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                        <p className="text-sm text-gray-600">{warehouse.code} - {warehouse.type.toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{warehouse.city}, {warehouse.state}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{warehouse.manager}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Stock: {warehouse.currentStock.toLocaleString()}/{warehouse.capacity.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {warehouse.features.loadingDocks} loading docks
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{((warehouse.currentStock / warehouse.capacity) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(warehouse.currentStock / warehouse.capacity) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {warehouse.features.coldStorage && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">❄️ Cold Storage</span>
                        )}
                        {warehouse.features.hazmatStorage && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">⚠️ Hazmat</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          warehouse.features.securityLevel === 'high' ? 'bg-red-100 text-red-800' :
                          warehouse.features.securityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          🔒 {warehouse.features.securityLevel.toUpperCase()} Security
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Levels Tab */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Stock Levels Across All Locations</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Available</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Reserved</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockLevels.slice(0, 20).map((level) => {
                        const product = products.find(p => p.id === level.productId);
                        const stockLevel = selectedFromStore ? getStockLevel(selectedFromStore, product.id) : null;
                        const isLowStock = level.availableQuantity <= level.minStock;
                        
                        return (
                          <tr key={level.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{product?.name}</td>
                            <td className="py-3 px-4 text-gray-600">
                              <div>
                                <span className="font-medium">{location?.name}</span>
                                <p className="text-xs text-gray-500">{location?.code}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900">{level.availableQuantity}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{level.reservedQuantity}</td>
                            <td className="py-3 px-4 text-right font-medium text-gray-900">{level.quantity}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {isLowStock ? 'Low Stock' : 'Good'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
                          const stockLevel = selectedFromStore ? getStockLevel(selectedFromStore, item.productId) : null;

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Create Multi-Location Transfer</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Type</label>
                  <select
                    value={transferType}
                    onChange={(e) => setTransferType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="warehouse_to_hq">Warehouse → Headquarters</option>
                    <option value="warehouse_to_outlet">Warehouse → Outlet</option>
                    <option value="hq_to_outlet">Headquarters → Outlet</option>
                    <option value="outlet_to_hq">Outlet → Headquarters</option>
                    <option value="store_to_store">Store → Store</option>
                    <option value="emergency_transfer">Emergency Transfer</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transport Method</label>
                    <select
                      value={transportMethod}
                      onChange={(e) => setTransportMethod(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="motorcycle">🏍️ Motorcycle (Fast)</option>
                      <option value="van">🚐 Van (Standard)</option>
                      <option value="pickup">🚚 Pickup Truck (Medium)</option>
                      <option value="truck">🚛 Truck (Large)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Store</label>
                  <select
                    value={selectedFromStore}
                    onChange={(e) => setSelectedFromStore(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select source location</option>
                    <optgroup label="Warehouses">
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          🏭 {warehouse.name} ({warehouse.code})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Outlets & HQ">
                      {outlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>
                          {outlet.type === 'headquarters' ? '🏢' : '🏪'} {outlet.name} ({outlet.code})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Stores">
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          🏬 {store.name} ({store.code})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Location</label>
                  <select
                    value={selectedToStore}
                    onChange={(e) => setSelectedToStore(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select destination location</option>
                    <optgroup label="Warehouses">
                      {warehouses.filter(w => w.id !== selectedFromStore).map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          🏭 {warehouse.name} ({warehouse.code})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Outlets & HQ">
                      {outlets.filter(o => o.id !== selectedFromStore).map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>
                          {outlet.type === 'headquarters' ? '🏢' : '🏪'} {outlet.name} ({outlet.code})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Stores">
                      {stores.filter(s => s.id !== selectedFromStore).map((store) => (
                        <option key={store.id} value={store.id}>
                          🏬 {store.name} ({store.code})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {products.slice(0, 12).map((product) => {
                    const stockLevel = getStockLevel(selectedFromStore, product.id);
                    const availableStock = stockLevel?.availableQuantity || 0;
                    
                      return (
                        <button
                          disabled={availableStock === 0}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => addItemToTransfer(product.id, product.barcode || product.barcodes?.[0] || '')}
                        >
                          <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">Available: {availableStock}</p>
                          <p className="text-xs text-blue-600">Cost: ₦{(product.costPrice || 0).toLocaleString()}</p>
                          {availableStock === 0 && (
                            <p className="text-xs text-red-600">Out of Stock</p>
                          )}
                        </button>
                      );
                  })}
                </div>
              </div>

              {transferItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Transfer Items ({transferItems.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {transferItems.map((item, index) => {
                      const stockLevel = getStockLevel(selectedFromStore, item.productId);
                      const maxAvailable = stockLevel?.availableQuantity || 0;
                      
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                              <p className="text-xs text-gray-500">Available: {maxAvailable} units</p>
                              <p className="text-xs text-blue-600">Cost: ₦{(item.quantity * item.unitCost).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                disabled={item.quantity >= maxAvailable}
                                className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center">
                            ₦{transferItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toLocaleString()}
                      <span className="text-lg font-bold text-blue-900">
                        ₦{transferItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes about this transfer..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTransfer}
                  disabled={!selectedFromStore || !selectedToStore || transferItems.length === 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <Truck className="h-4 w-4" />
                  <span>Create Transfer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}