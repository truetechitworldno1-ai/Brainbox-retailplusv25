import { supabase } from '../lib/supabase';

interface LicenseInfo {
  id: string;
  businessName: string;
  registrationNumber: string;
  licenseKey: string;
  activationDate: Date;
  expiryDate: Date;
  maxDevices: number;
  currentDevices: number;
  isActive: boolean;
  hardwareFingerprint: string;
  lastValidation: Date;
  violations: number;
}

interface DeviceFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  colorDepth: number;
  pixelRatio: number;
  touchSupport: boolean;
  hash: string;
}

export class AntiPiracyService {
  private static readonly LICENSE_SERVER = 'https://truetechitworld.com';
  private static readonly VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_VIOLATIONS = 3;
  private static readonly WATERMARK_TEXT = 'BrainBox-RetailPlus V25 © 2025 Truetech IT World';
  
  private static licenseInfo: LicenseInfo | null = null;
  private static deviceFingerprint: DeviceFingerprint | null = null;
  private static validationTimer: NodeJS.Timeout | null = null;
  private static isValidated = false;

  // Initialize anti-piracy protection
  static async initialize(): Promise<boolean> {
    try {
      console.log('🔒 Initializing BrainBox-RetailPlus V25 Anti-Piracy Protection...');
      
      // Generate device fingerprint
      this.deviceFingerprint = await this.generateDeviceFingerprint();
      
      // Check for existing license
      const savedLicense = localStorage.getItem('brainbox_license');
      if (savedLicense) {
        try {
          this.licenseInfo = JSON.parse(savedLicense);
          this.licenseInfo!.activationDate = new Date(this.licenseInfo!.activationDate);
          this.licenseInfo!.expiryDate = new Date(this.licenseInfo!.expiryDate);
          this.licenseInfo!.lastValidation = new Date(this.licenseInfo!.lastValidation);
        } catch (error) {
          console.warn('Invalid license data, clearing...');
          localStorage.removeItem('brainbox_license');
          this.licenseInfo = null;
        }
      }

      // Validate license
      const isValid = await this.validateLicense();
      
      if (isValid) {
        // Start periodic validation
        this.startPeriodicValidation();
        
        // Add watermarks and protection
        this.addWatermarks();
        this.protectConsole();
        this.protectDevTools();
        this.addCopyrightNotices();
        
        console.log('✅ BrainBox-RetailPlus V25 License Validated - Genuine Software');
        return true;
      } else {
        console.error('❌ License Validation Failed - Unauthorized Copy Detected');
        this.showPiracyWarning();
        return false;
      }
    } catch (error) {
      console.error('🚨 Anti-Piracy System Error:', error);
      this.showPiracyWarning();
      return false;
    }
  }

  // Generate unique device fingerprint
  private static async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('BrainBox-RetailPlus V25 Fingerprint', 2, 2);
    
    const fingerprint: DeviceFingerprint = {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      hash: ''
    };

