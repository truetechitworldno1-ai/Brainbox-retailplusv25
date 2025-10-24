import React, { useState, useEffect } from 'react';
import { Gift, Star, CheckCircle, Clock, AlertTriangle, User, DollarSign, FileText } from 'lucide-react';
import { RewardRedemptionService } from '../services/RewardRedemptionService';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { RewardRedemption } from '../types';

export default function RewardRedemptionPanel() {
  const { customers, updateCustomer } = useData();
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotification();
  
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [redemptionSlip, setRedemptionSlip] = useState('');
  const [cashAmount, setCashAmount] = useState(0);
  const [otherPayment, setOtherPayment] = useState(0);
  const [pendingRedemptions, setPendingRedemptions] = useState<RewardRedemption[]>([]);

  useEffect(() => {
    loadPendingRedemptions();
  }, []);

  const loadPendingRedemptions = () => {
    const pending = RewardRedemptionService.getRedemptionsByStatus('pending');
    const verified = RewardRedemptionService.getRedemptionsByStatus('verified');
    setPendingRedemptions([...pending, ...verified]);
  };

  const initiateRedemption = async () => {
    if (!selectedCustomer || !user) return;

    try {
      const redemption = await RewardRedemptionService.initiateRedemption(
        selectedCustomer,
        pointsToRedeem,
        user.id
      );

      addNotification({
        title: 'Redemption Initiated',
        message: `Redemption slip ${redemption.redemptionSlip} created for ${selectedCustomer.name}`,
        type: 'success'
      });

      loadPendingRedemptions();
      setShowRedemptionModal(false);
      setSelectedCustomer(null);
      setPointsToRedeem(0);
    } catch (error: any) {
      addNotification({
        title: 'Redemption Failed',
        message: error.message,
        type: 'error'
      });
    }
  };

  const verifyRedemption = async (redemptionId: string) => {
    if (!user) return;

    try {
      await RewardRedemptionService.verifyRedemption(redemptionId, user.id, user.role);
      
      addNotification({
        title: 'Redemption Verified',
        message: 'Redemption has been verified and is ready for cashier processing',
        type: 'success'
      });

      loadPendingRedemptions();
    } catch (error: any) {
      addNotification({
        title: 'Verification Failed',
        message: error.message,
        type: 'error'
      });
    }
  };

  const processRedemption = async () => {
    if (!user) return;

    try {
      const redemption = await RewardRedemptionService.processRedemption(
        redemptionSlip,
        cashAmount,
        otherPayment,
        user.id,
        user.role
      );

      // Deduct points from customer
      const customer = customers.find(c => c.id === redemption.customerId);
      if (customer) {
        updateCustomer(customer.id, {
          loyaltyCard: {
            ...customer.loyaltyCard,
            points: customer.loyaltyCard.points - redemption.pointsToRedeem
          }
        });
      }

      await RewardRedemptionService.completeRedemption(redemption.id);

      addNotification({
        title: 'Redemption Completed',
        message: `₦${redemption.redemptionValue.toLocaleString()} redemption processed successfully`,
        type: 'success'
      });

      loadPendingRedemptions();
      setRedemptionSlip('');
      setCashAmount(0);
      setOtherPayment(0);
    } catch (error: any) {
      addNotification({
        title: 'Processing Failed',
        message: error.message,
        type: 'error'
      });
    }
  };

  const canVerify = RewardRedemptionService.canVerifyRedemptions(user?.role || '');
  const canApprove = RewardRedemptionService.canApproveRedemptions(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Reward Redemption Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gift className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Reward Redemption Center</h3>
              <p className="text-gray-600">Manage customer loyalty point redemptions</p>
            </div>
          </div>
          <button
            onClick={() => setShowRedemptionModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Gift className="h-4 w-4" />
            <span>New Redemption</span>
          </button>
        </div>
      </div>

      {/* Pending Redemptions */}
      {pendingRedemptions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Pending Redemptions</h4>
          <div className="space-y-4">
            {pendingRedemptions.map((redemption) => (
              <div key={redemption.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{redemption.customerName}</p>
                    <p className="text-sm text-gray-600">
                      Slip: {redemption.redemptionSlip} | Points: {redemption.pointsToRedeem} | Value: ₦{redemption.redemptionValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested: {redemption.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      redemption.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      redemption.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {redemption.status.toUpperCase()}
                    </span>
                    {redemption.status === 'pending' && canVerify && (
                      <button
                        onClick={() => verifyRedemption(redemption.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cashier Redemption Processing */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Process Redemption (Cashier)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Redemption Slip</label>
            <input
              type="text"
              value={redemptionSlip}
              onChange={(e) => setRedemptionSlip(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="RDM123456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cash Amount (₦)</label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Payment (₦)</label>
            <input
              type="number"
              value={otherPayment}
              onChange={(e) => setOtherPayment(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              step="0.01"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={processRedemption}
            disabled={!redemptionSlip.trim() || (cashAmount + otherPayment) <= 0}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Process Redemption
          </button>
        </div>
      </div>

      {/* New Redemption Modal */}
      {showRedemptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">New Reward Redemption</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value);
                      setSelectedCustomer(customer);
                      setPointsToRedeem(0);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select customer</option>
                    {customers
                      .filter(c => c.loyaltyCard.points > 0)
                      .map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.loyaltyCard.points} points)
                        </option>
                      ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Star className="h-6 w-6 text-purple-600" />
                        <div>
                          <p className="font-medium text-purple-900">{selectedCustomer.name}</p>
                          <p className="text-sm text-purple-700">
                            Available Points: {selectedCustomer.loyaltyCard.points}
                          </p>
                          <p className="text-sm text-purple-700">
                            Max Value: ₦{(selectedCustomer.loyaltyCard.points * 10).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points to Redeem</label>
                      <input
                        type="number"
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(Math.min(parseInt(e.target.value) || 0, selectedCustomer.loyaltyCard.points))}
                        max={selectedCustomer.loyaltyCard.points}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Redemption Value: ₦{(pointsToRedeem * 10).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowRedemptionModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={initiateRedemption}
                  disabled={!selectedCustomer || pointsToRedeem <= 0}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  Create Redemption
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}