import React, { useState } from 'react';
import { Shield, Key, Building, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AntiPiracyService } from '../services/AntiPiracyService';
import { useNotification } from '../contexts/NotificationContext';

interface LicenseActivationProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export default function LicenseActivation({ isOpen, onClose, onActivated }: LicenseActivationProps) {
  const { addNotification } = useNotification();
  const [licenseForm, setLicenseForm] = useState({
    licenseKey: '',
    businessName: '',
    registrationNumber: ''
  });
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState('');

  if (!isOpen) return null;

  const handleActivation = async () => {
    if (!licenseForm.licenseKey.trim() || !licenseForm.businessName.trim()) {
      setActivationError('Please fill in all required fields');
      return;
    }

    setIsActivating(true);
    setActivationError('');

    try {
      const success = await AntiPiracyService.activateLicense(
        licenseForm.licenseKey,
        licenseForm.businessName,
        licenseForm.registrationNumber
      );

      if (success) {
        addNotification({
          title: 'License Activated',
          message: 'Software license activated successfully!',
          type: 'success'
        });
        onActivated();
        onClose();
      } else {
        setActivationError('License activation failed. Please check your license key and try again.');
      }
    } catch (error: any) {
      setActivationError(error.message || 'Activation failed. Please contact TIW support.');
    } finally {
      setIsActivating(false);
    }
  };

  const licenseInfo = AntiPiracyService.getLicenseInfo();
  const daysRemaining = AntiPiracyService.getDaysRemaining();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">BrainBox-RetailPlus V25</h2>
              <p className="text-gray-600">Software License Management</p>
            </div>
          </div>

          {/* Current License Status */}
          {licenseInfo && (
            <div className={`border rounded-lg p-4 mb-6 ${
              AntiPiracyService.isLicensed() ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                {AntiPiracyService.isLicensed() ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className="font-semibold text-gray-900">Current License Status</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Business:</p>
                  <p className="font-medium">{licenseInfo.businessName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Registration:</p>
                  <p className="font-medium">{licenseInfo.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">License Key:</p>
                  <p className="font-mono text-xs">{licenseInfo.licenseKey.substring(0, 16)}...</p>
                </div>
                <div>
                  <p className="text-gray-600">Days Remaining:</p>
                  <p className={`font-bold ${
                    daysRemaining > 30 ? 'text-green-600' : 
                    daysRemaining > 7 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {daysRemaining} days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* License Activation Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Key *
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={licenseForm.licenseKey}
                  onChange={(e) => setLicenseForm({...licenseForm, licenseKey: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Enter your license key"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={licenseForm.businessName}
                  onChange={(e) => setLicenseForm({...licenseForm, businessName: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your business name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Registration Number
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={licenseForm.registrationNumber}
                  onChange={(e) => setLicenseForm({...licenseForm, registrationNumber: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="RC123456 (optional)"
                />
              </div>
            </div>

            {activationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{activationError}</span>
              </div>
            )}
          </div>

          {/* TIW Contact Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-blue-900 mb-3">📞 Technology Innovation Worldwide (TIW)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-800">📧 Email: truetechitworldno1@gmail.com</p>
                <p className="text-blue-800">🌐 Website: www.tiw-global.com</p>
              </div>
              <div>
                <p className="text-blue-800">⏰ Response Time: 24 hours</p>
                <p className="text-blue-800">🛡️ License Support: Included</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleActivation}
              disabled={isActivating || !licenseForm.licenseKey.trim() || !licenseForm.businessName.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>{isActivating ? 'Activating...' : 'Activate License'}</span>
            </button>
          </div>

          {/* Copyright Notice */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © 2025 Truetech IT World - All Rights Reserved
            </p>
            <p className="text-xs text-gray-400">
              BrainBox-RetailPlus V25 is protected by copyright law and international treaties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}