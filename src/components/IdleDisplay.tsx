import React, { useState, useEffect } from 'react';
import { Clock, Building, Mail, Phone } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface IdleDisplayProps {
  isActive: boolean;
  onUserActivity: () => void;
}

export default function IdleDisplay({ isActive, onUserActivity }: IdleDisplayProps) {
  const { idleDisplayConfig, systemSettings } = useData();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isActive && idleDisplayConfig.content.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % idleDisplayConfig.content.length);
      }, idleDisplayConfig.rotationInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, idleDisplayConfig]);

  useEffect(() => {
    const handleActivity = () => {
      if (isActive) {
        onUserActivity();
      }
    };

    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('touchstart', handleActivity);

    return () => {
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, [isActive, onUserActivity]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-green-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-600 rounded-xl">
              <Building className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{systemSettings.businessName}</h1>
              <p className="text-green-600 font-medium">BrainBox-RetailPlus V25 - Point of Sale System</p>
            </div>
          </div>
          {idleDisplayConfig.showClock && (
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-green-600 font-medium">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-4xl">
          {idleDisplayConfig.type === 'custom_message' && (
            <div className="space-y-8">
              <h2 className="text-6xl font-bold text-gray-900 mb-4">
                {idleDisplayConfig.customMessage}
              </h2>
              <p className="text-2xl text-green-600 font-medium">
                Touch screen to continue
              </p>
            </div>
          )}

          {idleDisplayConfig.type === 'adverts' && idleDisplayConfig.content.length > 0 && (
            <div className="space-y-8 idle-slide-in">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-200">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  {idleDisplayConfig.content[currentSlide]}
                </h2>
                <p className="text-xl text-green-600">
                  Special offers available now!
                </p>
              </div>
            </div>
          )}

          {idleDisplayConfig.type === 'slides' && idleDisplayConfig.content.length > 0 && (
            <div className="space-y-8 idle-slide-in">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
                <h2 className="text-4xl font-bold mb-4">
                  {idleDisplayConfig.content[currentSlide]}
                </h2>
                <p className="text-xl opacity-90">
                  Promotional content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-green-200 p-4">
        <div className="flex items-center justify-between">
          {idleDisplayConfig.showBusinessInfo && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">{systemSettings.businessPhone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">{systemSettings.businessEmail}</span>
              </div>
            </div>
          )}
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {idleDisplayConfig.adminMessage}
            </p>
            <p className="text-xs text-green-600 font-medium">
              Support: {idleDisplayConfig.adminEmail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}