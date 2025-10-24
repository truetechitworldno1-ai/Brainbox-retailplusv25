import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, FolderSync as Sync, Clock, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useTenant } from '../contexts/TenantContext';

export default function OfflineIndicator() {
  const { isOnline, pendingSync, lastSyncTime, syncNow } = useOfflineSync();
  const { currentTenant, isAppOwner } = useTenant();
  const [showDetails, setShowDetails] = React.useState(false);

  // Only show when there are actual problems that need attention
  const shouldShow = (!isOnline && showDetails) || (pendingSync > 5) || showDetails;
  
  // Don't show anything when everything is working fine
  if (!shouldShow) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 border-l-4 rounded-lg shadow-lg p-3 max-w-xs transition-all duration-300 ${
        isOnline ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
      }`}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Cloud className="h-5 w-5 text-green-600" />
        ) : (
          <CloudOff className="h-5 w-5 text-red-600" />
        )}
        <div className="flex-1">
          <h4 className={`font-medium text-sm ${isOnline ? 'text-green-900' : 'text-red-900'}`}>
            {isOnline ? 'Online Mode' : 'Offline Mode'}
          </h4>
          <p className={`text-xs ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
            {isOnline ? 'Connected - Real-time sync active' : 'Working offline - data will sync when online'}
          </p>
          
          {pendingSync > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              <Sync className="h-3 w-3 text-orange-600" />
              <span className="text-xs text-orange-700">
                {pendingSync} items pending sync
              </span>
              <button
                onClick={syncNow}
                className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded hover:bg-orange-200 transition-colors"
              >
                Sync Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}