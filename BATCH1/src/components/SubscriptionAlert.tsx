import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Crown, X } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAudio } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionAlert() {
  const { currentSubscription, daysRemaining, isSubscriptionValid } = useSubscription();
  const { playSubscriptionAlert } = useAudio();
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState(0);

  useEffect(() => {
    const checkSubscription = () => {
      if (!currentSubscription) return;
      
      const now = new Date();
      // Show alert if subscription expires in 5 days or less
      if (daysRemaining <= 5 && daysRemaining >= 0) {
        setShowAlert(true);
        
        // Play audio alert once per day
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (now.getTime() - lastAlertTime > oneDayMs) {
          playSubscriptionAlert(daysRemaining);
          setLastAlertTime(now.getTime());
        }
      } else if (daysRemaining < 0) {
        setShowAlert(true);
        // Play expired alert once per day
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (now.getTime() - lastAlertTime > oneDayMs) {
          playSubscriptionAlert(0);
          setLastAlertTime(now.getTime());
        }
      }
    };

    checkSubscription();
    const interval = setInterval(checkSubscription, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentSubscription, daysRemaining, playSubscriptionAlert, lastAlertTime]);

  if (!showAlert) return null;

  const isExpired = daysRemaining < 0;

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full z-50 ${
      isExpired ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
    } border-l-4 rounded-lg shadow-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {isExpired ? (
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
          ) : (
            <Clock className="h-6 w-6 text-yellow-600 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className={`font-semibold ${
              isExpired ? 'text-red-900' : 'text-yellow-900'
            }`}>
              {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
            </h4>
            <p className={`text-sm mt-1 ${
              isExpired ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {isExpired 
                ? 'Your subscription has expired. Some features may be limited.'
                : `Your subscription expires in ${daysRemaining} days.`
              }
            </p>
            <div className="mt-3 flex space-x-2">
              <button className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                isExpired 
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
              onClick={() => window.location.href = '/subscription'}
              >
                <Crown className="h-3 w-3 inline mr-1" />
                Renew Now
              </button>
              <button
                onClick={() => setShowAlert(false)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAlert(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}