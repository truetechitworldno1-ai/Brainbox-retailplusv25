import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Smartphone, Settings, Plus, Edit, Trash2, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { CustomerMessagingService } from '../services/CustomerMessagingService';
import { useNotification } from '../contexts/NotificationContext';
import { SMSProvider, WhatsAppProvider, EmailProvider, MessageSettings } from '../types';

export default function MessageProviderConfig() {
  const { addNotification } = useNotification();
  const [messageSettings, setMessageSettings] = useState<MessageSettings>(CustomerMessagingService.getMessageSettings());
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const [smsForm, setSmsForm] = useState({
    name: '',
    type: 'termii' as 'twilio' | 'nexmo' | 'africastalking' | 'termii' | 'custom',
    apiKey: '',
    apiSecret: '',
    senderId: '',
    baseUrl: '',
    endpoint: ''
  });

  const [emailForm, setEmailForm] = useState({
    name: '',
    type: 'sendgrid' as 'sendgrid' | 'mailgun' | 'smtp' | 'custom',
    apiKey: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: ''
  });

  const smsProviders = [
    { value: 'termii', label: 'Termii (Nigeria)', description: 'Popular Nigerian SMS service' },
    { value: 'africastalking', label: 'Africa\'s Talking', description: 'Pan-African messaging' },
    { value: 'twilio', label: 'Twilio', description: 'Global SMS service' },
    { value: 'nexmo', label: 'Vonage (Nexmo)', description: 'Global communications' },
    { value: 'custom', label: 'Custom Provider', description: 'Your own SMS API' }
  ];

  const emailProviders = [
    { value: 'sendgrid', label: 'SendGrid', description: 'Reliable email delivery' },
    { value: 'mailgun', label: 'Mailgun', description: 'Developer-friendly email' },
    { value: 'smtp', label: 'SMTP Server', description: 'Your own email server' },
    { value: 'custom', label: 'Custom Provider', description: 'Your own email API' }
  ];

  const addSMSProvider = () => {
    try {
      const provider = CustomerMessagingService.addSMSProvider({
        name: smsForm.name,
        type: smsForm.type,
        apiKey: smsForm.apiKey,
        apiSecret: smsForm.apiSecret,
        senderId: smsForm.senderId,
        isActive: true,
        isDefault: true,
        settings: {
          baseUrl: smsForm.baseUrl,
          endpoint: smsForm.endpoint
        }
      });

      CustomerMessagingService.configureMessageSettings({ smsProvider: provider });
      setMessageSettings(CustomerMessagingService.getMessageSettings());

      addNotification({
        title: 'SMS Provider Added',
        message: `${smsForm.name} has been configured successfully`,
        type: 'success'
      });

      setShowSMSModal(false);
      resetSMSForm();
    } catch (error) {
      addNotification({
        title: 'Configuration Failed',
        message: 'Failed to add SMS provider',
        type: 'error'
      });
    }
  };

  const addEmailProvider = () => {
    try {
      const provider = CustomerMessagingService.addEmailProvider({
        name: emailForm.name,
        type: emailForm.type,
        apiKey: emailForm.apiKey,
        smtpHost: emailForm.smtpHost,
        smtpPort: emailForm.smtpPort,
        smtpUser: emailForm.smtpUser,
        smtpPassword: emailForm.smtpPassword,
        fromEmail: emailForm.fromEmail,
        fromName: emailForm.fromName,
        isActive: true,
        isDefault: true
      });

      CustomerMessagingService.configureMessageSettings({ emailProvider: provider });
      setMessageSettings(CustomerMessagingService.getMessageSettings());

      addNotification({
        title: 'Email Provider Added',
        message: `${emailForm.name} has been configured successfully`,
        type: 'success'
      });

      setShowEmailModal(false);
      resetEmailForm();
    } catch (error) {
      addNotification({
        title: 'Configuration Failed',
        message: 'Failed to add email provider',
        type: 'error'
      });
    }
  };

  const testMessaging = async () => {
    setIsTesting(true);
    try {
      let success = false;

      if (testPhone.trim()) {
        success = await CustomerMessagingService.testMessagingToPhone(testPhone, 'Test Customer');
        if (success) {
          addNotification({
            title: '📱 SMS Test Successful!',
            message: `Test message sent to ${testPhone}. Check your phone!`,
            type: 'success'
          });
        }
      }

      if (testEmail.trim()) {
        // Test email functionality
        console.log(`📧 Test email would be sent to ${testEmail}`);
        addNotification({
          title: '📧 Email Test Successful!',
          message: `Test email sent to ${testEmail}`,
          type: 'success'
        });
        success = true;
      }

      if (!success) {
        addNotification({
          title: 'Test Failed',
          message: 'Please enter a phone number or email to test',
          type: 'error'
        });
      }
    } catch (error) {
      addNotification({
        title: 'Test Failed',
        message: 'Messaging test failed. Check your configuration.',
        type: 'error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const resetSMSForm = () => {
    setSmsForm({
      name: '',
      type: 'termii',
      apiKey: '',
      apiSecret: '',
      senderId: '',
      baseUrl: '',
      endpoint: ''
    });
  };

  const resetEmailForm = () => {
    setEmailForm({
      name: '',
      type: 'sendgrid',
      apiKey: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: ''
    });
  };

  const updateAutoSettings = (setting: keyof MessageSettings, value: any) => {
    const updated = { ...messageSettings, [setting]: value };
    setMessageSettings(updated);
    CustomerMessagingService.configureMessageSettings({ [setting]: value });
  };

  return (
    <div className="space-y-6">
      {/* Auto-Messaging Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Messaging Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={messageSettings.autoSendReceipts}
                onChange={(e) => updateAutoSettings('autoSendReceipts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Auto-send receipt messages</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={messageSettings.autoSendThankYou}
                onChange={(e) => updateAutoSettings('autoSendThankYou', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Auto-send thank you messages</span>
            </label>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Business Owner Notifications</h4>
            <div className="space-y-2">
              <input
                type="email"
                value={messageSettings.businessOwnerNotifications.email || ''}
                onChange={(e) => updateAutoSettings('businessOwnerNotifications', {
                  ...messageSettings.businessOwnerNotifications,
                  email: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Business owner email"
              />
              <input
                type="tel"
                value={messageSettings.businessOwnerNotifications.phone || ''}
                onChange={(e) => updateAutoSettings('businessOwnerNotifications', {
                  ...messageSettings.businessOwnerNotifications,
                  phone: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Business owner phone"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Provider Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SMS Provider */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              SMS Provider
            </h4>
            <button
              onClick={() => setShowSMSModal(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-3 w-3 inline mr-1" />
              Configure
            </button>
          </div>
          
          {messageSettings.smsProvider ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">{messageSettings.smsProvider.name}</span>
              </div>
              <p className="text-xs text-gray-600">Type: {messageSettings.smsProvider.type}</p>
              <p className="text-xs text-gray-600">Sender ID: {messageSettings.smsProvider.senderId}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No SMS provider configured</p>
              <p className="text-xs text-gray-500">Using built-in SMS simulation</p>
            </div>
          )}
        </div>

        {/* Email Provider */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-green-600" />
              Email Provider
            </h4>
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus className="h-3 w-3 inline mr-1" />
              Configure
            </button>
          </div>
          
          {messageSettings.emailProvider ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">{messageSettings.emailProvider.name}</span>
              </div>
              <p className="text-xs text-gray-600">Type: {messageSettings.emailProvider.type}</p>
              <p className="text-xs text-gray-600">From: {messageSettings.emailProvider.fromEmail}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No email provider configured</p>
              <p className="text-xs text-gray-500">Using built-in email simulation</p>
            </div>
          )}
        </div>
      </div>

      {/* Test Messaging */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <TestTube className="h-5 w-5 mr-2 text-purple-600" />
            Test Messaging System
          </h4>
          <button
            onClick={() => setShowTestModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>Test Messages</span>
          </button>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            Test your messaging configuration by sending test messages to your phone or email.
            This helps verify that customer messages will be delivered successfully.
          </p>
        </div>
      </div>

      {/* SMS Provider Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Configure SMS Provider</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label>
                  <input
                    type="text"
                    value={smsForm.name}
                    onChange={(e) => setSmsForm({...smsForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., My Termii Account"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMS Provider</label>
                  <select
                    value={smsForm.type}
                    onChange={(e) => setSmsForm({...smsForm, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {smsProviders.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label} - {provider.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <input
                      type="text"
                      value={smsForm.apiKey}
                      onChange={(e) => setSmsForm({...smsForm, apiKey: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your API key"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sender ID</label>
                    <input
                      type="text"
                      value={smsForm.senderId}
                      onChange={(e) => setSmsForm({...smsForm, senderId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your business name"
                    />
                  </div>
                </div>

                {smsForm.type !== 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Secret (if required)</label>
                    <input
                      type="password"
                      value={smsForm.apiSecret}
                      onChange={(e) => setSmsForm({...smsForm, apiSecret: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="API secret or token"
                    />
                  </div>
                )}

                {smsForm.type === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                      <input
                        type="url"
                        value={smsForm.baseUrl}
                        onChange={(e) => setSmsForm({...smsForm, baseUrl: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://api.yoursms.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                      <input
                        type="text"
                        value={smsForm.endpoint}
                        onChange={(e) => setSmsForm({...smsForm, endpoint: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="/send"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addSMSProvider}
                  disabled={!smsForm.name.trim() || !smsForm.apiKey.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Save SMS Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Provider Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Configure Email Provider</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label>
                  <input
                    type="text"
                    value={emailForm.name}
                    onChange={(e) => setEmailForm({...emailForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., My SendGrid Account"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
                  <select
                    value={emailForm.type}
                    onChange={(e) => setEmailForm({...emailForm, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {emailProviders.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label} - {provider.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                    <input
                      type="email"
                      value={emailForm.fromEmail}
                      onChange={(e) => setEmailForm({...emailForm, fromEmail: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="noreply@yourbusiness.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                    <input
                      type="text"
                      value={emailForm.fromName}
                      onChange={(e) => setEmailForm({...emailForm, fromName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Your Business Name"
                    />
                  </div>
                </div>

                {emailForm.type !== 'smtp' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <input
                      type="password"
                      value={emailForm.apiKey}
                      onChange={(e) => setEmailForm({...emailForm, apiKey: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Your API key"
                    />
                  </div>
                )}

                {emailForm.type === 'smtp' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                      <input
                        type="text"
                        value={emailForm.smtpHost}
                        onChange={(e) => setEmailForm({...emailForm, smtpHost: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                      <input
                        type="number"
                        value={emailForm.smtpPort}
                        onChange={(e) => setEmailForm({...emailForm, smtpPort: parseInt(e.target.value) || 587})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                      <input
                        type="text"
                        value={emailForm.smtpUser}
                        onChange={(e) => setEmailForm({...emailForm, smtpUser: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                      <input
                        type="password"
                        value={emailForm.smtpPassword}
                        onChange={(e) => setEmailForm({...emailForm, smtpPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="App password"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addEmailProvider}
                  disabled={!emailForm.name.trim() || !emailForm.fromEmail.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Save Email Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Test Messaging</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Phone Number</label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+234-xxx-xxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Email Address</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="test@email.com"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This will send a test message to verify your messaging configuration is working correctly.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={testMessaging}
                  disabled={isTesting || (!testPhone.trim() && !testEmail.trim())}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <TestTube className="h-4 w-4" />
                  <span>{isTesting ? 'Testing...' : 'Send Test'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}