import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Clock, Users, Share2, Copy, ExternalLink } from 'lucide-react';
import { PrivacyProtectionService } from '../services/PrivacyProtectionService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export default function DemoModeController() {
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotification();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [demoUrl, setDemoUrl] = useState('');

  useEffect(() => {
    const checkDemoStatus = () => {
      const isDemo = PrivacyProtectionService.isDemoModeActive();
      const remaining = PrivacyProtectionService.getDemoTimeRemaining();
      
      setIsDemoMode(isDemo);
      setTimeRemaining(remaining);
    };

    checkDemoStatus();
    const interval = setInterval(checkDemoStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleDemoMode = () => {
    if (isDemoMode) {
      PrivacyProtectionService.disableDemoMode();
    } else {
      PrivacyProtectionService.enableDemoMode();
      setDemoUrl(PrivacyProtectionService.createDemoURL());
    }
  };

  const copyDemoUrl = () => {
    const url = window.location.origin + '?demo=true';
    navigator.clipboard.writeText(url);
    addNotification({
      title: 'Demo URL Copied',
      message: 'Demo URL copied to clipboard - share with testers',
      type: 'success'
    });
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Only show for business owners and admins
  if (!hasPermission('system_settings')) return null;

  return (
    <div className="space-y-4">
      {/* Demo Mode Toggle */}
      <div className={`rounded-lg p-4 border-2 ${
        isDemoMode 
          ? 'bg-yellow-50 border-yellow-500' 
          : 'bg-blue-50 border-blue-500'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className={`h-6 w-6 ${isDemoMode ? 'text-yellow-600' : 'text-blue-600'}`} />
            <div>
              <h4 className={`font-semibold ${isDemoMode ? 'text-yellow-900' : 'text-blue-900'}`}>
                {isDemoMode ? '🎭 Demo Mode Active' : '🔒 Privacy Protection'}
              </h4>
              <p className={`text-sm ${isDemoMode ? 'text-yellow-700' : 'text-blue-700'}`}>
                {isDemoMode 
                  ? `Demo session expires in ${formatTime(timeRemaining)} - Real data protected`
                  : 'Enable demo mode to safely share with testers'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isDemoMode && (
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            )}
            <button
              onClick={toggleDemoMode}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isDemoMode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isDemoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{isDemoMode ? 'Exit Demo' : 'Enable Demo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Mode Features */}
      {isDemoMode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">🛡️ Privacy Protection Active:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ Real business data hidden</li>
              <li>✅ Demo data loaded for testing</li>
              <li>✅ Sensitive information protected</li>
              <li>✅ Original data backed up safely</li>
            </ul>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ 30-minute session limit</li>
              <li>✅ Auto-restore after expiry</li>
              <li>✅ Watermarks added</li>
              <li>✅ Safe for sharing with testers</li>
            </ul>
          </div>
        </div>
      )}

      {/* Share Demo Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Share Demo Version</h3>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">🛡️ Your Privacy is Protected:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Real business data is completely hidden</li>
                    <li>• Demo data is loaded for testing purposes</li>
                    <li>• Session automatically expires in 30 minutes</li>
                    <li>• Original data is safely backed up</li>
                    <li>• Testers cannot access your real information</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Demo URL to Share:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={window.location.origin + '?demo=true'}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <button
                      onClick={copyDemoUrl}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📋 Instructions for Testers:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Click the demo URL to access testing version</li>
                    <li>2. Use demo login: admin / admin</li>
                    <li>3. Test all features with demo data</li>
                    <li>4. Session expires automatically in 30 minutes</li>
                    <li>5. No real business data is accessible</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Demo Mode Limitations:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Changes made in demo mode are not saved</li>
                    <li>• Payment processing uses test mode only</li>
                    <li>• Email/SMS notifications are simulated</li>
                    <li>• Session expires after 30 minutes</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.open(window.location.origin + '?demo=true', '_blank');
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Demo in New Tab</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}