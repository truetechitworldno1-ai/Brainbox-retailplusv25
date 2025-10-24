import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Brain, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function VerifyEmailScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      if (!supabase) {
        setStatus('error');
        setMessage('Database connection not configured');
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
        return;
      }

      if (session) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ email_verified: true })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating email verification status:', updateError);
        }

        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');

        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Invalid verification link or session expired');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setStatus('error');
      setMessage('An unexpected error occurred during verification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
            status === 'verifying' ? 'bg-blue-600' :
            status === 'success' ? 'bg-green-600' :
            'bg-red-600'
          }`}>
            {status === 'verifying' && <Loader2 className="h-8 w-8 text-white animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-8 w-8 text-white" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-white" />}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'verifying' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          <p className="text-gray-600 mb-6">{message}</p>

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Your account is now active. You will be redirected to the login page shortly.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  The verification link may have expired or is invalid.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Return to Login
              </button>
            </div>
          )}

          {status === 'verifying' && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Please wait...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
