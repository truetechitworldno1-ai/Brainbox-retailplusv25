import { Product, ExpiryAlert } from '../types';

export class ExpiryAlertService {
  // Check for expiring products and generate alerts
  static checkExpiringProducts(products: Product[]): ExpiryAlert[] {
    const alerts: ExpiryAlert[] = [];
    const today = new Date();
    
    products.forEach(product => {
      if (product.expiryDate) {
        const daysUntilExpiry = Math.ceil(
          (product.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let alertLevel: 'warning' | 'critical' | 'expired' = 'warning';
        
        if (daysUntilExpiry < 0) {
          alertLevel = 'expired';
        } else if (daysUntilExpiry <= 3) {
          alertLevel = 'critical';
        } else if (daysUntilExpiry <= 7) {
          alertLevel = 'warning';
        }
        
        if (daysUntilExpiry <= 7) {
          alerts.push({
            id: `${product.id}-expiry`,
            productId: product.id,
            productName: product.name,
            expiryDate: product.expiryDate,
            daysUntilExpiry,
            alertLevel
          });
        }
      }
    });
    
    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  // Generate audio message for expiry alerts
  static generateExpiryMessage(alert: ExpiryAlert): string {
    switch (alert.alertLevel) {
      case 'expired':
        return `Urgent: ${alert.productName} has expired. Please remove from inventory immediately.`;
      case 'critical':
        return `Critical alert: ${alert.productName} expires in ${alert.daysUntilExpiry} days. Take immediate action.`;
      case 'warning':
        return `Warning: ${alert.productName} expires in ${alert.daysUntilExpiry} days. Please plan accordingly.`;
      default:
        return `Product expiry notification for ${alert.productName}.`;
    }
  }

  // Play audio alert for inventory officers
  static playExpiryAlert(alert: ExpiryAlert): void {
    const message = this.generateExpiryMessage(alert);
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    speechSynthesis.speak(utterance);
  }
}