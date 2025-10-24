import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Brain, Volume2, Users, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAudio } from '../../contexts/AudioContext';
import SignupScreen from './SignupScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';

type ViewMode = 'login' | 'signup' | 'forgot-password';

export default function LoginScreen() {
  const { login, isFirstTimeSetup, completeFirstTimeSetup } = useAuth();
  const { playWelcomeMessage } = useAudio();
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // First-time setup state
  const [setupForm, setSetupForm] = useState({
    adminPassword: '',
    confirmAdminPassword: '',
    managerPassword: '',
    cashierPassword: ''
  });
  const [showSetupPasswords, setShowSetupPasswords] = useState(false);

  // Play welcome message on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      playWelcomeMessage();
    }, 1000);
    return () => clearTimeout(timer);
  }, [playWelcomeMessage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(formData.username, formData.password);
      if (!success) {
        setError('Invalid credentials. Please check your username and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstTimeSetup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (setupForm.adminPassword !== setupForm.confirmAdminPassword) {
      setError('Admin passwords do not match');
      return;
    }
    
    if (setupForm.adminPassword.length < 4) {
      setError('Admin password must be at least 4 characters');
      return;
    }

    try {
      completeFirstTimeSetup(setupForm.adminPassword, {
        manager: setupForm.managerPassword,
        cashier: setupForm.cashierPassword
      });
      
      // Auto-login as admin
      setFormData({
        username: 'admin',
        password: setupForm.adminPassword
      });
      
      // Play welcome message
      setTimeout(() => {
        playWelcomeMessage();
      }, 500);
      
    } catch (err) {
      setError('Setup failed. Please try again.');
    }
  };

  if (viewMode === 'signup') {
    return (
      <SignupScreen
        onSwitchToLogin={() => setViewMode('login')}
        onSignupSuccess={() => setViewMode('login')}
      />
    );
  }

  if (viewMode === 'forgot-password') {
    return <ForgotPasswordScreen onBack={() => setViewMode('login')} />;
  }

  if (isFirstTimeSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome to BrainBox-RetailPlus V25</h2>
            <p className="text-gray-600 mt-2">Comprehensive Point of Sale System</p>
            <p className="text-blue-600 text-sm font-medium">Powered by TIW</p>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Volume2 className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Audio Welcome Message Playing</span>
              </div>
              <p className="text-sm text-blue-700">
                "Welcome to BRAINBOX RETAILPLUS! We're here to serve you better."
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              🎉 Welcome! Create Your Admin Password
            </h3>
            <p className="text-sm text-green-700 mb-4">
              Set up your admin password to get started. Staff passwords are optional.
            </p>
          </div>

          <form onSubmit={handleFirstTimeSetup} className="space-y-6">
            {/* Admin Password */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-3">Administrator Account</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showSetupPasswords ? 'text' : 'password'}
                      value={setupForm.adminPassword}
                      onChange={(e) => setSetupForm({...setupForm, adminPassword: e.target.value})}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Create admin password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPasswords(!showSetupPasswords)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                    >
                      {showSetupPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Admin Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showSetupPasswords ? 'text' : 'password'}
                      value={setupForm.confirmAdminPassword}
                      onChange={(e) => setSetupForm({...setupForm, confirmAdminPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm admin password"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Passwords */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Default Staff Accounts (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager Password
                  </label>
                  <input
                    type={showSetupPasswords ? 'text' : 'password'}
                    value={setupForm.managerPassword}
                    onChange={(e) => setSetupForm({...setupForm, managerPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="manager123 (default)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cashier Password
                  </label>
                  <input
                    type={showSetupPasswords ? 'text' : 'password'}
                    value={setupForm.cashierPassword}
                    onChange={(e) => setSetupForm({...setupForm, cashierPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="cashier123 (default)"
                  />
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Leave blank to use default passwords. You can change these later in Employee Management.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!setupForm.adminPassword || setupForm.adminPassword !== setupForm.confirmAdminPassword}
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              Complete Setup & Start Using BrainBox
            </button>
          </form>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">🎉 Welcome Features:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• F5: Customer greeting • F7: Welcome • F8: Payment • F9: Loyalty</li>
              <li>• Manual entry for quick item addition</li>
              <li>• Loyalty point redemption (1 point = ₦10)</li>
              <li>• Complete POS with audio feedback</li>
              <li>• Gift expense & income reporting</li>
            </ul>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="text-center">
            <p className="text-white text-sm opacity-80">
              © 2025 BrainBox-RetailPlus V25 - Licensed Software | Technology Innovation Worldwide (TIW)
            </p>
            <p className="text-blue-200 text-xs opacity-70">
              📧 Licensed Support: truetechitworldno1@gmail.com | All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">BrainBox-RetailPlus V25</h2>
          <p className="text-gray-600 mt-2">Comprehensive Point of Sale System</p>
          <p className="text-blue-600 text-sm font-medium">Powered by TIW</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setViewMode('forgot-password')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.username || !formData.password}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setViewMode('signup')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up for free
              </button>
            </p>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Default Login Accounts:</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Admin:</span>
              <span className="font-mono">admin / admin</span>
            </div>
            <div className="flex justify-between">
              <span>Manager:</span>
              <span className="font-mono">manager / manager123</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="font-mono">cashier / cashier123</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">🎵 Audio & Shortcuts Ready</span>
          </div>
          <p className="text-xs text-green-700">
            F5: Greeting • F7: Welcome • F8: Payment • F9: Loyalty • Short audio for cashier focus
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="text-center">
          <p className="text-white text-sm opacity-80">
            © 2025 BrainBox-RetailPlus V25 - Comprehensive Point of Sale System
          </p>
          <p className="text-blue-200 text-xs opacity-70">
            📧 Support: truetechitworldno1@gmail.com (24hr response) | Truetech IT World
          </p>
        </div>
      </div>
    </div>
  );
}