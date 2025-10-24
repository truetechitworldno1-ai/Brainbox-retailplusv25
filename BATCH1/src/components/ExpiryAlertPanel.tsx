import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Package, Volume2 } from 'lucide-react';
import { ExpiryAlertService } from '../services/ExpiryAlertService';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { ExpiryAlert } from '../types';

export default function ExpiryAlertPanel() {
  const { products } = useData();
  const { user } = useAuth();
  const { playBestSellerAlert } = useAudio();
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [lastLowStockAlert, setLastLowStockAlert] = useState<number>(0);

  // Determine if user should receive alerts based on role
  const shouldReceiveAlerts = React.useMemo(() => {
    if (!user?.role) return false;
    const alertRoles = ['global_admin', 'business_owner', 'manager', 'inventory_officer', 'supervisor'];
    return alertRoles.includes(user.role);
  }, [user?.role]);

  // Calculate low stock best sellers
  const lowStockBestSellers = React.useMemo(() => {
    return products
      .filter(product => product.quantity <= 10) // Low stock threshold
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)) // Sort by sales count
      .slice(0, 5); // Top 5 best sellers that are low in stock
  }, [products]);

  useEffect(() => {
    // Check for expiring products every minute
    const checkExpiry = () => {
      const alerts = ExpiryAlertService.checkExpiringProducts(products);
      setExpiryAlerts(alerts);

      // Play audio alerts for inventory officers (every 30 minutes to avoid spam)
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (
        shouldReceiveAlerts &&
        alerts.length > 0 &&
        now - lastAlertTime > thirtyMinutes
      ) {
        const criticalAlerts = alerts.filter(a => a.alertLevel === 'critical' || a.alertLevel === 'expired');
        if (criticalAlerts.length > 0) {
          ExpiryAlertService.playExpiryAlert(criticalAlerts[0]);
          setLastAlertTime(now);
        }
      }

      // Play low stock alerts for best sellers (every 45 minutes)
      const fortyFiveMinutes = 45 * 60 * 1000;
      if (
        shouldReceiveAlerts &&
        lowStockBestSellers.length > 0 &&
        now - lastLowStockAlert > fortyFiveMinutes
      ) {
        // Play alert for best selling items that are low in stock
        playBestSellerAlert();
        
        // Speak specific low stock alert
        const bestSellerName = lowStockBestSellers[0].name;
        const utterance = new SpeechSynthesisUtterance(
          `Urgent inventory alert: ${bestSellerName}, one of our best selling items, is running low on stock. Current stock: ${lowStockBestSellers[0].stock}. Please reorder immediately.`
        );
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
        
        setLastLowStockAlert(now);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [products, lastAlertTime]);

  if (expiryAlerts.length === 0) return null;

  const criticalAlerts = expiryAlerts.filter(a => a.alertLevel === 'critical' || a.alertLevel === 'expired');
  const warningAlerts = expiryAlerts.filter(a => a.alertLevel === 'warning');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-orange-600" />
          Product Expiry Alerts
        </h3>
        <button
          onClick={() => {
            if (criticalAlerts.length > 0) {
              ExpiryAlertService.playExpiryAlert(criticalAlerts[0]);
            }
          }}
          className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
        >
          <Volume2 className="h-4 w-4" />
          <span>Play Alert</span>
        </button>
      </div>

      <div className="space-y-3">
        {/* Critical/Expired Alerts */}
        {criticalAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-l-4 ${
              alert.alertLevel === 'expired'
                ? 'bg-red-50 border-red-500'
                : 'bg-orange-50 border-orange-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className={`h-5 w-5 ${
                  alert.alertLevel === 'expired' ? 'text-red-600' : 'text-orange-600'
                }`} />
                <div>
                  <p className={`font-medium ${
                    alert.alertLevel === 'expired' ? 'text-red-900' : 'text-orange-900'
                  }`}>
                    {alert.productName}
                  </p>
                  <p className={`text-sm ${
                    alert.alertLevel === 'expired' ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    {alert.alertLevel === 'expired' 
                      ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
                      : `Expires in ${alert.daysUntilExpiry} days`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs ${
                  alert.alertLevel === 'expired' ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {alert.expiryDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Warning Alerts */}
        {warningAlerts.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900 text-sm">{alert.productName}</p>
                  <p className="text-xs text-yellow-700">Expires in {alert.daysUntilExpiry} days</p>
                </div>
              </div>
              <p className="text-xs text-yellow-600">{alert.expiryDate.toLocaleDateString()}</p>
            </div>
          </div>
        ))}

        {warningAlerts.length > 3 && (
          <p className="text-sm text-gray-500 text-center">
            +{warningAlerts.length - 3} more items expiring soon
          </p>
        )}
      </div>
    </div>
  );
}