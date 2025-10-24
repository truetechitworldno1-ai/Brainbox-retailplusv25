import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Building, 
  DollarSign, 
  Package, 
  Calendar,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  Clock,
  AlertTriangle,
  Edit,
  Eye,
  Minus,
  ShoppingCart
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import AutocompleteInput from '../components/AutocompleteInput';

export default function PurchaseManagement() {
  const { suppliers, purchases, products, addPurchase, updatePurchase, updateProduct } = useData();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [viewingPurchase, setViewingPurchase] = useState<any>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    items: [] as any[],
    notes: '',
    expectedDelivery: ''
  });
  
  const [receiveForm, setReceiveForm] = useState({
    items: [] as any[]
  });
  
  const [returnForm, setReturnForm] = useState({
    reason: '',
    items: [] as any[]
  });

  const tabs = [
    { id: 'orders', label: 'Purchase Orders', icon: FileText },
    { id: 'pending', label: 'Pending Orders', icon: Clock },
    { id: 'received', label: 'Received Items', icon: CheckCircle },
    { id: 'history', label: 'Purchase History', icon: Calendar },
    { id: 'returns', label: 'Return Orders', icon: RotateCcw },
  ];

  const filteredPurchases = purchases.filter(purchase => {
    const supplier = suppliers.find(s => s.id === purchase.supplierId);
    const matchesSearch = supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (activeTab) {
      case 'pending':
        return matchesSearch && purchase.status === 'pending';
      case 'received':
        return matchesSearch && purchase.status === 'received';
      case 'returns':
        return matchesSearch && purchase.status === 'returned';
      case 'history':
        return matchesSearch;
      default:
        return matchesSearch;
    }
  });

  const addItemToPurchase = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = purchaseForm.items.find(item => item.productId === productId);
    
    if (existingItem) {
      setPurchaseForm({
        ...purchaseForm,
        items: purchaseForm.items.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1, totalCost: (item.quantity + 1) * item.unitCost }
            : item
        )
      });
    } else {
      setPurchaseForm({
        ...purchaseForm,
        items: [...purchaseForm.items, {
          productId,
          productName: product.name,
          quantity: 1,
          unitCost: product.costPrice,
          totalCost: product.costPrice,
        }]
      });
    }
  };

  const updatePurchaseItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setPurchaseForm({
        ...purchaseForm,
        items: purchaseForm.items.filter((_, i) => i !== index)
      });
      return;
    }
    
    setPurchaseForm({
      ...purchaseForm,
      items: purchaseForm.items.map((item, i) =>
        i === index
          ? { ...item, quantity, totalCost: quantity * item.unitCost }
          : item
      )
    });
  };

  const updatePurchaseItemCost = (index: number, unitCost: number) => {
    setPurchaseForm({
      ...purchaseForm,
      items: purchaseForm.items.map((item, i) =>
        i === index
          ? { ...item, unitCost, totalCost: item.quantity * unitCost }
          : item
      )
    });
  };

  const createPurchaseOrder = () => {
    if (!purchaseForm.supplierId || purchaseForm.items.length === 0) {
      addNotification({
        title: 'Validation Error',
        message: 'Please select a supplier and add at least one item',
        type: 'error'
      });
      return;
    }

    const supplier = suppliers.find(s => s.id === purchaseForm.supplierId);
    const totalAmount = purchaseForm.items.reduce((sum, item) => sum + item.totalCost, 0);

    addPurchase({
      supplierId: purchaseForm.supplierId,
      supplierName: supplier?.name || 'Unknown Supplier',
      items: purchaseForm.items,
      totalAmount,
      status: 'pending',
      expectedDelivery: purchaseForm.expectedDelivery ? new Date(purchaseForm.expectedDelivery) : undefined,
      notes: purchaseForm.notes
    });

    addNotification({
      title: 'Purchase Order Created',
      message: `Order for ₦${totalAmount.toLocaleString()} created successfully`,
      type: 'success'
    });

    // Reset form
    setPurchaseForm({
      supplierId: '',
      items: [],
      notes: '',
      expectedDelivery: ''
    });
    setShowAddPurchaseModal(false);
  };

  const openReceiveModal = (purchase: any) => {
    setSelectedPurchase(purchase);
    setReceiveForm({
      items: purchase.items.map((item: any) => ({
        ...item,
        receivedQuantity: item.quantity,
        actualCost: item.unitCost
      }))
    });
    setShowReceiveModal(true);
  };

  const receiveItems = () => {
    if (!selectedPurchase) return;

    const totalReceived = receiveForm.items.reduce((sum, item) => sum + (item.receivedQuantity * item.actualCost), 0);

    // Update purchase status
    updatePurchase(selectedPurchase.id, {
      status: 'received',
      receivedDate: new Date(),
      receivedBy: user?.id,
      items: receiveForm.items.map(item => ({
        ...item,
        receivedQuantity: item.receivedQuantity,
        actualCost: item.actualCost
      }))
    });

    // Update product stock levels
    receiveForm.items.forEach(item => {
      if (item.receivedQuantity > 0) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          updateProduct(item.productId, {
            stock: product.stock + item.receivedQuantity,
            costPrice: item.actualCost // Update cost price if different
          });
        }
      }
    });

    addNotification({
      title: 'Items Received',
      message: `Successfully received items worth ₦${totalReceived.toLocaleString()}`,
      type: 'success'
    });

    setShowReceiveModal(false);
    setSelectedPurchase(null);
  };

  const openReturnModal = (purchase: any) => {
    setSelectedPurchase(purchase);
    setReturnForm({
      reason: '',
      items: purchase.items.map((item: any) => ({
        ...item,
        returnQuantity: 0,
        returnReason: ''
      }))
    });
    setShowReturnModal(true);
  };

  const processReturn = () => {
    if (!selectedPurchase || !returnForm.reason.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Please provide a return reason',
        type: 'error'
      });
      return;
    }

    const returnItems = returnForm.items.filter((item: any) => item.returnQuantity > 0);
    if (returnItems.length === 0) {
      addNotification({
        title: 'Validation Error',
        message: 'Please select items to return',
        type: 'error'
      });
      return;
    }

    const totalRefund = returnItems.reduce((sum: number, item: any) => sum + (item.returnQuantity * item.unitCost), 0);

    // Create return order
    addPurchase({
      supplierId: selectedPurchase.supplierId,
      supplierName: selectedPurchase.supplierName,
      items: returnItems.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: -item.returnQuantity,
        unitCost: item.unitCost,
        totalCost: -item.returnQuantity * item.unitCost,
        returnedQuantity: item.returnQuantity
      })),
      totalAmount: -totalRefund,
      status: 'returned',
      notes: `Return: ${returnForm.reason}`,
      returnReason: returnForm.reason,
      originalPurchaseId: selectedPurchase.id
    });

    // Update product stock levels
    returnItems.forEach((item: any) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        updateProduct(item.productId, {
          stock: Math.max(0, product.stock - item.returnQuantity)
        });
      }
    });

    addNotification({
      title: 'Return Processed',
      message: `Return processed for ₦${totalRefund.toLocaleString()}`,
      type: 'success'
    });

    setShowReturnModal(false);
    setSelectedPurchase(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'received': return <CheckCircle className="h-4 w-4" />;
      case 'partial': return <Package className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'returned': return <RotateCcw className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
          <p className="mt-2 text-gray-600">Manage suppliers, orders, and inventory receiving</p>
        </div>
        <button
          onClick={() => setShowAddPurchaseModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Purchase Order</span>
        </button>
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
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Purchase Orders List */}
          <div className="space-y-4">
            {filteredPurchases.map((purchase) => {
              const supplier = suppliers.find(s => s.id === purchase.supplierId);
              
              return (
                <div key={purchase.id} className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Order #{purchase.id.slice(-6)}</h3>
                        <p className="text-sm text-gray-600">Supplier: {supplier?.name}</p>
                        <p className="text-xs text-gray-500">
                          Ordered: {purchase.orderDate.toLocaleDateString()}
                          {purchase.expectedDelivery && ` | Expected: ${purchase.expectedDelivery.toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                        {getStatusIcon(purchase.status)}
                        <span className="ml-1 capitalize">{purchase.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="font-bold text-gray-900">{purchase.items.length}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-bold text-gray-900">₦{purchase.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-bold text-gray-900">{purchase.orderDate.toLocaleDateString()}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <Truck className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-bold text-gray-900 capitalize">{purchase.status}</p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {purchase.items.slice(0, 4).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            <p className="text-sm font-medium text-gray-900">₦{item.totalCost.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {purchase.items.length > 4 && (
                        <div className="text-center text-sm text-gray-500 md:col-span-2">
                          +{purchase.items.length - 4} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {purchase.notes && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">{purchase.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingPurchase(purchase)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View Details</span>
                    </button>
                    
                    {purchase.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openReceiveModal(purchase)}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                        >
                          Receive Items
                        </button>
                        <button
                          onClick={() => updatePurchase(purchase.id, { status: 'cancelled' })}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    
                    {purchase.status === 'received' && (
                      <button
                        onClick={() => openReturnModal(purchase)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        Return Items
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPurchases.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria' : 'Create your first purchase order to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {showAddPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Create Purchase Order</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
                  <select
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({...purchaseForm, supplierId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery</label>
                  <input
                    type="date"
                    value={purchaseForm.expectedDelivery}
                    onChange={(e) => setPurchaseForm({...purchaseForm, expectedDelivery: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
                <div className="space-y-4">
                  <AutocompleteInput
                    placeholder="Search products to add to order..."
                    value={productSearchTerm}
                    onChange={setProductSearchTerm}
                    onSelect={(product) => {
                      addItemToPurchase(product.id);
                      setProductSearchTerm('');
                    }}
                    suggestions={products}
                    displayField="name"
                    searchFields={['name', 'brand', 'category']}
                  />
                  
                  <div className="text-sm text-gray-600 mb-2">Or select from product grid:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addItemToPurchase(product.id)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                    >
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">₦{product.costPrice.toLocaleString()}</p>
                      <p className="text-xs text-blue-600">Stock: {product.stock}</p>
                    </button>
                  ))}
                </div>
                </div>
              </div>

              {/* Purchase Items */}
              {purchaseForm.items.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Purchase Items</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {purchaseForm.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.productName}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-600">Qty:</label>
                            <button
                              onClick={() => updatePurchaseItemQuantity(index, item.quantity - 1)}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updatePurchaseItemQuantity(index, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              min="1"
                            />
                            <button
                              onClick={() => updatePurchaseItemQuantity(index, item.quantity + 1)}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-600">Cost:</label>
                            <input
                              type="number"
                              value={item.unitCost}
                              onChange={(e) => updatePurchaseItemCost(index, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              step="0.01"
                            />
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₦{item.totalCost.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => updatePurchaseItemQuantity(index, 0)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total Order Value:</span>
                        <span className="text-xl font-bold text-blue-600">
                          ₦{purchaseForm.items.reduce((sum, item) => sum + item.totalCost, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({...purchaseForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes about this purchase order..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createPurchaseOrder}
                  disabled={!purchaseForm.supplierId || purchaseForm.items.length === 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Create Purchase Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Items Modal */}
      {showReceiveModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Receive Items - Order #{selectedPurchase.id.slice(-6)}</h3>
              
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Supplier:</strong> {suppliers.find(s => s.id === selectedPurchase.supplierId)?.name}<br/>
                    <strong>Order Date:</strong> {selectedPurchase.orderDate.toLocaleDateString()}<br/>
                    <strong>Expected Total:</strong> ₦{selectedPurchase.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Items to Receive</h4>
                <div className="space-y-3">
                  {receiveForm.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">Ordered: {item.quantity} units</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Received:</label>
                        <input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => {
                            const newItems = [...receiveForm.items];
                            newItems[index].receivedQuantity = parseInt(e.target.value) || 0;
                            setReceiveForm({...receiveForm, items: newItems});
                          }}
                          max={item.quantity}
                          min="0"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Cost:</label>
                        <input
                          type="number"
                          value={item.actualCost}
                          onChange={(e) => {
                            const newItems = [...receiveForm.items];
                            newItems[index].actualCost = parseFloat(e.target.value) || 0;
                            setReceiveForm({...receiveForm, items: newItems});
                          }}
                          step="0.01"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ₦{(item.receivedQuantity * item.actualCost).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800">Total Received Value:</span>
                    <span className="text-xl font-bold text-green-900">
                      ₦{receiveForm.items.reduce((sum, item) => sum + (item.receivedQuantity * item.actualCost), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={receiveItems}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Items Modal */}
      {showReturnModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Return Items - Order #{selectedPurchase.id.slice(-6)}</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Return Reason *</label>
                <textarea
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Reason for returning items..."
                />
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Select Items to Return</h4>
                <div className="space-y-3">
                  {returnForm.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">Available: {item.receivedQuantity || item.quantity} units</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Return:</label>
                        <input
                          type="number"
                          value={item.returnQuantity}
                          onChange={(e) => {
                            const newItems = [...returnForm.items];
                            newItems[index].returnQuantity = Math.min(
                              parseInt(e.target.value) || 0, 
                              item.receivedQuantity || item.quantity
                            );
                            setReturnForm({...returnForm, items: newItems});
                          }}
                          max={item.receivedQuantity || item.quantity}
                          min="0"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processReturn}
                  disabled={!returnForm.reason.trim() || !returnForm.items.some((item: any) => item.returnQuantity > 0)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Process Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Purchase Details Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Purchase Order Details</h3>
                <button
                  onClick={() => setViewingPurchase(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">#{viewingPurchase.id.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingPurchase.status)}`}>
                        {viewingPurchase.status.charAt(0).toUpperCase() + viewingPurchase.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">{viewingPurchase.orderDate.toLocaleDateString()}</span>
                    </div>
                    {viewingPurchase.expectedDelivery && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Delivery:</span>
                        <span className="font-medium">{viewingPurchase.expectedDelivery.toLocaleDateString()}</span>
                      </div>
                    )}
                    {viewingPurchase.receivedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Received Date:</span>
                        <span className="font-medium">{viewingPurchase.receivedDate.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Supplier Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supplier:</span>
                      <span className="font-medium">{viewingPurchase.supplierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-blue-600">₦{viewingPurchase.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">Product</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-gray-900">Qty Ordered</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-gray-900">Qty Received</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-gray-900">Unit Cost</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingPurchase.items.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-sm text-gray-900">{item.productName}</td>
                          <td className="py-2 px-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                          <td className="py-2 px-3 text-sm text-gray-900 text-right">
                            {item.receivedQuantity || '-'}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-900 text-right">₦{item.unitCost.toLocaleString()}</td>
                          <td className="py-2 px-3 text-sm font-medium text-gray-900 text-right">₦{item.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingPurchase.notes && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Notes</h4>
                  <p className="text-sm text-blue-800">{viewingPurchase.notes}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingPurchase(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}