    // Generate hash of all fingerprint data
    const fingerprintString = JSON.stringify(fingerprint);
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString + canvas.toDataURL());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    fingerprint.hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return fingerprint;
  }

  // Validate license with server
  private static async validateLicense(): Promise<boolean> {
    try {
      // Check if license exists
      if (!this.licenseInfo) {
        console.warn('⚠️ No license found - Running in demo mode');
        return this.createDemoLicense();
      }

      // Check expiry
      if (new Date() > this.licenseInfo.expiryDate) {
        console.error('❌ License expired on', this.licenseInfo.expiryDate);
        this.recordViolation('License expired');
        return false;
      }

      // Validate device fingerprint
      if (this.licenseInfo.hardwareFingerprint !== this.deviceFingerprint!.hash) {
        console.warn('⚠️ Hardware fingerprint mismatch - possible unauthorized transfer');
        this.recordViolation('Hardware fingerprint mismatch');
        
        // Allow some tolerance for minor hardware changes
        if (this.licenseInfo.violations < this.MAX_VIOLATIONS) {
          return true;
        } else {
          return false;
        }
      }

      // Validate with license server (if online)
      if (navigator.onLine) {
        try {
          const response = await fetch(`${this.LICENSE_SERVER}/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-License-Key': this.licenseInfo.licenseKey,
              'X-Device-Fingerprint': this.deviceFingerprint!.hash
            },
            body: JSON.stringify({
              licenseKey: this.licenseInfo.licenseKey,
              deviceFingerprint: this.deviceFingerprint!.hash,
              businessName: this.licenseInfo.businessName,
              version: '2.5.0'
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.valid) {
              this.licenseInfo.lastValidation = new Date();
              this.saveLicense();
              this.isValidated = true;
              return true;
            } else {
              console.error('❌ Server validation failed:', result.reason);
              this.recordViolation(`Server validation failed: ${result.reason}`);
              return false;
            }
          } else {
            console.warn('⚠️ License server unreachable, using cached validation');
            // Allow offline operation for up to 7 days
            const daysSinceLastValidation = (new Date().getTime() - this.licenseInfo.lastValidation.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceLastValidation <= 7;
          }
        } catch (error) {
          console.warn('⚠️ License server error, using offline validation:', error);
          return true; // Allow offline operation
        }
      }

      this.isValidated = true;
      return true;
    } catch (error) {
      console.error('🚨 License validation error:', error);
      return false;
    }
  }

  // Create demo license for trial/development
  private static createDemoLicense(): boolean {
    const demoLicense: LicenseInfo = {
      id: crypto.randomUUID(),
      businessName: 'Demo Store',
      registrationNumber: 'DEMO123456',
      licenseKey: 'DEMO-' + crypto.randomUUID(),
      activationDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxDevices: 1,
      currentDevices: 1,
      isActive: true,
      hardwareFingerprint: this.deviceFingerprint!.hash,
      lastValidation: new Date(),
      violations: 0
    };

    this.licenseInfo = demoLicense;
    this.saveLicense();
    console.log('✅ Demo license created - 30 days trial');
    return true;
  }

  // Record license violation
  private static recordViolation(reason: string): void {
    if (this.licenseInfo) {
      this.licenseInfo.violations += 1;
      this.saveLicense();
      
      console.error(`🚨 License Violation #${this.licenseInfo.violations}: ${reason}`);
      
      // Send violation report to TIW servers
      this.reportViolation(reason);
      
      if (this.licenseInfo.violations >= this.MAX_VIOLATIONS) {
        this.showPiracyWarning();
        this.disableApplication();
      }
    }
  }

  // Report violation to TIW servers
  private static async reportViolation(reason: string): Promise<void> {
    try {
      await fetch(`${this.LICENSE_SERVER}/violation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: this.licenseInfo?.licenseKey,
          deviceFingerprint: this.deviceFingerprint?.hash,
          reason,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.warn('Failed to report violation:', error);
    }
  }

  // Show piracy warning
  private static showPiracyWarning(): void {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(220, 38, 38, 0.95);
      color: white;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      text-align: center;
      backdrop-filter: blur(10px);
    `;

    warningDiv.innerHTML = `
      <div style="max-width: 600px; padding: 40px; background: rgba(0,0,0,0.8); border-radius: 20px; border: 2px solid #fff;">
        <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: #ff6b6b;">⚠️ UNAUTHORIZED SOFTWARE DETECTED</h1>
        <h2 style="font-size: 1.5rem; margin-bottom: 30px;">BrainBox-RetailPlus V25</h2>
        
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="font-size: 1.1rem; margin-bottom: 15px;">🚨 This software is protected by copyright law.</p>
          <p style="margin-bottom: 15px;">Unauthorized use, distribution, or modification is strictly prohibited.</p>
          <p style="margin-bottom: 15px;">License violations have been detected and reported to Truetech IT World.</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #ffd700; margin-bottom: 15px;">🏢 Get Your Genuine License:</h3>
          <p style="margin-bottom: 10px;">📧 Email: truetechitworldno1@gmail.com</p>
          <p style="margin-bottom: 10px;">📞 Phone: +234-xxx-xxx-xxxx</p>
          <p style="margin-bottom: 10px;">🌐 Contact: truetechitworldno1@gmail.com</p>
          <p style="font-size: 0.9rem; color: #ccc;">24-hour response time for licensing inquiries</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 20px 0;">
          <p style="font-size: 0.9rem; color: #ffd700;">© 2025 Truetech IT World</p>
          <p style="font-size: 0.8rem; color: #ccc;">All rights reserved. Patent pending.</p>
        </div>
        
        <p style="font-size: 0.8rem; color: #ff9999; margin-top: 20px;">
          Violation ID: ${crypto.randomUUID()}<br>
          Timestamp: ${new Date().toISOString()}<br>
          Device: ${this.deviceFingerprint?.hash.substring(0, 16)}...
        </p>
      </div>
    `;

    document.body.appendChild(warningDiv);

    // Disable right-click and keyboard shortcuts
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || 
          (e.ctrlKey && e.shiftKey && e.key === 'C') || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
      }
    });
  }

  // Disable application functionality
  private static disableApplication(): void {
    // Disable all interactive elements
    const elements = document.querySelectorAll('button, input, select, textarea, a');
    elements.forEach(el => {
      (el as HTMLElement).style.pointerEvents = 'none';
      (el as HTMLElement).style.opacity = '0.3';
    });

    // Clear all data
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to piracy warning
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 5000);
  }

  // Add watermarks throughout the application
  private static addWatermarks(): void {
    // Add minimal watermark that doesn't interfere with content
    const watermark = document.createElement('div');
    watermark.style.cssText = `
      position: fixed;
      bottom: 5px;
      right: 5px;
      font-size: 10px;
      color: rgba(0, 0, 0, 0.3);
      z-index: 1;
      pointer-events: none;
      user-select: none;
      font-family: Arial, sans-serif;
    `;
    watermark.textContent = '© 2025 TIW';
    document.body.appendChild(watermark);

    // Add copyright notice to footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      text-align: center;
      padding: 5px;
      font-size: 10px;
      z-index: 1;
      font-family: Arial, sans-serif;
      display: none;
    `;
    footer.innerHTML = `
      © 2025 BrainBox-RetailPlus V25 - Licensed to: ${this.licenseInfo?.businessName || 'Demo User'} |
      License: ${this.licenseInfo?.licenseKey.substring(0, 8)}... |
      Truetech IT World |
      truetechitworldno1@gmail.com
    `;
    // Only show footer on specific pages to avoid interference
    if (window.location.pathname === '/settings') {
      document.body.appendChild(footer);
    }
  }

  // Protect console from tampering
  private static protectConsole(): void {
    // Override console methods to add copyright notices
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog('🔒 BrainBox-RetailPlus V25 © 2025 TIW |', ...args);
    };

    console.error = (...args) => {
      originalError('🔒 BrainBox-RetailPlus V25 © 2025 TIW |', ...args);
    };

    console.warn = (...args) => {
      originalWarn('🔒 BrainBox-RetailPlus V25 © 2025 TIW |', ...args);
    };

    // Add copyright message to console
    setTimeout(() => {
      console.log(`
%c🔒 BrainBox-RetailPlus V25 - Comprehensive Point of Sale System
%c© 2025 Technology Innovation Worldwide (TIW)
%cLicensed Software - Unauthorized use is prohibited
%cSupport: truetechitworldno1@gmail.com
%cLicense: ${this.licenseInfo?.licenseKey.substring(0, 12)}...
      `, 
      'color: #1e40af; font-size: 16px; font-weight: bold;',
      'color: #dc2626; font-size: 14px; font-weight: bold;',
      'color: #ea580c; font-size: 12px;',
      'color: #059669; font-size: 12px;',
      'color: #7c3aed; font-size: 12px; font-family: monospace;'
      );
    }, 1000);
  }

  // Protect against developer tools
  private static protectDevTools(): void {
    // Detect developer tools opening
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          console.warn('🚨 Developer tools detected - License validation required');
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Disable common developer shortcuts
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        console.warn('🚨 Developer tools access blocked - Licensed software');
        return false;
      }
    });

    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Disable text selection on sensitive elements
    document.addEventListener('selectstart', (e) => {
      if ((e.target as HTMLElement).closest('.protected')) {
        e.preventDefault();
        return false;
      }
    });
  }

  // Add copyright notices throughout the app
  private static addCopyrightNotices(): void {
    // Add meta tags
    const metaCopyright = document.createElement('meta');
    metaCopyright.name = 'copyright';
    metaCopyright.content = '© 2025 Technology Innovation Worldwide (TIW) - BrainBox-RetailPlus V25';
    document.head.appendChild(metaCopyright);

    const metaAuthor = document.createElement('meta');
    metaAuthor.name = 'author';
    metaAuthor.content = 'Truetech IT World';
    document.head.appendChild(metaAuthor);

    // Add hidden copyright div
    const hiddenCopyright = document.createElement('div');
    hiddenCopyright.style.display = 'none';
    hiddenCopyright.innerHTML = `
      <!-- 
      BrainBox-RetailPlus V25 - Comprehensive Point of Sale System
      © 2025 Truetech IT World
      Licensed Software - All Rights Reserved
      Contact: truetechitworldno1@gmail.com
      License: ${this.licenseInfo?.licenseKey}
      Device: ${this.deviceFingerprint?.hash}
      -->
    `;
    document.body.appendChild(hiddenCopyright);
  }

  // Start periodic license validation
  private static startPeriodicValidation(): void {
    this.validationTimer = setInterval(async () => {
      const isValid = await this.validateLicense();
      if (!isValid) {
        this.showPiracyWarning();
        this.disableApplication();
      }
    }, this.VALIDATION_INTERVAL);
  }

  // Save license to localStorage
  private static saveLicense(): void {
    if (this.licenseInfo) {
      localStorage.setItem('brainbox_license', JSON.stringify(this.licenseInfo));
    }
  }

  // Get license information
  static getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }

  // Check if software is properly licensed
  static isLicensed(): boolean {
    return this.isValidated && this.licenseInfo !== null && 
           new Date() <= this.licenseInfo.expiryDate &&
           this.licenseInfo.violations < this.MAX_VIOLATIONS;
  }

  // Get days remaining in license
  static getDaysRemaining(): number {
    if (!this.licenseInfo) return 0;
    const now = new Date();
    const daysRemaining = Math.ceil((this.licenseInfo.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  }

  // Activate license with key
  static async activateLicense(licenseKey: string, businessName: string, registrationNumber: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.LICENSE_SERVER}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          businessName,
          registrationNumber,
          deviceFingerprint: this.deviceFingerprint!.hash,
          version: '2.5.0'
        })
      });

      if (response.ok) {
        const licenseData = await response.json();
        
        this.licenseInfo = {
          id: licenseData.id,
          businessName,
          registrationNumber,
          licenseKey,
          activationDate: new Date(),
          expiryDate: new Date(licenseData.expiryDate),
          maxDevices: licenseData.maxDevices,
          currentDevices: 1,
          isActive: true,
          hardwareFingerprint: this.deviceFingerprint!.hash,
          lastValidation: new Date(),
          violations: 0
        };

        this.saveLicense();
        console.log('✅ License activated successfully');
        return true;
      } else {
        console.error('❌ License activation failed');
        return false;
      }
    } catch (error) {
      console.error('🚨 License activation error:', error);
      return false;
    }
  }

  // Deactivate license (for legitimate transfers)
  static async deactivateLicense(): Promise<boolean> {
    try {
      if (!this.licenseInfo) return false;

      const response = await fetch(`${this.LICENSE_SERVER}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: this.licenseInfo.licenseKey,
          deviceFingerprint: this.deviceFingerprint!.hash
        })
      });

      if (response.ok) {
        localStorage.removeItem('brainbox_license');
        this.licenseInfo = null;
        console.log('✅ License deactivated successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('License deactivation error:', error);
      return false;
    }
  }

  // Check for code tampering
  static detectTampering(): boolean {
    try {
      // Skip tampering detection in development environment
      if (import.meta.env.DEV) {
        return false;
      }

      // Check for common debugging/tampering indicators
      const indicators = [
        () => window.hasOwnProperty('webkitStorageInfo'),
        () => window.hasOwnProperty('chrome'),
        () => navigator.webdriver,
        () => window.outerWidth === 0,
        () => window.outerHeight === 0,
        () => /HeadlessChrome/.test(navigator.userAgent)
      ];

      const suspiciousCount = indicators.filter(check => check()).length;
      
      if (suspiciousCount > 2) {
        this.recordViolation('Tampering detected');
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  // Monitor for unauthorized modifications
  static startTamperMonitoring(): void {
    // Check for tampering every 30 seconds
    setInterval(() => {
      if (this.detectTampering()) {
        this.showPiracyWarning();
      }
    }, 30000);

    // Monitor for unauthorized script injection
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-authorized')) {
              console.warn('🚨 Unauthorized script injection detected');
              this.recordViolation('Script injection detected');
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Generate license report for TIW
  static generateLicenseReport(): string {
    return JSON.stringify({
      software: 'BrainBox-RetailPlus V25',
      version: '2.5.0',
      vendor: 'Truetech IT World',
      license: this.licenseInfo,
      device: this.deviceFingerprint,
      validation: {
        isLicensed: this.isLicensed(),
        daysRemaining: this.getDaysRemaining(),
        lastValidation: this.licenseInfo?.lastValidation,
        violations: this.licenseInfo?.violations || 0
      },
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  // Cleanup on application exit
  static cleanup(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }
  }
}

// Anti-piracy protection disabled for development
// Production initialization disabled for development environment
if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ANTI_PIRACY === 'true') {
  AntiPiracyService.initialize().then(isValid => {
    if (isValid) {
      AntiPiracyService.startTamperMonitoring();
    }
  });
  
  window.addEventListener('beforeunload', () => {
    AntiPiracyService.cleanup();
  });
}