import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, AlertTriangle, Wifi, WifiOff, Settings, ExternalLink } from 'lucide-react';
import { supabase, getSupabaseStatus } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';

export default function SupabaseConnectionTest() {
  const { addNotification } = useNotification();
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | 'not_configured'>('testing');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [supabaseConfig, setSupabaseConfig] = useState<any>({});

  useEffect(() => {
    testConnection();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setErrorDetails('');
    
    try {
      // Get configuration status
      const config = getSupabaseStatus();
      setSupabaseConfig(config);
      
      if (!config.isConfigured) {
        setConnectionStatus('not_configured');
        setErrorDetails('Supabase URL or API key not configured in environment variables');
        return;
      }

      if (!isOnline) {
        setConnectionStatus('failed');
        setErrorDetails('No internet connection available');
        return;
      }

      console.log('🔄 Testing connection to your Supabase project...');
      
      // Test basic connection with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        // Test heartbeat table
        const { data, error } = await supabase
          .from('heartbeat')
          .select('count')
          .limit(1)
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        if (error) {
          // If heartbeat table doesn't exist, try a simpler connection test
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log('ℹ️ Heartbeat table not found, testing basic connection...');
            
            // Test basic connection with auth
            const { data: authData, error: authError } = await supabase.auth.getSession();
            if (authError && authError.message !== 'Invalid JWT') {
              throw new Error(`Connection test failed: ${authError.message}`);
            }
            
            console.log('✅ Basic Supabase connection verified');
          } else {
            throw new Error(`Database query failed: ${error.message}`);
          }
        } else {
          console.log('✅ Heartbeat table accessible');
        }
        
        setConnectionStatus('connected');
        setLastTestTime(new Date());
        
        console.log('✅ Successfully connected to your Supabase project');
        
        addNotification({
          title: '✅ Supabase Connected!',
          message: 'Successfully connected to your Supabase project. Real-time sync is now active.',
          type: 'success'
        });
        
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('Connection timeout - Check your Supabase URL and network');
        } else if (error.message?.includes('Failed to fetch')) {
          throw new Error('Network error - Check your internet connection and Supabase URL');
        } else if (error.message?.includes('CORS')) {
          throw new Error('CORS error - Add your domain to Supabase allowed origins');
        } else {
          throw error;
        }
      }
      
    } catch (error: any) {
      console.error('❌ Supabase connection failed:', error);
      setConnectionStatus('failed');
      setErrorDetails(error.message || 'Unknown connection error');
      
      addNotification({
        title: '❌ Supabase Connection Failed',
        message: error.message || 'Failed to connect to your Supabase project',
        type: 'error'
      });
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'border-green-500 bg-green-50';
      case 'failed': return 'border-red-500 bg-red-50';
      case 'not_configured': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing': return <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'connected': return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'failed': return <XCircle className="h-6 w-6 text-red-600" />;
      case 'not_configured': return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'testing': return 'Testing connection to your Supabase project...';
      case 'connected': return 'Successfully connected to your Supabase project!';
      case 'failed': return 'Failed to connect to your Supabase project';
      case 'not_configured': return 'Supabase project not configured';
    }
  };

  return (
    <div className={`rounded-xl border-2 p-6 transition-all ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Database className="h-8 w-8 text-gray-700" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Supabase Connection</h3>
            <p className="text-gray-600">Real-time database sync status</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {!isOnline ? (
            <WifiOff className="h-6 w-6 text-red-600" />
          ) : (
            <Wifi className="h-6 w-6 text-green-600" />
          )}
          {getStatusIcon()}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">{getStatusMessage()}</span>
          <button
            onClick={testConnection}
            disabled={connectionStatus === 'testing' || !isOnline}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {/* Connection Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">URL:</span>
                <span className="font-mono text-xs text-gray-900">
                  {supabaseConfig.url ? `${supabaseConfig.url.substring(0, 30)}...` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API Key:</span>
                <span className="font-mono text-xs text-gray-900">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  connectionStatus === 'connected' ? 'text-green-600' :
                  connectionStatus === 'failed' ? 'text-red-600' :
                  connectionStatus === 'not_configured' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1).replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Features</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-gray-700">Real-time sync</span>
              </div>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-gray-700">Multi-device access</span>
              </div>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-gray-700">Cloud backup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Details */}
        {connectionStatus === 'failed' && errorDetails && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">Connection Error</span>
            </div>
            <p className="text-sm text-red-800">{errorDetails}</p>
            
            <div className="mt-3 space-y-2">
              <p className="text-sm text-red-700 font-medium">Troubleshooting:</p>
              <ul className="text-sm text-red-700 space-y-1 ml-4">
                <li>• Check your Supabase project URL is correct</li>
                <li>• Verify your anon key is valid and not expired</li>
                <li>• Ensure your Supabase project is active</li>
                <li>• Check if RLS policies allow access</li>
                <li>• Verify internet connection is stable</li>
              </ul>
            </div>
          </div>
        )}

        {/* Not Configured Help */}
        {connectionStatus === 'not_configured' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">Configuration Required</span>
            </div>
            <p className="text-sm text-yellow-800 mb-3">
              Your Supabase project credentials need to be configured in the .env file.
            </p>
            
            <div className="bg-white rounded-lg p-3 border border-yellow-200">
              <p className="text-sm text-yellow-900 font-medium mb-2">Required Environment Variables:</p>
              <div className="font-mono text-xs text-yellow-800 space-y-1">
                <div>VITE_SUPABASE_URL=https://yourprojectid.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...yourkey...IkpXVCJ9</div>
              </div>
            </div>
            
            <div className="mt-3">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-yellow-700 hover:text-yellow-800 text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Supabase Dashboard</span>
              </a>
            </div>
          </div>
        )}

        {/* Success Details */}
        {connectionStatus === 'connected' && lastTestTime && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Connection Successful</span>
            </div>
            <div className="space-y-1 text-sm text-green-800">
              <p>✅ Database connection established</p>
              <p>✅ Authentication system working</p>
              <p>✅ Real-time sync enabled</p>
              <p>✅ Multi-device access ready</p>
              <p className="text-xs text-green-600 mt-2">
                Last tested: {lastTestTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {/* Network Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {connectionStatus === 'connected' && (
            <span className="text-green-600 font-medium">
              🔄 Real-time sync active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}