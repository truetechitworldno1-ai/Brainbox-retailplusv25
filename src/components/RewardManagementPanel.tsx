import React, { useState, useEffect } from 'react';
import { Gift, Star, CheckCircle, Clock, AlertTriangle, User, DollarSign, FileText, Plus, Minus, Package } from 'lucide-react';
import { RewardRedemptionService } from '../services/RewardRedemptionService';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { RewardRequest, RewardRedemption, RewardItem } from '../types';

export default function RewardManagementPanel() {
  const { customers, products, updateProduct } = useData();
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotification();
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<RewardRequest | null>(null);
  const [redemptionSlip, setRedemptionSlip] = useState('');
  
  const [requestForm, setRequestForm] = useState({
    rewardType: 'cash_discount' as 'cash_discount' | 'free_items' | 'percentage_off',
    rewardAmount: 0,
    percentageOff: 0,
    reason: '',
    freeItems: [] as RewardItem[]
  });
  
  const [approvalForm, setApprovalForm] = useState({
    finalRewardAmount: 0,
    finalFreeItems: [] as RewardItem[],
    approvalNotes: ''
  });

  const [pendingRequests, setPendingRequests] = useState<RewardRequest[]>([]);
  const [approvedRewards, setApprovedRewards] = useState<RewardRedemption[]>([]);

  useEffect(() => {
    loadRewardData();
  }, []);

  const loadRewardData = () => {
    const pending = RewardRedemptionService.getPendingRewardRequests();
    const approved = RewardRedemptionService.getApprovedRewards();
    setPendingRequests(pending);
    setApprovedRewards(approved);
  };

  const requestReward = async () => {
    if (!selectedCustomer || !user) return;

    try {
      await RewardRedemptionService.requestReward(
        selectedCustomer,
        user.id,
        requestForm.rewardType,
        requestForm.rewardAmount,
        requestForm.freeItems,
        requestForm.percentageOff,
        requestForm.reason
      );

      addNotification({
        title: 'Reward Requested',
        message: `Reward request submitted for ${selectedCustomer.name}`,
        type: 'success'
      });

      loadRewardData();
      setShowRequestModal(false);
      resetRequestForm();
    } catch (error: any) {
      addNotification({
        title: 'Request Failed',
        message: error.message,
        type: 'error'
      });
    }
  };

  const approveReward = async () => {
    if (!selectedRequest || !user) return;

    try {
      await RewardRedemptionService.approveReward(
        selectedRequest.id,
        user.id,
        user.role,
        approvalForm.finalRewardAmount,
        approvalForm.finalFreeItems,
        approvalForm.approvalNotes
      );

      addNotification({
        title: 'Reward Approved',
        message: `Reward approved for ${selectedRequest.customerName}`,
        type: 'success'
      });

      loadRewardData();
      setShowApprovalModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      addNotification({
        title: 'Approval Failed',
        message: error.message,
        type: 'error'
      });
    }
  };

  const applyRewardAtCashier = async () => {
    if (!redemptionSlip.trim()) return;

    try {
      const reward = RewardRedemptionService.getRewardBySlip(redemptionSlip);
      if (!reward) {
        addNotification({
          title: 'Invalid Slip',
          message: 'Redemption slip not found',
          type: 'error'
        });
        return;
      }

      // Apply reward logic would be integrated into POS
      addNotification({
        title: 'Reward Applied',
        message: `Reward of ₦${reward.rewardAmount.toLocaleString()} applied to sale`,
        type: 'success'
      });

      setRedemptionSlip('');
      setShowApplyModal(false);
      loadRewardData();
    } catch (error: any) {
      addNotification({
        title: 'Application Failed',
        message: error.message,
        type: 'error'
      });
    }
  };

  const addFreeItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = requestForm.freeItems.find(item => item.productId === productId);
    
    if (existingItem) {
      setRequestForm({
        ...requestForm,
        freeItems: requestForm.freeItems.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1, totalValue: (item.quantity + 1) * item.unitPrice }
            : item
        )
      });
    } else {
      setRequestForm({
        ...requestForm,
        freeItems: [...requestForm.freeItems, {
          productId,
          productName: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          totalValue: product.sellingPrice
        }]
      });
    }
  };

  const updateFreeItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setRequestForm({
        ...requestForm,
        freeItems: requestForm.freeItems.filter((_, i) => i !== index)
      });
      return;
    }
    
    setRequestForm({
      ...requestForm,
      freeItems: requestForm.freeItems.map((item, i) =>
        i === index
          ? { ...item, quantity, totalValue: quantity * item.unitPrice }
          : item
      )
    });
  };

  const resetRequestForm = () => {
    setRequestForm({
      rewardType: 'cash_discount',
      rewardAmount: 0,
      percentageOff: 0,
      reason: '',
      freeItems: []
    });
    setSelectedCustomer(null);
  };

  const canApprove = RewardRedemptionService.canApproveRewards(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Reward Management Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gift className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Reward Management System</h3>
              <p className="text-gray-600">Request → Manager Approval → Cashier Application</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Gift className="h-4 w-4" />
              <span>Request Reward</span>
            </button>
            <button
              onClick={() => setShowApplyModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Apply Reward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Requests (Manager/Inventory Officer View) */}
      {canApprove && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-yellow-600" />
            Pending Reward Requests ({pendingRequests.length})
          </h4>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{request.customerName}</p>
                    <p className="text-sm text-gray-600">
                      Type: {request.rewardType.replace('_', ' ').toUpperCase()}
                      {request.rewardAmount && ` | Amount: ₦${request.rewardAmount.toLocaleString()}`}
                      {request.percentageOff && ` | Discount: ${request.percentageOff}%`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Requested by: {request.requestedBy} | {request.createdAt.toLocaleString()}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-blue-600 mt-1">Reason: {request.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setApprovalForm({
                        finalRewardAmount: request.rewardAmount || 0,
                        finalFreeItems: request.freeItems || [],
                        approvalNotes: ''
                      });
                      setShowApprovalModal(true);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Review & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Rewards (Cashier View) */}
      {approvedRewards.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Approved Rewards Ready for Application ({approvedRewards.length})
          </h4>
          <div className="space-y-4">
            {approvedRewards.map((reward) => (
              <div key={reward.id} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{reward.customerName}</p>
                    <p className="text-sm text-gray-600">
                      Slip: {reward.redemptionSlip} | Value: ₦{reward.rewardAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Approved by: {reward.approvedBy} | Type: {reward.rewardType.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">₦{reward.rewardAmount.toLocaleString()}</p>
                    <p className="text-xs text-green-700">Ready to apply at POS</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Reward Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Request Customer Reward</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value);
                      setSelectedCustomer(customer);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.loyaltyCard.points} points)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reward Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setRequestForm({...requestForm, rewardType: 'cash_discount'})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        requestForm.rewardType === 'cash_discount'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">Cash Discount</p>
                    </button>
                    <button
                      onClick={() => setRequestForm({...requestForm, rewardType: 'free_items'})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        requestForm.rewardType === 'free_items'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Package className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">Free Items</p>
                    </button>
                    <button
                      onClick={() => setRequestForm({...requestForm, rewardType: 'percentage_off'})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        requestForm.rewardType === 'percentage_off'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Star className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">Percentage Off</p>
                    </button>
                  </div>
                </div>

                {requestForm.rewardType === 'cash_discount' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount (₦)</label>
                    <input
                      type="number"
                      value={requestForm.rewardAmount}
                      onChange={(e) => setRequestForm({...requestForm, rewardAmount: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter discount amount"
                    />
                  </div>
                )}

                {requestForm.rewardType === 'percentage_off' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Percentage Off (%)</label>
                    <input
                      type="number"
                      value={requestForm.percentageOff}
                      onChange={(e) => setRequestForm({...requestForm, percentageOff: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter percentage"
                      max="100"
                    />
                  </div>
                )}

                {requestForm.rewardType === 'free_items' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Free Items</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {products.slice(0, 12).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addFreeItem(product.id)}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all text-left"
                        >
                          <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">₦{product.sellingPrice.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>

                    {requestForm.freeItems.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h5 className="font-medium text-gray-900">Selected Free Items:</h5>
                        {requestForm.freeItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              <p className="text-sm text-gray-600">₦{item.unitPrice.toLocaleString()} each</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateFreeItemQuantity(index, item.quantity - 1)}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateFreeItemQuantity(index, item.quantity + 1)}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="font-bold text-purple-600">₦{item.totalValue.toLocaleString()}</p>
                          </div>
                        ))}
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <p className="font-bold text-purple-900">
                            Total Free Items Value: ₦{requestForm.freeItems.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Reward</label>
                  <textarea
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Explain why this customer deserves a reward..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    resetRequestForm();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={requestReward}
                  disabled={!selectedCustomer || 
                    (requestForm.rewardType === 'cash_discount' && requestForm.rewardAmount <= 0) ||
                    (requestForm.rewardType === 'percentage_off' && requestForm.percentageOff <= 0) ||
                    (requestForm.rewardType === 'free_items' && requestForm.freeItems.length === 0)
                  }
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal (Manager/Inventory Officer) */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Approve Reward Request</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Request Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">{selectedRequest.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requested by:</span>
                    <span className="font-medium">{selectedRequest.requestedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{selectedRequest.rewardType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reason:</span>
                    <span className="font-medium">{selectedRequest.reason}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final Reward Amount (₦) - You can adjust this
                  </label>
                  <input
                    type="number"
                    value={approvalForm.finalRewardAmount}
                    onChange={(e) => setApprovalForm({...approvalForm, finalRewardAmount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Set final reward amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Approval Notes</label>
                  <textarea
                    value={approvalForm.approvalNotes}
                    onChange={(e) => setApprovalForm({...approvalForm, approvalNotes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes about this approval..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={approveReward}
                  disabled={approvalForm.finalRewardAmount <= 0}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Approve Reward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Reward Modal (Cashier) */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Apply Reward at Cashier</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Redemption Slip Number</label>
                  <input
                    type="text"
                    value={redemptionSlip}
                    onChange={(e) => setRedemptionSlip(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="RWD123456789"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Instructions:</h4>
                  <ol className="text-sm text-green-800 space-y-1">
                    <li>1. Enter redemption slip number</li>
                    <li>2. Apply reward BEFORE scanning items</li>
                    <li>3. Scan customer's items normally</li>
                    <li>4. System will split free vs paid items</li>
                    <li>5. Complete sale as usual</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyRewardAtCashier}
                  disabled={!redemptionSlip.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Apply Reward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}