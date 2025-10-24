import React, { useState } from 'react';
import { Building, Plus, Users, Crown, Settings, Check } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAudio } from '../contexts/AudioContext';

export default function TenantSelector() {
  const { currentTenant, switchTenant, createTenant, isAppOwner, getAllTenants: getTenants } = useTenant();
  const { user } = useAuth();
  const { subscriptionPlans, currentSubscription } = useSubscription();
  const { playWelcomeMessage } = useAudio();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTenantList, setShowTenantList] = useState(false);
  const [showAppOwnerDashboard, setShowAppOwnerDashboard] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    companyName: '',
    businessRegistration: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    subscriptionPlan: 'basic' as 'basic' | 'pro' | 'advance'
  });

  // Get all tenants from localStorage
  const tenants = getTenants();

  // Auto-navigate to subscription page with selected plan
  const handleTenantClick = async (tenant: any) => {
    await switchTenant(tenant.id);
    setShowTenantList(false);
    
    // Play welcome message when switching to a company
    if (!isAppOwner) {
      setTimeout(() => {
        playWelcomeMessage();
        const welcomeMessage = `Welcome to ${tenant.companyName}! BrainBox-RetailPlus V25 is ready to serve your business.`;
        const utterance = new SpeechSynthesisUtterance(welcomeMessage);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }, 500);
    }
  };
  const handleCreateTenant = async () => {
    if (!tenantForm.companyName.trim()) return;

    try {
      await createTenant({
        ...tenantForm,
        maxSystems: tenantForm.subscriptionPlan === 'basic' ? 3 : 
                   tenantForm.subscriptionPlan === 'pro' ? 5 : 8,
        maxPhones: tenantForm.subscriptionPlan === 'basic' ? 1 : 
                  tenantForm.subscriptionPlan === 'pro' ? 2 : 3,
        isActive: true,
        settings: {
          currency: '₦',
          taxRate: 7.5,
          timezone: 'Africa/Lagos',
          features: ['pos', 'inventory', 'customers', 'reports']
        }
      });

      setTenantForm({
        companyName: '',
        businessRegistration: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        subscriptionPlan: 'basic'
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  };

  return (
    <div className="relative">
      {/* App Owner Global Dashboard */}
      {isAppOwner && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-6 w-6" />
              <div>
                <h3 className="font-bold">TIW Global Dashboard</h3>
                <p className="text-sm opacity-90">App Owner View - All Companies</p>
              </div>
            </div>
            <button
              onClick={() => setShowAppOwnerDashboard(!showAppOwnerDashboard)}
              className="bg-white bg-opacity-20 px-3 py-1 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              {getAllTenants().length} Companies
            </button>
          </div>
          
          {showAppOwnerDashboard && (
            <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <h4 className="font-medium mb-3 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                🏢 All Companies Overview:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getAllTenants().map((tenant) => (
                  <div key={tenant.id} className="bg-white bg-opacity-20 rounded-lg p-3 hover:bg-opacity-30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tenant.companyName}</p>
                        <p className="text-xs opacity-80">
                          {tenant.subscriptionPlan.toUpperCase()} Plan | {tenant.maxSystems} systems
                        </p>
                        <p className="text-xs opacity-70">{tenant.contactEmail}</p>
                      </div>
                      <button
                        onClick={() => switchTenant(tenant.id)}
                        className="bg-white text-purple-600 px-3 py-1 rounded text-xs font-medium hover:bg-opacity-90 transition-colors"
                      >
                        🔍 View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white border-opacity-20">
                <p className="text-xs opacity-80 text-center">
                  🔑 TIW App Owner Access | Complete data isolation per company
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Tenant Display */}
      <button
        onClick={() => setShowTenantList(!showTenantList)}
        className="flex items-center space-x-3 p-3 bg-white border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors w-full shadow-sm"
      >
        <div className="p-2 bg-blue-100 rounded-lg">
          {isAppOwner ? <Crown className="h-5 w-5 text-purple-600" /> : <Building className="h-5 w-5 text-blue-600" />}
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-gray-900">
            {isAppOwner ? 'TIW Global Dashboard' : (currentTenant?.companyName || 'Select Company')}
          </p>
          <p className="text-sm text-gray-500">
            {isAppOwner ? `${getTenants().length} Companies` : (currentTenant?.subscriptionPlan?.toUpperCase() + ' Plan')}
          </p>
          {currentTenant && !isAppOwner && (
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Data Isolated</span>
            </div>
          )}
        </div>
        <Settings className="h-4 w-4 text-gray-400" />
      </button>

      {/* Tenant List Dropdown */}
      {showTenantList && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto mobile-modal">
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">Select Company</h4>
          </div>
          
          <div className="p-2">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleTenantClick(tenant)}
                className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  currentTenant?.id === tenant.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{tenant.companyName}</p>
                    <p className="text-sm text-gray-600">{tenant.contactEmail}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tenant.subscriptionPlan === 'basic' ? 'bg-green-100 text-green-800' :
                        tenant.subscriptionPlan === 'pro' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tenant.subscriptionPlan.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        {tenant.maxSystems} systems, {tenant.maxPhones} phones
                      </span>
                      <span className="text-xs text-green-600 font-medium hidden md:inline">
                        Click to view plan →
                      </span>
                    </div>
                  </div>
                  {currentTenant?.id === tenant.id && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
            
            <button
              onClick={() => {
                setShowCreateModal(true);
                setShowTenantList(false);
              }}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Company</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto mobile-modal">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Company</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={tenantForm.companyName}
                    onChange={(e) => setTenantForm({...tenantForm, companyName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Urban Supermarket"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration</label>
                  <input
                    type="text"
                    value={tenantForm.businessRegistration}
                    onChange={(e) => setTenantForm({...tenantForm, businessRegistration: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="RC123456"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                  <input
                    type="email"
                    value={tenantForm.contactEmail}
                    onChange={(e) => setTenantForm({...tenantForm, contactEmail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="info@urbansupermarket.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={tenantForm.contactPhone}
                    onChange={(e) => setTenantForm({...tenantForm, contactPhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+234 123 456 7890"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                  <textarea
                    value={tenantForm.address}
                    onChange={(e) => setTenantForm({...tenantForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main Street, Lagos, Nigeria"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['basic', 'pro', 'advance'].map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setTenantForm({...tenantForm, subscriptionPlan: plan as any})}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          tenantForm.subscriptionPlan === plan
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Crown className="h-5 w-5 mx-auto mb-2" />
                        <p className="font-medium capitalize">{plan}</p>
                        <p className="text-xs text-gray-500">
                          {plan === 'basic' ? '3 systems, 1 phone' :
                           plan === 'pro' ? '5 systems, 2 phones' :
                           '8 systems, 3 phones'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTenant}
                  disabled={!tenantForm.companyName.trim() || !tenantForm.contactEmail.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Create Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}