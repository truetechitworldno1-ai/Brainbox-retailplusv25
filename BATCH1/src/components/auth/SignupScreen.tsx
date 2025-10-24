import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail, Building2, Phone, Brain, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { AuthService } from '../../services/AuthService';

interface SignupScreenProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: () => void;
}

export default function SignupScreen({ onSwitchToLogin, onSignupSuccess }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    businessName: '',
    phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const passwordStrength = AuthService.getPasswordStrength(formData.password);

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.strength) {
      case 'weak':
        return 'bg-red-500';
      case 'fair':
        return 'bg-orange-500';
      case 'good':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPasswordStrengthWidth = () => {
    return `${(passwordStrength.score / 6) * 100}%`;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const passwordValidation = AuthService.validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      setIsLoading(false);
      return;
    }

    try {
      const result = await AuthService.signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        businessName: formData.businessName,
        phone: formData.phone
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSignupSuccess();
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to <strong>{formData.email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Please check your email and click the verification link to activate your account.
              </p>
            </div>
            <button
              onClick={onSwitchToLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
          <p className="text-gray-600 mt-2">Start your 14-day free trial today</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Store"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+234 XXX XXX XXXX"
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
                placeholder="Create a strong password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Password Strength:</span>
                  <span className={`font-medium ${
                    passwordStrength.strength === 'weak' ? 'text-red-600' :
                    passwordStrength.strength === 'fair' ? 'text-orange-600' :
                    passwordStrength.strength === 'good' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                    style={{ width: getPasswordStrengthWidth() }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <XCircle className="h-4 w-4 mr-1" />
                Passwords do not match
              </div>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="mt-2 flex items-center text-green-600 text-sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Passwords match
              </div>
            )}
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Privacy Policy
              </a>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !acceptedTerms}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What you get with your free trial:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 14 days free access to all Basic plan features</li>
            <li>• Full POS system with inventory management</li>
            <li>• Customer management and loyalty tracking</li>
            <li>• Basic accounting and reporting</li>
            <li>• No credit card required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
