import React from 'react';
import { Menu, Bell, User, Wifi, WifiOff, Volume2, VolumeX, Keyboard, Monitor, Users, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAudio } from '../../contexts/AudioContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTenant } from '../../contexts/TenantContext';
import { AntiPiracyService } from '../../services/AntiPiracyService';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { 
    user, 
    logout, 
    activeSessions, 
    getUserSessions, 
    isImpersonating, 
    stopImpersonation, 
    canSwitchView, 
    currentView, 
    switchView 
  } = useAuth();
  const { isOnline } = useData();
  const { isAudioEnabled, toggleAudio } = useAudio();
  const { notifications } = useNotification();
  const { isAppOwner, getAllTenants } = useTenant();
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showSessions, setShowSessions] = React.useState(false);
  const [showViewSwitcher, setShowViewSwitcher] = React.useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const userSessions = user ? getUserSessions(user.id) : [];
  const totalActiveSessions = activeSessions.filter(s => s.isActive).length;
  const licenseInfo = AntiPiracyService.getLicenseInfo();
  const allTenants = getAllTenants();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 flex-shrink-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* View Switcher for Global Admin */}
          {canSwitchView && (
            <div className="relative">
              <button
                onClick={() => setShowViewSwitcher(!showViewSwitcher)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  currentView === 'basic' ? 'bg-blue-100 text-blue-800' :
                  currentView === 'pro' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}
              >
                {currentView.toUpperCase()} View
              </button>
              {showViewSwitcher && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-32 max-w-xs">
                  {['basic', 'pro', 'advanced'].map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        switchView(view as any);
                        setShowViewSwitcher(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        currentView === view ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Impersonation Banner */}
          {isImpersonating && (
            <div className="bg-red-100 border border-red-300 rounded-lg px-2 sm:px-3 py-1 flex items-center space-x-2 hidden sm:flex">
              <span className="text-red-800 text-sm font-medium">Impersonating: {user?.name}</span>
              <button
                onClick={stopImpersonation}
                className="text-red-600 hover:text-red-700 text-xs"
              >
                Stop
              </button>
            </div>
          )}

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg transition-colors touch-target ${
                isAudioEnabled 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-2 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 touch-target"
                title="Keyboard Shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </button>
              {showShortcuts && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 max-w-xs mobile-modal">
                  <h4 className="font-medium text-gray-900 mb-3">Audio Shortcuts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">F5</span>
                      <span className="text-gray-900">Customer Greeting</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">F5 x2</span>
                      <span className="text-gray-900">Thank You</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">F6</span>
                      <span className="text-gray-900">Goodbye</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">F7</span>
                      <span className="text-gray-900">Welcome</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">F8</span>
                      <span className="text-gray-900">Assistance</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">F9</span>
                      <span className="text-gray-900">Promotion</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">F12</span>
                        <span className="text-gray-900">Show Poppy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">F12 x2</span>
                        <span className="text-gray-900">Hide Poppy</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ctrl+Shift+T</span>
                        <span className="text-gray-900">TIW Access</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="p-2 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 relative"
                title="Active Sessions"
              >
                <Monitor className="h-4 w-4" />
                {totalActiveSessions > 1 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {totalActiveSessions}
                  </span>
                )}
              </button>
              {showSessions && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 mobile-modal">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Active Sessions ({totalActiveSessions})
                  </h4>
                  <div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                    {activeSessions.filter(s => s.isActive).map((session) => {
                      const sessionUser = user?.id === session.userId ? user : null;
                      return (
                        <div key={session.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{sessionUser?.name || `User ${session.userId.slice(-4)}`}</p>
                              <p className="text-xs text-gray-500 capitalize">{sessionUser?.role || 'unknown'}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600">Online</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Device:</span>
                              <span>{session.deviceInfo.device}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Browser:</span>
                              <span>{session.deviceInfo.browser}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Login:</span>
                              <span>{session.loginTime.toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last Active:</span>
                              <span>{session.lastActivity.toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 relative group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              <p className="text-xs text-blue-600 hidden lg:block">
                Licensed to: {licenseInfo?.businessName || 'Demo User'}
              </p>
              <p className="text-xs text-green-600 hidden lg:block">
                License: {licenseInfo?.licenseKey.substring(0, 8)}... | TIW
              </p>
            </div>
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 mobile-modal">
              <div className="p-2">
                <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                  Signed in as {user?.name}
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <User className="h-3 w-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}