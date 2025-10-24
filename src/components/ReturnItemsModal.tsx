import React, { useState } from 'react';
import { RotateCcw, Search, Minus, Plus, X, DollarSign } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ReturnItem } from '../types';

interface ReturnItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnComplete: (returnData: any) => void;
}

export default function ReturnItemsModal({ isOpen, onClose, onReturnComplete }: ReturnItemsModalProps) {
  const { sales, products, addReturn } = useData();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'store_credit'>('cash');
  const [managerApproval, setManagerApproval] = useState('');

  if (!isOpen) return null;

  const recentSales = sales
    .filter(sale => 
      sale.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);

  const selectSale = (sale: any) => {
    setSelectedSale(sale);
    setReturnItems(sale.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: 0,
      unitPrice: item.unitPrice,
      totalRefund: 0,
      reason: ''
    })));
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    const maxQuantity = selectedSale.items[index].quantity;
    const validQuantity = Math.max(0, Math.min(quantity, maxQuantity));
    
    const updatedItems = [...returnItems];
    updatedItems[index].quantity = validQuantity;
    updatedItems[index].totalRefund = validQuantity * updatedItems[index].unitPrice;
    setReturnItems(updatedItems);
  };

  const getTotalRefund = () => {
    return returnItems.reduce((sum, item) => sum + item.totalRefund, 0);
  };

  const processReturn = () => {
    if (!selectedSale || !returnReason.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Please select items and provide a return reason',
        type: 'error'
      });
      return;
    }

    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      addNotification({
        title: 'No Items Selected',
        message: 'Please select at least one item to return',
        type: 'error'
      });
      return;
    }

    const returnTransaction = addReturn({
      originalSaleId: selectedSale.id,
      originalReceiptNumber: selectedSale.receiptNumber,
      customerId: selectedSale.customerId,
      items: itemsToReturn,
      totalRefund: getTotalRefund(),
      reason: returnReason,
      cashierId: user?.id || '1',
      refundMethod,
      managerApproval: managerApproval || undefined
    });

    // Update product stock
    itemsToReturn.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        // Return items to stock
        // updateProduct(item.productId, { stock: product.stock + item.quantity });
      }
    });

    onReturnComplete(returnTransaction);
    
    addNotification({
      title: 'Return Processed',
      message: `Return of ₦${getTotalRefund().toLocaleString()} processed successfully`,
      type: 'success'
    });

    // Reset form
    setSelectedSale(null);
    setReturnItems([]);
    setReturnReason('');
    setRefundMethod('cash');
    setManagerApproval('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <RotateCcw className="h-6 w-6 mr-2" />
              Process Return
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!selectedSale ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for Sale to Return
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter receipt number or search..."
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => selectSale(sale)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Receipt #{sale.receiptNumber}</p>
                        <p className="text-sm text-gray-600">
                          {sale.timestamp.toLocaleDateString()} at {sale.timestamp.toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-500">{sale.items.length} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₦{sale.total.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 capitalize">{sale.paymentMethod}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Original Sale Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Receipt:</span>
                    <span className="ml-2 font-medium">#{selectedSale.receiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Date:</span>
                    <span className="ml-2 font-medium">{selectedSale.timestamp.toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Total:</span>
                    <span className="ml-2 font-medium">₦{selectedSale.total.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Payment:</span>
                    <span className="ml-2 font-medium capitalize">{selectedSale.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Select Items to Return</h4>
                <div className="space-y-3">
                  {returnItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            Original: {selectedSale.items[index].quantity} × ₦{item.unitPrice.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₦{item.totalRefund.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateReturnQuantity(index, item.quantity - 1)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateReturnQuantity(index, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            min="0"
                            max={selectedSale.items[index].quantity}
                          />
                          <button
                            onClick={() => updateReturnQuantity(index, item.quantity + 1)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => {
                            const updated = [...returnItems];
                            updated[index].reason = e.target.value;
                            setReturnItems(updated);
                          }}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Reason for return..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return Reason</label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Overall reason for return..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash Refund</option>
                    <option value="card">Card Refund</option>
                    <option value="store_credit">Store Credit</option>
                  </select>
                  
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manager Approval</label>
                    <input
                      type="text"
                      value={managerApproval}
                      onChange={(e) => setManagerApproval(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Manager name/ID"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-green-800">Total Refund Amount:</span>
                  <span className="text-2xl font-bold text-green-900">₦{getTotalRefund().toLocaleString()}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Search
                </button>
                <button
                  onClick={processReturn}
                  disabled={getTotalRefund() === 0 || !returnReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Process Return - ₦{getTotalRefund().toLocaleString()}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}