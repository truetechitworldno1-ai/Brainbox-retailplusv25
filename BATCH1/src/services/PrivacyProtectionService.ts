export class PrivacyProtectionService {
  private static readonly DEMO_MODE_KEY = 'brainbox_demo_mode';
  private static readonly DEMO_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly OWNER_PASSWORD = 'owner2025!';
  private static demoModeActive = false;
  private static demoStartTime: number | null = null;
  private static originalData: any = {};

  // Initialize privacy protection
  static initialize() {
    this.checkDemoMode();
    this.setupDemoModeDetection();
    this.protectSensitiveData();
    this.addWatermarks();
    
    console.log('🔒 Privacy Protection Active - Demo Mode Available');
  }

  // Enable demo mode for testing
  static enableDemoMode(): void {
    this.demoModeActive = true;
    this.demoStartTime = Date.now();
    
    // Backup original data
    this.backupOriginalData();
    
    // Replace with demo data
    this.loadDemoData();
    
    // Set demo mode flag
    localStorage.setItem(this.DEMO_MODE_KEY, JSON.stringify({
      active: true,
      startTime: this.demoStartTime,
      expiresAt: this.demoStartTime + this.DEMO_SESSION_DURATION
    }));

    // Add demo mode indicator
    this.showDemoModeIndicator();
    
    // Auto-disable after session duration
    setTimeout(() => {
      this.disableDemoMode();
    }, this.DEMO_SESSION_DURATION);

    console.log('🎭 Demo Mode Enabled - 30 minute session started');
  }

  // Disable demo mode and restore original data
  static disableDemoMode(): void {
    this.demoModeActive = false;
    this.demoStartTime = null;
    
    // Restore original data
    this.restoreOriginalData();
    
    // Clear demo mode flag
    localStorage.removeItem(this.DEMO_MODE_KEY);
    
    // Remove demo indicator
    this.removeDemoModeIndicator();
    
    // Force page reload to ensure clean state
    window.location.reload();
    
    console.log('🔒 Demo Mode Disabled - Original data restored');
  }

  // Check if demo mode should be active
  private static checkDemoMode(): void {
    const demoData = localStorage.getItem(this.DEMO_MODE_KEY);
    if (demoData) {
      const demo = JSON.parse(demoData);
      const now = Date.now();
      
      if (demo.active && now < demo.expiresAt) {
        this.demoModeActive = true;
        this.demoStartTime = demo.startTime;
        this.showDemoModeIndicator();
        
        // Set auto-disable timer for remaining time
        const remainingTime = demo.expiresAt - now;
        setTimeout(() => {
          this.disableDemoMode();
        }, remainingTime);
      } else {
        // Expired demo mode
        this.disableDemoMode();
      }
    }
  }

  // Setup demo mode detection via URL or keyboard
  private static setupDemoModeDetection(): void {
    // Check URL for demo parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
      this.enableDemoMode();
    }

    // Keyboard shortcut for owner: Ctrl+Shift+D+E+M+O
    let keySequence = '';
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey) {
        keySequence += e.key.toLowerCase();
        
        if (keySequence.includes('demo')) {
          const password = prompt('Enter owner password to toggle demo mode:');
          if (password === this.OWNER_PASSWORD) {
            if (this.demoModeActive) {
              this.disableDemoMode();
            } else {
              this.enableDemoMode();
            }
          }
          keySequence = '';
        }
        
        // Reset sequence after 3 seconds
        setTimeout(() => {
          keySequence = '';
        }, 3000);
      }
    });
  }

  // Backup original data before demo mode
  private static backupOriginalData(): void {
    this.originalData = {
      products: localStorage.getItem('brainbox_products'),
      customers: localStorage.getItem('brainbox_customers'),
      suppliers: localStorage.getItem('brainbox_suppliers'),
      sales: localStorage.getItem('brainbox_sales'),
      purchases: localStorage.getItem('brainbox_purchases'),
      employees: localStorage.getItem('brainbox_employees'),
      systemSettings: localStorage.getItem('brainbox_system_settings'),
      companies: localStorage.getItem('brainbox_companies')
    };
  }

  // Restore original data after demo mode
  private static restoreOriginalData(): void {
    Object.entries(this.originalData).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(`brainbox_${key}`, value);
      } else {
        localStorage.removeItem(`brainbox_${key}`);
      }
    });
  }

  // Load safe demo data
  private static loadDemoData(): void {
    const demoData = {
      products: [
        {
          id: 'demo-1',
          name: 'Demo Coffee',
          category: 'Beverages',
          brand: 'Demo Brand',
          barcodes: ['1111111111111'],
          costPrice: 1000,
          sellingPrice: 1500,
          stock: 100,
          minStock: 10,
          maxStock: 200,
          unit: 'piece',
          isActive: true,
          hasVariations: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'demo-2',
          name: 'Demo Snacks',
          category: 'Food',
          brand: 'Demo Brand',
          barcodes: ['2222222222222'],
          costPrice: 500,
          sellingPrice: 800,
          stock: 50,
          minStock: 5,
          maxStock: 100,
          unit: 'piece',
          isActive: true,
          hasVariations: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      customers: [
        {
          id: 'demo-customer-1',
          name: 'Demo Customer',
          email: 'demo@customer.com',
          phone: '+234-800-DEMO-123',
          address: 'Demo Address, Demo City',
          loyaltyCard: {
            cardNumber: 'DEMO001',
            points: 50,
            totalSpent: 5000,
            rewardPercentage: 2,
            tier: 'bronze',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true
          },
          totalPurchases: 3,
          lastPurchase: new Date(),
          isActive: true,
          createdAt: new Date()
        }
      ],
      suppliers: [
        {
          id: 'demo-supplier-1',
          name: 'Demo Supplier Ltd',
          contact: 'Demo Contact',
          email: 'demo@supplier.com',
          phone: '+234-800-SUPPLIER',
          address: 'Demo Supplier Address',
          paymentTerms: 'Net 30 days',
          totalItemsReceived: 0,
          totalAmountReceived: 0,
          totalAmountPaid: 0,
          balance: 0,
          isActive: true,
          createdAt: new Date()
        }
      ],
      sales: [],
      systemSettings: {
        businessName: 'Demo Store (Testing Mode)',
        businessAddress: 'Demo Address for Testing',
        businessPhone: '+234-800-DEMO-STORE',
        businessEmail: 'demo@store.com'
      }
    };

    // Save demo data
    Object.entries(demoData).forEach(([key, value]) => {
      localStorage.setItem(`brainbox_${key}`, JSON.stringify(value));
    });
  }

  // Show demo mode indicator
  private static showDemoModeIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'demo-mode-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
      color: white;
      text-align: center;
      padding: 8px;
      font-weight: bold;
      z-index: 10000;
      animation: rainbow 3s linear infinite;
      font-size: 14px;
    `;
    
    indicator.innerHTML = `
      <style>
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      </style>
      🎭 DEMO MODE ACTIVE - Testing Data Only | Session expires in <span id="demo-timer">30:00</span> | Real data protected
    `;
    
    document.body.appendChild(indicator);
    
    // Update timer
    this.startDemoTimer();
  }

  // Remove demo mode indicator
  private static removeDemoModeIndicator(): void {
    const indicator = document.getElementById('demo-mode-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Start demo mode countdown timer
  private static startDemoTimer(): void {
    const updateTimer = () => {
      if (!this.demoStartTime) return;
      
      const elapsed = Date.now() - this.demoStartTime;
      const remaining = Math.max(0, this.DEMO_SESSION_DURATION - elapsed);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      const timerElement = document.getElementById('demo-timer');
      if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      if (remaining > 0) {
        setTimeout(updateTimer, 1000);
      }
    };
    
    updateTimer();
  }

  // Protect sensitive data from being viewed
  private static protectSensitiveData(): void {
    // Override console methods to hide sensitive data
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      const filteredArgs = args.map(arg => 
        typeof arg === 'string' && this.containsSensitiveData(arg) 
          ? '[PROTECTED DATA]' 
          : arg
      );
      originalLog(...filteredArgs);
    };

    console.error = (...args) => {
      const filteredArgs = args.map(arg => 
        typeof arg === 'string' && this.containsSensitiveData(arg) 
          ? '[PROTECTED DATA]' 
          : arg
      );
      originalError(...filteredArgs);
    };

    // Protect localStorage access
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key: string, value: string) {
      if (PrivacyProtectionService.demoModeActive && key.startsWith('brainbox_')) {
        // In demo mode, don't overwrite real data
        return originalSetItem.call(this, `demo_${key}`, value);
      }
      return originalSetItem.call(this, key, value);
    };
  }

  // Check if data contains sensitive information
  private static containsSensitiveData(data: string): boolean {
    const sensitivePatterns = [
      /pk_live_\w+/,
      /sk_live_\w+/,
      /pk_test_\w+/,
      /sk_test_\w+/,
      /password/i,
      /secret/i,
      /token/i,
      /api[_-]?key/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(data));
  }

  // Add privacy watermarks
  private static addWatermarks(): void {
    // Add minimal watermark that doesn't interfere with UI
    if (this.isDemoModeActive()) {
      const watermark = document.createElement('div');
      watermark.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        font-size: 10px;
        color: rgba(0, 0, 0, 0.3);
        z-index: 1;
        pointer-events: none;
        user-select: none;
        font-family: Arial, sans-serif;
      `;
      watermark.textContent = 'DEMO MODE';
      document.body.appendChild(watermark);
    }
  }

  // Get demo mode status
  static isDemoModeActive(): boolean {
    return this.demoModeActive;
  }

  // Get remaining demo time
  static getDemoTimeRemaining(): number {
    if (!this.demoStartTime) return 0;
    const elapsed = Date.now() - this.demoStartTime;
    return Math.max(0, this.DEMO_SESSION_DURATION - elapsed);
  }

  // Create shareable demo URL
  static createDemoURL(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?demo=true`;
  }

  // Sanitize data for demo sharing
  static sanitizeDataForDemo(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'apiKey', 'secretKey', 'token', 'privateKey',
      'businessRegistration', 'taxId', 'bankAccount', 'creditCard'
    ];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[PROTECTED]';
      }
    });
    
    // Sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeDataForDemo(sanitized[key]);
      }
    });
    
    return sanitized;
  }
}

// Initialize privacy protection only in production
if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_PRIVACY_PROTECTION === 'true') {
  PrivacyProtectionService.initialize();
}