import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building, 
  CreditCard, 
  Bell, 
  Users, 
  Monitor, 
  Printer, 
  Volume2, 
  Shield,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Crown,
  Globe,
  Smartphone,
  Mail,
  Phone,
  Send
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useNotification } from '../contexts/NotificationContext';
import PrinterTestPanel from '../components/PrinterTestPanel';
import PaystackTestPanel from '../components/PaystackTestPanel';
import WorkstationConfig from '../components/WorkstationConfig';
import LicenseActivation from '../components/LicenseActivation';
import DemoModeController from '../components/DemoModeController';

export default function Settings() {
  const { systemSettings, updateSystemSettings } = useData();
  const { user, hasPermission, users, rolePermissions, updateRolePermissions, tiwSettings, updateTIWSettings, verifyTIWAccess } = useAuth();
  const { customMessages, updateCustomMessage } = useAudio();
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState('business');
  const [showTIWAccess, setShowTIWAccess] = useState(false);
  const [tiwPassword, setTiwPassword] = useState('');
  const [tiwAccessGranted, setTiwAccessGranted] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  const [businessForm, setBusinessForm] = useState({
    businessName: systemSettings.businessName,
    businessAddress: systemSettings.businessAddress,
    businessPhone: systemSettings.businessPhone,
    businessEmail: systemSettings.businessEmail,
    businessLogo: systemSettings.businessLogo || '',
    businessRegistration: systemSettings.businessRegistration || '',
    taxId: systemSettings.taxId || '',
    receiptHeader: systemSettings.receiptHeader || '',
    receiptFooter: systemSettings.receiptFooter || '',
    returnPolicy: systemSettings.returnPolicy || '',
    contactInfo: systemSettings.contactInfo || ''
  });

  const [paymentForm, setPaymentForm] = useState({
    cash: {
      enabled: systemSettings.paymentMethods.cash.enabled,
      label: systemSettings.paymentMethods.cash.label,
      description: systemSettings.paymentMethods.cash.description
    },
    pos: {
      enabled: systemSettings.paymentMethods.pos.enabled,
      label: systemSettings.paymentMethods.pos.label,
      description: systemSettings.paymentMethods.pos.description
    },
    transfer: {
      enabled: systemSettings.paymentMethods.transfer.enabled,
      label: systemSettings.paymentMethods.transfer.label,
      description: systemSettings.paymentMethods.transfer.description,
      banks: systemSettings.paymentMethods.transfer.banks,
      customBanks: systemSettings.paymentMethods.transfer.customBanks
    },
    debit: {
      enabled: systemSettings.paymentMethods.debit.enabled,
      label: systemSettings.paymentMethods.debit.label,
      description: systemSettings.paymentMethods.debit.description
    },
    credit: {
      enabled: systemSettings.paymentMethods.credit.enabled,
      label: systemSettings.paymentMethods.credit.label,
      description: systemSettings.paymentMethods.credit.description
    }
  });

  const [newBank, setNewBank] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Building, permission: 'system_settings' },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard, permission: 'system_settings' },
    { id: 'demo', label: 'Demo Mode', icon: Shield, permission: 'system_settings' },
    { id: 'notifications', label: 'Notifications', icon: Bell, permission: 'system_settings' },
    { id: 'audio', label: 'Audio Messages', icon: Volume2, permission: 'system_settings' },
    { id: 'users', label: 'User Roles', icon: Users, permission: 'manage_users' },
    { id: 'workstations', label: 'Workstations', icon: Monitor, permission: 'system_settings' },
    { id: 'printers', label: 'Printers', icon: Printer, permission: 'system_settings' },
    { id: 'paystack', label: 'Paystack Test', icon: CreditCard, permission: 'system_settings' },
    { id: 'tiw', label: 'TIW Controls', icon: Crown, permission: 'all' },
    { id: 'license', label: 'License', icon: Shield, permission: 'system_settings' }
  ];

  const filteredTabs = tabs.filter(tab => 
    hasPermission(tab.permission) || hasPermission('all')
  );

  const handleTIWAccess = () => {
    if (verifyTIWAccess(tiwPassword)) {
      setTiwAccessGranted(true);
      setShowTIWAccess(false);
      setTiwPassword('');
      addNotification({
        title: 'TIW Access Granted',
        message: 'Technology Innovation Worldwide controls unlocked',
        type: 'success'
      });
    } else {
      addNotification({
        title: 'Access Denied',
        message: 'Invalid TIW password',
        type: 'error'
      });
    }
  };

  const saveBusiness = () => {
    updateSystemSettings(businessForm);
    addNotification({
      title: 'Business Settings Saved',
      message: 'Business information has been updated',
      type: 'success'
    });
  };

  const savePayments = () => {
    updateSystemSettings({
      paymentMethods: paymentForm
    });
    addNotification({
      title: 'Payment Methods Updated',
      message: 'Payment method settings have been saved',
      type: 'success'
    });
  };

  const addCustomBank = () => {
    if (!newBank.trim()) return;
    
    const updatedTransfer = {
      ...paymentForm.transfer,
      customBanks: [...paymentForm.transfer.customBanks, newBank.trim()]
    };
    
    setPaymentForm({
      ...paymentForm,
      transfer: updatedTransfer
    });
    
    setNewBank('');
    
    addNotification({
      title: 'Bank Added',
      message: `${newBank} has been added to the bank list`,
      type: 'success'
    });
  };

  const removeCustomBank = (bankToRemove: string) => {
    const updatedTransfer = {
      ...paymentForm.transfer,
      customBanks: paymentForm.transfer.customBanks.filter(bank => bank !== bankToRemove)
    };
    
    setPaymentForm({
      ...paymentForm,
      transfer: updatedTransfer
    });
    
    addNotification({
      title: 'Bank Removed',
      message: `${bankToRemove} has been removed from the bank list`,
      type: 'success'
    });
  };

  const updateRolePermission = (role: string, permission: string, value: boolean) => {
    const rolePerms = rolePermissions.find(rp => rp.role === role);
    if (rolePerms) {
      const updatedPermissions = {
        ...rolePerms.permissions,
        [permission]: value
      };
      updateRolePermissions(role, updatedPermissions);
    }
  };

  // Check if user has access to settings
  if (!hasPermission('system_settings') && !hasPermission('all')) {
    return (
      <div className="qb-page-container">
        <div className="qb-content-card">
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You need admin or system settings permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qb-page-container">
      <div className="qb-content-card">
        <div>
          <h1 className="qb-title">System Settings</h1>
          <p className="qb-subtitle">Configure your BrainBox-RetailPlus V25 system</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-green-50 rounded-xl border-2 border-green-200 mt-6">
          <div className="border-b border-green-200">
            <nav className="flex flex-wrap px-6">
              {filteredTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
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
            {/* Business Information Tab */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-green-900">Business Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={businessForm.businessName}
                      onChange={(e) => setBusinessForm({...businessForm, businessName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
                    <input
                      type="tel"
                      value={businessForm.businessPhone}
                      onChange={(e) => setBusinessForm({...businessForm, businessPhone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                    <input
                      type="email"
                      value={businessForm.businessEmail}
                      onChange={(e) => setBusinessForm({...businessForm, businessEmail: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                    <input
                      type="text"
                      value={businessForm.businessRegistration}
                      onChange={(e) => setBusinessForm({...businessForm, businessRegistration: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="RC123456"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                    <textarea
                      value={businessForm.businessAddress}
                      onChange={(e) => setBusinessForm({...businessForm, businessAddress: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={saveBusiness}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Business Settings</span>
                </button>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-green-900">Payment Method Configuration</h3>
                
                <div className="space-y-6">
                  {Object.entries(paymentForm).map(([method, config]) => (
                    <div key={method} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 capitalize flex items-center space-x-2">
                          <CreditCard className="h-5 w-5" />
                          <span>{method === 'pos' ? 'POS Terminal' : method} Payment</span>
                        </h4>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              [method]: { ...config, enabled: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">Enabled</span>
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Label</label>
                          <input
                            type="text"
                            value={config.label}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              [method]: { ...config, label: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={config.description}
                            onChange={(e) => setPaymentForm({
                              ...paymentForm,
                              [method]: { ...config, description: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Bank Transfer Specific Settings */}
                      {method === 'transfer' && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Available Banks</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                              {config.banks.map((bank) => (
                                <div key={bank} className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                                  {bank}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Banks</label>
                            <div className="flex space-x-2 mb-2">
                              <input
                                type="text"
                                value={newBank}
                                onChange={(e) => setNewBank(e.target.value)}
                                placeholder="Add custom bank..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                              <button
                                onClick={addCustomBank}
                                disabled={!newBank.trim()}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="space-y-1">
                              {config.customBanks.map((bank) => (
                                <div key={bank} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                                  <span className="text-sm text-blue-800">{bank}</span>
                                  <button
                                    onClick={() => removeCustomBank(bank)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={savePayments}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Payment Settings</span>
                </button>
              </div>
            )}

            {/* Rewards System Tab */}
            {activeTab === 'rewards' && (
              <RewardManagementPanel />
            )}

            {/* Customer Messages Tab */}
            {activeTab === 'messaging' && (
              <MessageProviderConfig />
            )}

            {/* Audio Messages Tab */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-green-900">Audio Message Configuration</h3>
                
                <div className="space-y-4">
                  {Object.entries(customMessages).map(([key, message]) => (
                    <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => updateCustomMessage(key as any, e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Roles Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-green-900">User Role Permissions</h3>
                
                <div className="space-y-4">
                  {rolePermissions.map((rolePerms) => (
                    <div key={rolePerms.role} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {rolePerms.role.replace('_', ' ')} Role
                        </h4>
                        <button
                          onClick={() => setEditingRole(editingRole === rolePerms.role ? null : rolePerms.role)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {editingRole === rolePerms.role ? 'Done' : 'Edit'}
                        </button>
                      </div>
                      
                      {editingRole === rolePerms.role && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(rolePerms.permissions).map(([permission, value]) => (
                            <label key={permission} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => updateRolePermission(rolePerms.role, permission, e.target.checked)}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {permission.replace('_', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workstations Tab */}
            {activeTab === 'workstations' && (
              <WorkstationConfig />
            )}

            {/* Printers Tab */}
            {activeTab === 'printers' && (
              <PrinterTestPanel />
            )}

            {/* Paystack Test Tab */}
            {activeTab === 'paystack' && (
              <PaystackTestPanel />
            )}

            {/* TIW Controls Tab */}
            {activeTab === 'tiw' && (
              <div className="space-y-6">
                {!tiwAccessGranted ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <Crown className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">TIW Access Required</h3>
                    <p className="text-red-700 mb-4">Enter TIW password to access Technology Innovation Worldwide controls</p>
                    <div className="max-w-sm mx-auto">
                      <input
                        type="password"
                        value={tiwPassword}
                        onChange={(e) => setTiwPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTIWAccess()}
                        placeholder="Enter TIW password"
                        className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3"
                      />
                      <button
                        onClick={handleTIWAccess}
                        className="w-full px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-3 text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Send className="h-6 w-6" />
                        <span>{isSendingTest ? '📤 Sending SMS...' : '📱 SEND TEST SMS NOW!'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-900 mb-4">TIW Global Controls</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Globe className="h-6 w-6 mx-auto mb-2" />
                          <span className="block font-medium">Global Dashboard</span>
                          <span className="text-xs opacity-80">View all clients</span>
                        </button>
                        <button className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          <Users className="h-6 w-6 mx-auto mb-2" />
                          <span className="block font-medium">Client Management</span>
                          <span className="text-xs opacity-80">Manage all businesses</span>
                        </button>
                        <button className="p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                          <Crown className="h-6 w-6 mx-auto mb-2" />
                          <span className="block font-medium">License Control</span>
                          <span className="text-xs opacity-80">Manage licenses</span>
                        </button>
                        <button 
                          onClick={() => setShowLicenseModal(true)}
                          className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Shield className="h-6 w-6 mx-auto mb-2" />
                          <span className="block font-medium">License Manager</span>
                          <span className="text-xs opacity-80">Activate/Deactivate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* License Tab */}
            {activeTab === 'license' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-green-900">Software License</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900">BrainBox-RetailPlus V25</h4>
                      <p className="text-blue-700">Licensed Software - Technology Innovation Worldwide</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLicenseModal(true)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Manage License
                  </button>
                </div>
              </div>
            )}
          </div>
            {/* Demo Mode Tab */}
            {activeTab === 'demo' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-green-900">Demo Mode & Privacy Protection</h3>
                <DemoModeController />
              </div>
            )}
        </div>
      </div>

      {/* License Activation Modal */}
      <LicenseActivation
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        onActivated={() => {
          addNotification({
            title: 'License Activated',
            message: 'Software license has been activated successfully',
            type: 'success'
          });
        }}
      />
    </div>
  );
}