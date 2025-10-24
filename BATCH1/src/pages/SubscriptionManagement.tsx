import React, { useState } from 'react';
import { Crown, CreditCard, Calendar, Users, Monitor, Smartphone, Check, Star, AlertTriangle, MessageSquare, Send, RefreshCw, Edit, Save } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { SubscriptionService } from '../services/SubscriptionService';
import SupabaseConnectionTest from '../components/SupabaseConnectionTest';

export default function SubscriptionManagement() {
  const { 
    subscriptionPlans, 
    currentSubscription, 
    isSubscriptionValid, 
    daysRemaining,
    startTrial,
    upgradeSubscription,
    downgradeSubscription,
    extendTrial,
    paymentHistory,
    submitComplaint,
    userComplaints,
    updatePlanPricing,
    isLoading,
    refreshData
  } = useSubscription();
  const { user, hasPermission } = useAuth();
  const { systemSettings } = useData();
  
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [showTrialExtender, setShowTrialExtender] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [autoSelectedPlan, setAutoSelectedPlan] = useState<string | null>(null);
  const [complaintForm, setComplaintForm] = useState({
    complaintType: 'technical' as 'technical' | 'billing' | 'feature_request' | 'general',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });
  const [planEditForm, setPlanEditForm] = useState({
    monthlyPrice: 0,
    maxSystems: 0,
    maxPhones: 0,
    trialDays: 14
  });
  const [trialExtensionDays, setTrialExtensionDays] = useState(7);

  // Check for auto-select parameter from URL and custom events
  React.useEffect(() => {
    const handleAutoSelect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const autoSelect = urlParams.get('auto_select');
      if (autoSelect) {
        console.log('Auto-selecting plan:', autoSelect);
        setAutoSelectedPlan(autoSelect);
        
        // Clear the URL parameter
        window.history.replaceState({}, '', window.location.pathname);
        
        // Scroll to the selected plan
        setTimeout(() => {
          const planElement = document.getElementById(`plan-${autoSelect}`);
          if (planElement) {
            planElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            planElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
            setTimeout(() => {
              planElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
            }, 3000);
          }
        }, 500);
      }
    };

    // Handle initial load
    handleAutoSelect();

    // Listen for custom events from tenant selector
    const handleCustomAutoSelect = (event: any) => {
      const planType = event.detail.planType;
      console.log('Custom event auto-selecting plan:', planType);
      setAutoSelectedPlan(planType);
      
      setTimeout(() => {
        const planElement = document.getElementById(`plan-${planType}`);
        if (planElement) {
          planElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          planElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            planElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 300);
    };

    window.addEventListener('autoSelectPlan', handleCustomAutoSelect);
    
    return () => {
      window.removeEventListener('autoSelectPlan', handleCustomAutoSelect);
    };
  }, []);

  // Also check when component mounts or updates
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoSelect = urlParams.get('auto_select');
    if (autoSelect && autoSelect !== autoSelectedPlan) {
      console.log('Updating auto-selected plan:', autoSelect);
      setAutoSelectedPlan(autoSelect);
    }
  }, []);
  const handleStartTrial = async (planType: 'basic' | 'pro' | 'advance') => {
    try {
      await startTrial(planType);
    } catch (error) {
      console.error('Trial start failed:', error);
    }
  };

  const handleUpgrade = async (planType: 'basic' | 'pro' | 'advance') => {
    // Check for Basic→Pro upgrade discount
    if (currentSubscription?.planType === 'basic' && planType === 'pro') {
      const canGetDiscount = SubscriptionService.canGetUpgradeDiscount(currentSubscription);
      if (canGetDiscount) {
        // Show promo screen with 9% discount
        const plan = subscriptionPlans.find(p => p.planType === 'pro');
        if (plan) {
          const discount = SubscriptionService.calculateUpgradeDiscount(plan.monthlyPrice);
          const confirmed = window.confirm(
            `🎉 SPECIAL UPGRADE OFFER!\n\n` +
            `Upgrade to Pro Plan now and save 9%!\n\n` +
            `Regular Price: ₦${plan.monthlyPrice.toLocaleString()}\n` +
            `Your Price: ₦${discount.discountedPrice.toLocaleString()}\n` +
            `You Save: ₦${discount.savings.toLocaleString()}\n\n` +
            `This offer is only available during your first 3 months.\n` +
            `After 3 months, Basic plan features become limited.\n\n` +
            `Upgrade now to keep full features forever?`
          );
          
          if (confirmed) {
            // Process discounted upgrade
            await upgradeSubscription(planType);
            addNotification({
              title: '🎉 Upgrade Successful!',
              message: `Upgraded to Pro Plan with 9% discount! You saved ₦${discount.savings.toLocaleString()}`,
              type: 'success'
            });
          }
          return;
        }
      }
    }
    
    await upgradeSubscription(planType);
  };

  const handleDowngrade = async (planType: 'basic' | 'pro' | 'advance') => {
    try {
      await downgradeSubscription(planType);
    } catch (error) {
      console.error('Downgrade failed:', error);
    }
  };

  const handleExtendTrial = async () => {
    try {
      await extendTrial(trialExtensionDays);
      setShowTrialExtender(false);
    } catch (error) {
      console.error('Trial extension failed:', error);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!user || !complaintForm.subject.trim() || !complaintForm.description.trim()) return;

    try {
      await submitComplaint({
        userId: user.id,
        businessName: systemSettings.businessName,
        contactEmail: user.email,
        contactPhone: systemSettings.businessPhone,
        complaintType: complaintForm.complaintType,
        subject: complaintForm.subject,
        description: complaintForm.description,
        priority: complaintForm.priority
      });

      setComplaintForm({
        complaintType: 'technical',
        subject: '',
        description: '',
        priority: 'medium'
      });
      setShowComplaintModal(false);
    } catch (error) {
      console.error('Complaint submission failed:', error);
    }
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPlanEditForm({
      monthlyPrice: plan.monthlyPrice,
      maxSystems: plan.maxSystems,
      maxPhones: plan.maxPhones,
      trialDays: plan.trialDays
    });
    setShowPlanEditor(true);
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      await updatePlanPricing(selectedPlan.id, {
        monthlyPrice: planEditForm.monthlyPrice,
        maxSystems: planEditForm.maxSystems,
        maxPhones: planEditForm.maxPhones,
        trialDays: planEditForm.trialDays
      });
      setShowPlanEditor(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Plan update failed:', error);
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'basic': return 'border-blue-500 bg-blue-50';
      case 'pro': return 'border-purple-500 bg-purple-50';
      case 'advance': return 'border-gradient-to-br from-yellow-400 to-orange-500 bg-gradient-to-br from-yellow-50 to-orange-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canUpgrade = (planType: string) => {
    if (!currentSubscription) return true;
    const currentPlanIndex = ['basic', 'pro', 'advance'].indexOf(currentSubscription.planType);
    const targetPlanIndex = ['basic', 'pro', 'advance'].indexOf(planType);
    return targetPlanIndex !== currentPlanIndex;
  };

  const canDowngrade = (planType: string) => {
    if (!currentSubscription) return false;
    const currentPlanIndex = ['basic', 'pro', 'advance'].indexOf(currentSubscription.planType);
    const targetPlanIndex = ['basic', 'pro', 'advance'].indexOf(planType);
    return targetPlanIndex !== currentPlanIndex;
  };

  return (
    <div className="qb-page-container">
      <div className="qb-content-card">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="qb-title">Subscription Management</h1>
            <p className="qb-subtitle">Manage your BRAINBOX RETAILPLUS subscription and billing</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowComplaintModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Submit Complaint</span>
          </button>
        </div>
      </div>

        {/* Supabase Connection Test */}
        <div className="mt-6">
          <SupabaseConnectionTest />
        </div>

        {/* Current Subscription Status */}
      {currentSubscription && (
          <div className={`rounded-xl p-6 border-2 mt-6 ${
          isSubscriptionValid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Crown className={`h-8 w-8 ${isSubscriptionValid ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {subscriptionPlans.find(p => p.planType === currentSubscription.planType)?.name || 'Current Plan'}
                </h3>
                <p className={`text-sm ${isSubscriptionValid ? 'text-green-700' : 'text-red-700'}`}>
                  {currentSubscription.status === 'trial' 
                    ? `Trial - ${daysRemaining} days remaining`
                    : currentSubscription.status === 'active'
                    ? `Active - ${daysRemaining} days remaining`
                    : 'Expired'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSubscription.status)}`}>
                {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Systems: {currentSubscription.maxSystems} | Phones: {currentSubscription.maxPhones}
              </p>
              {currentSubscription.status === 'trial' && hasPermission('system_settings') && (
                <button
                  onClick={() => setShowTrialExtender(true)}
                  className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  Extend Trial
                </button>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {subscriptionPlans.map((plan) => (
            <div 
              key={plan.id} 
              id={`plan-${plan.planType}`}
              className={`rounded-xl border-2 p-6 bg-white shadow-lg transition-all duration-300 ${getPlanColor(plan.planType)} ${
                autoSelectedPlan === plan.planType ? 'transform scale-105 shadow-2xl' : ''
              }`}
            >
            <div className="text-center mb-6">
                {autoSelectedPlan === plan.planType && (
                  <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <p className="text-blue-800 font-bold text-sm">
                      🎯 Selected from Company: {plan.planType.toUpperCase()} Plan
                    </p>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-green-900">{plan.name}</h3>
              <div className="mt-2">
                  <span className="text-4xl font-bold text-green-900">₦{plan.monthlyPrice.toLocaleString()}</span>
                  <span className="text-green-600">/month</span>
              </div>
                <p className="text-sm text-green-600 mt-2 font-semibold">{plan.trialDays} days free trial</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Up to {plan.maxSystems} systems</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Up to {plan.maxPhones} phones</span>
              </div>
              
              {plan.features.allFeatures && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">All POS features</span>
                </div>
              )}
              
              {plan.features.phoneGreetings && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">Phone greetings & audio alerts</span>
                </div>
              )}
              
              {plan.features.accounting && (
                <div className="flex items-center space-x-2">
                  {plan.planType === 'basic' ? (
                    <div className="flex items-center space-x-1">
                      <Check className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs text-yellow-600">⏰</span>
                    </div>
                  ) : (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm text-gray-700">
                    {plan.planType === 'basic' ? 'Full Accounting (3 months, then limited)' : 
                     plan.planType === 'pro' ? 'Full Accounting (Always)' : 
                     'Full Accounting + Advanced Reports'}
                  </span>
                </div>
              )}
              
              {plan.features.rewardRedemption && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">Reward redemption system</span>
                </div>
              )}
              
              {plan.features.quickbooksImport && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">QuickBooks POS import</span>
                </div>
              )}
              
              {plan.features.tabletSupport && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">Tablet & mobile support</span>
                </div>
              )}
              
              {plan.features.multiStore && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">Multi-store management</span>
                </div>
              )}
              
              {plan.features.advancedReporting && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">Advanced reports & analytics</span>
                </div>
              )}
              
              {plan.features.apiAccess && (
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">API access & integrations</span>
                </div>
              )}
              
              {plan.features.prioritySupport && (
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-700">Priority support & customization</span>
                </div>
              )}
            </div>

            {/* Special Upgrade Offer for Basic Plan */}
            {plan.planType === 'pro' && currentSubscription?.planType === 'basic' && 
             SubscriptionService.canGetUpgradeDiscount(currentSubscription) && (
              <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-bold text-yellow-800">🎉 LIMITED TIME OFFER!</span>
                </div>
                <p className="text-xs text-yellow-700 mb-1">
                  Upgrade now and save 9% (₦{SubscriptionService.calculateUpgradeDiscount(plan.monthlyPrice).savings.toLocaleString()})
                </p>
                <p className="text-xs text-yellow-600">
                  Your Price: ₦{SubscriptionService.calculateUpgradeDiscount(plan.monthlyPrice).discountedPrice.toLocaleString()}/month
                </p>
              </div>
            )}

            {/* Plan Limitations Warning for Basic */}
            {plan.planType === 'basic' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">⚠️ After 3 months: Accounting features become limited</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(!currentSubscription || currentSubscription.planType !== plan.planType) && (
                <>
                  {!currentSubscription && (
                    <button
                      onClick={() => handleStartTrial(plan.planType)}
                      disabled={isLoading}
                      className={`w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors ${
                        autoSelectedPlan === plan.planType ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' : ''
                      }`}
                    >
                      Start {plan.trialDays}-Day Trial
                    </button>
                  )}
                  
                  {canUpgrade(plan.planType) && (
                    <button
                      onClick={() => handleUpgrade(plan.planType)}
                      disabled={isLoading}
                      className={`w-full px-4 py-2 ${
                        plan.planType === 'pro' && currentSubscription?.planType === 'basic' && 
                        SubscriptionService.canGetUpgradeDiscount(currentSubscription)
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold'
                          : 'bg-blue-600 text-white'
                      } rounded-lg hover:opacity-90 disabled:opacity-50 transition-all ${
                        autoSelectedPlan === plan.planType ? 'ring-2 ring-blue-300' : ''
                      }`}
                    >
                      {plan.planType === 'pro' && currentSubscription?.planType === 'basic' && 
                       SubscriptionService.canGetUpgradeDiscount(currentSubscription)
                        ? '🎉 Upgrade with 9% Discount!'
                        : `Switch to ${plan.name}`
                      }
                    </button>
                  )}
                  
                  {canDowngrade(plan.planType) && (
                    <button
                      onClick={() => handleDowngrade(plan.planType)}
                      disabled={isLoading}
                      className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors ${
                        autoSelectedPlan === plan.planType ? 'ring-2 ring-blue-300 bg-blue-700' : ''
                      }`}
                    >
                      Switch to {plan.name}
                    </button>
                  )}
                </>
              )}
              
              {currentSubscription && currentSubscription.planType === plan.planType && (
                <div className={`w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center ${
                  autoSelectedPlan === plan.planType ? 'ring-2 ring-green-500 bg-green-100 text-green-700' : ''
                }`}>
                  Current Plan
                </div>
              )}
              
              {hasPermission('system_settings') && (
                <button
                  onClick={() => handleEditPlan(plan)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <Edit className="h-3 w-3" />
                  <span>TIW Admin</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Reference</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{payment.paymentDate.toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">₦{payment.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-sm">{payment.paystackReference}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'success' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Complaints */}
      {userComplaints.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Complaints</h3>
          <div className="space-y-4">
            {userComplaints.map((complaint) => (
              <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{complaint.subject}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      complaint.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      complaint.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {complaint.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {complaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                <p className="text-xs text-gray-500">
                  Submitted: {complaint.createdAt.toLocaleDateString()} | 
                  Type: {complaint.complaintType.replace('_', ' ')}
                </p>
                {complaint.adminResponse && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Admin Response:</strong> {complaint.adminResponse}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Submit Complaint</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complaint Type</label>
                    <select
                      value={complaintForm.complaintType}
                      onChange={(e) => setComplaintForm({...complaintForm, complaintType: e.target.value as any})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing Issue</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={complaintForm.priority}
                      onChange={(e) => setComplaintForm({...complaintForm, priority: e.target.value as any})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the issue"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detailed description of your complaint or issue..."
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your complaint will be automatically sent to our support team at <strong>truetechitworldno1@gmail.com</strong> for fast resolution. We aim to respond within 24 hours.
                </p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComplaint}
                  disabled={!complaintForm.subject.trim() || !complaintForm.description.trim() || isLoading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Complaint</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Extension Modal */}
      {showTrialExtender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Extend Trial Period</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Days</label>
                  <input
                    type="number"
                    value={trialExtensionDays}
                    onChange={(e) => setTrialExtensionDays(parseInt(e.target.value) || 7)}
                    min="1"
                    max="90"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Current trial ends: {currentSubscription?.endDate.toLocaleDateString()}<br/>
                    New end date: {new Date(currentSubscription?.endDate.getTime() + trialExtensionDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowTrialExtender(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendTrial}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Extend Trial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Editor Modal (Admin Only) */}
      {showPlanEditor && selectedPlan && hasPermission('system_settings') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit {selectedPlan.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Price (₦)</label>
                  <input
                    type="number"
                    value={planEditForm.monthlyPrice}
                    onChange={(e) => setPlanEditForm({...planEditForm, monthlyPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="1000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Systems</label>
                  <input
                    type="number"
                    value={planEditForm.maxSystems}
                    onChange={(e) => setPlanEditForm({...planEditForm, maxSystems: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Phones</label>
                  <input
                    type="number"
                    value={planEditForm.maxPhones}
                    onChange={(e) => setPlanEditForm({...planEditForm, maxPhones: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trial Days</label>
                  <input
                    type="number"
                    value={planEditForm.trialDays}
                    onChange={(e) => setPlanEditForm({...planEditForm, trialDays: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="90"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPlanEditor(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePlan}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}