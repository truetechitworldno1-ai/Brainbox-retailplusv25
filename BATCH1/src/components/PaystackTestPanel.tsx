import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, TestTube, DollarSign, Smartphone, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import PaystackService from '../services/PaystackService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export default function PaystackTestPanel() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [isTestingPayment, setIsTestingPayment] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [configStatus, setConfigStatus] = useState<any>({});
  const [testResults, setTestResults] = useState<{[key: string]: boolean | null}>({
    scriptLoaded: null,
    keysConfigured: null,
    paymentFlow: null,
    networkConnection: null
  });

  useEffect(() => {
    // Get Paystack configuration status
    const status = PaystackService.getConfigurationStatus();
    setConfigStatus(status);
    
    // Log configuration details for debugging
    console.log('Paystack Configuration Status:', {
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? 'Present' : 'Missing',
      secretKey: import.meta.env.VITE_PAYSTACK_SECRET_KEY ? 'Present' : 'Missing',
      publicKeyValue: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'Not set',
      secretKeyValue: import.meta.env.VITE_PAYSTACK_SECRET_KEY ? 'Set (hidden)' : 'Not set',
      isDemo: status.isDemo,
      environment: status.environment
    });
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const runPaystackTests = async () => {
    setTestResults({
      scriptLoaded: null,
      keysConfigured: null,
      paymentFlow: null,
      networkConnection: null
    });

    // Test 1: Check network connection
    setTimeout(() => {
      setTestResults(prev => ({ ...prev, networkConnection: isOnline }));
      
      if (!isOnline) {
        addNotification({
          title: 'Network Connection Required',
          message: 'Paystack requires internet connection for payments',
          type: 'warning'
        });
      }

      // Test 2: Check if Paystack script is loaded
      setTimeout(() => {
        const scriptLoaded = typeof window !== 'undefined' && !!window.PaystackPop;
        setTestResults(prev => ({ ...prev, scriptLoaded }));
        
        if (!scriptLoaded) {
          addNotification({
            title: 'Paystack Script Status',
            message: 'Paystack script loaded from index.html',
            type: scriptLoaded ? 'success' : 'warning'
          });
        }

        // Test 3: Check API keys
        setTimeout(() => {
          const keysConfigured = configStatus.isConfigured;
          setTestResults(prev => ({ ...prev, keysConfigured }));
          
          if (!keysConfigured) {
            addNotification({
              title: 'Paystack Keys Missing',
              message: 'Please configure your Paystack public and secret keys in environment variables.',
              type: 'warning'
            });
          }

          // Test 4: Payment flow readiness
          setTimeout(() => {
            const paymentReady = scriptLoaded && isOnline;
            setTestResults(prev => ({ ...prev, paymentFlow: paymentReady }));
            
            if (paymentReady) {
              addNotification({
                title: 'Paystack Ready',
                message: 'Payment system is ready for transactions',
                type: 'success'
              });
            } else {
              addNotification({
                title: 'Paystack Not Ready',
                message: 'Check network connection and script loading',
                type: 'error'
              });
            }
          }, 1000);
        }, 1000);
      }, 500);
    }, 500);
  };

  const testPaymentFlow = async () => {
    if (!user) return;
    
    if (!isOnline) {
      addNotification({
        title: 'Network Required',
        message: 'Internet connection required for payment testing',
        type: 'error'
      });
      return;
    }
    
    setIsTestingPayment(true);
    try {
      // Test with small amount (₦100)
      await PaystackService.processSubscriptionPayment(
        user.email,
        100, // ₦100 test amount
        'test',
        user.id,
        user.name
      );
      
      addNotification({
        title: 'Payment Test Successful',
        message: 'Paystack payment flow is working correctly',
        type: 'success'
      });
    } catch (error: any) {
      if (error.message === 'Payment cancelled by user') {
        addNotification({
          title: 'Payment Test Cancelled',
          message: 'Payment flow is working - test cancelled by user',
          type: 'info'
        });
      } else {
        addNotification({
          title: 'Payment Test Failed',
          message: error.message || 'Payment flow test failed',
          type: 'error'
        });
      }
    } finally {
      setIsTestingPayment(false);
    }
  };

  const getTestIcon = (result: boolean | null) => {
    if (result === null) return <TestTube className="h-4 w-4 text-gray-400" />;
    if (result === true) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getTestColor = (result: boolean | null) => {
    if (result === null) return 'text-gray-500';
    if (result === true) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Network Status */}
      <div className={`rounded-lg p-4 border ${
        isOnline 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          {isOnline ? (
            <Wifi className="h-6 w-6 text-green-600" />
          ) : (
            <WifiOff className="h-6 w-6 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${isOnline ? 'text-green-900' : 'text-red-900'}`}>
              {isOnline ? 'Online - Payment System Ready' : 'Offline - Payments Unavailable'}
            </p>
            <p className={`text-sm ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
              {isOnline 
                ? 'Internet connection active. Paystack payments available.'
                : 'No internet connection. Payments will be unavailable until online.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Paystack Test Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Paystack Payment System Test
          </h3>
          <button
            onClick={runPaystackTests}
            disabled={!isOnline}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>Run Tests</span>
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-3 mb-6">
          <div className={`flex items-center space-x-3 ${getTestColor(testResults.networkConnection)}`}>
            {getTestIcon(testResults.networkConnection)}
            <span className="text-sm">Network connection active</span>
          </div>
          <div className={`flex items-center space-x-3 ${getTestColor(testResults.scriptLoaded)}`}>
            {getTestIcon(testResults.scriptLoaded)}
            <span className="text-sm">Paystack script loaded</span>
          </div>
          <div className={`flex items-center space-x-3 ${getTestColor(testResults.keysConfigured)}`}>
            {getTestIcon(testResults.keysConfigured)}
            <span className="text-sm">API keys configured</span>
          </div>
          <div className={`flex items-center space-x-3 ${getTestColor(testResults.paymentFlow)}`}>
            {getTestIcon(testResults.paymentFlow)}
            <span className="text-sm">Payment flow ready</span>
          </div>
        </div>

        {/* Configuration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Configuration Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Network:</span>
                <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline ? '✅ Online' : '❌ Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Paystack Script:</span>
                <span className={typeof window !== 'undefined' && window.PaystackPop ? 'text-green-600' : 'text-red-600'}>
                  {typeof window !== 'undefined' && window.PaystackPop ? '✅ Loaded' : '❌ Not Loaded'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Public Key:</span>
                <span className={configStatus.publicKeyPresent ? 'text-green-600' : 'text-red-600'}>
                  {configStatus.publicKeyPresent ? '✅ Configured' : '❌ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Key Preview:</span>
                <span className="text-blue-600 font-mono text-xs">
                  {configStatus.publicKeyPreview}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="text-blue-600">
                  {configStatus.environment}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Test Payment</h4>
            <p className="text-sm text-gray-600 mb-3">
              Test the payment flow with a small amount (₦100)
            </p>
            <button
              onClick={testPaymentFlow}
              disabled={isTestingPayment || !window.PaystackPop || !isOnline}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
            >
              <DollarSign className="h-4 w-4" />
              <span>{isTestingPayment ? 'Testing...' : 'Test ₦100 Payment'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Payment Features */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2 flex items-center">
            <Smartphone className="h-4 w-4 mr-2" />
            📱 Mobile Payment Features:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Works on all mobile devices and tablets</li>
              <li>• Supports card payments, bank transfers, USSD</li>
              <li>• Automatic receipt generation</li>
              <li>• Real-time payment verification</li>
            </ul>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Secure payment processing</li>
              <li>• Multiple payment methods</li>
              <li>• Instant transaction confirmation</li>
              <li>• Works with all Nigerian banks</li>
            </ul>
          </div>
        </div>

        {/* Offline Payment Notice */}
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Offline Mode Active</p>
                <p className="text-sm text-yellow-700">
                  Paystack payments are not available offline. Cash and other offline payment methods can still be used.
                  Payment testing will be available when internet connection is restored.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Paystack Configuration Help */}
        {!configStatus.isConfigured && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Paystack Keys Required</p>
                <p className="text-sm text-red-700">
                  To process payments, you need to configure your Paystack API keys.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-red-900 mb-2">🔑 Current Configuration Status:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700">Public Key:</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY && import.meta.env.VITE_PAYSTACK_PUBLIC_KEY !== 'pk_test_demo_key'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY 
                        ? (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY === 'pk_test_demo_key' 
                           ? 'DEMO KEY (Not Real)' 
                           : `${import.meta.env.VITE_PAYSTACK_PUBLIC_KEY.substring(0, 12)}...`)
                        : 'NOT SET'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-700">Secret Key:</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      import.meta.env.VITE_PAYSTACK_SECRET_KEY && import.meta.env.VITE_PAYSTACK_SECRET_KEY !== 'sk_test_demo_key'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {import.meta.env.VITE_PAYSTACK_SECRET_KEY 
                        ? (import.meta.env.VITE_PAYSTACK_SECRET_KEY === 'sk_test_demo_key' 
                           ? 'DEMO KEY (Not Real)' 
                           : 'SET (Hidden)')
                        : 'NOT SET'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-700">Environment:</span>
                    <span className="font-medium text-red-800">{configStatus.environment || 'Demo'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-red-900 mb-2">📋 How to get your Paystack keys:</h4>
                <ol className="text-sm text-red-800 space-y-1">
                  <li>1. Go to <a href="https://dashboard.paystack.com" target="_blank" className="underline font-medium">dashboard.paystack.com</a></li>
                  <li>2. Sign up or log in to your account</li>
                  <li>3. Navigate to Settings → API Keys</li>
                  <li>4. Copy your Public Key (starts with pk_test_ or pk_live_)</li>
                  <li>5. Copy your Secret Key (starts with sk_test_ or sk_live_)</li>
                  <li>6. Click "Connect to Supabase" button in top-right to add keys</li>
                  <li>7. Or create .env file with keys and restart</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Environment Variables Needed:</h4>
                <div className="space-y-2 text-sm text-yellow-800">
                  <div className="bg-white rounded p-2 font-mono text-xs">
                    <div>VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here</div>
                    <div>VITE_PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here</div>
                  </div>
                  <p className="text-xs">Add these to your .env file in the project root, then restart the app.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paystack Configuration Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💳 Paystack Setup Instructions:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Create account at <a href="https://paystack.com" target="_blank" className="underline">paystack.com</a></li>
            <li>2. Get your API keys from Paystack Dashboard</li>
            <li>3. Add keys to your .env file or use "Connect to Supabase" button</li>
            <li>4. Test with small amounts first</li>
            <li>5. Switch to live keys for production</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Quick Setup:</strong> Click the "Connect to Supabase" button in the top-right corner 
              to automatically configure your Paystack keys along with your database connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}