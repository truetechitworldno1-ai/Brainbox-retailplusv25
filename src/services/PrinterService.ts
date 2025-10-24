import { PrinterConfig } from '../types';

export class PrinterService {
  private static printers: PrinterConfig[] = [];
  private static bluetoothDevices: BluetoothDevice[] = [];
  private static networkPrinters: any[] = [];
  private static usbPrinters: any[] = [];

  // Initialize printer service
  static initialize() {
    const savedPrinters = localStorage.getItem('brainbox_printers');
    if (savedPrinters) {
      this.printers = JSON.parse(savedPrinters);
    }
    
    // Auto-detect available printers
    this.detectAvailablePrinters();
  }

  // Auto-detect all available printers
  static async detectAvailablePrinters() {
    try {
      // Detect network printers
      await this.detectNetworkPrinters();
      
      // Detect USB printers
      await this.detectUSBPrinters();
      
      // Detect Bluetooth printers
      await this.detectBluetoothPrinters();
      
      // Detect shared printers
      await this.detectSharedPrinters();
      
      console.log('Printer detection completed');
    } catch (error) {
      console.warn('Printer detection failed:', error);
    }
  }

  // Detect USB printers using Web USB API
  static async detectUSBPrinters() {
    try {
      if (!navigator.usb) {
        console.warn('Web USB API not supported');
        return;
      }

      const devices = await navigator.usb.getDevices();
      this.usbPrinters = devices.filter(device => {
        // Common printer vendor IDs
        const printerVendorIds = [
          0x04b8, // Epson
          0x0519, // Star Micronics
          0x1504, // Citizen
          0x0bda, // Bixolon
          0x0a5f, // Zebra
          0x03f0, // HP
          0x04a9, // Canon
          0x04f9, // Brother
        ];
        return printerVendorIds.includes(device.vendorId);
      });

      console.log('USB printers detected:', this.usbPrinters.length);
    } catch (error) {
      console.warn('USB printer detection failed:', error);
    }
  }

  // Detect network printers by scanning common IP ranges
  static async detectNetworkPrinters() {
    try {
      console.log('🔍 Scanning for wireless printers in company network...');
      const networkRanges = this.getNetworkRanges();
      const detectedPrinters = [];

      // Scan common printer ports
      const printerPorts = [9100, 515, 631, 80, 443, 8080, 8000];
      
      // Scan multiple network ranges for better coverage
      for (const networkRange of networkRanges) {
        console.log(`📡 Scanning network range: ${networkRange}.x`);
        
        // Use Promise.all for faster scanning
        const scanPromises = [];
        
        for (let i = 1; i <= 254; i++) {
          const ip = `${networkRange}.${i}`;
          
          for (const port of printerPorts) {
            scanPromises.push(this.scanPrinterIP(ip, port));
          }
        }
        
        const results = await Promise.allSettled(scanPromises);
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            detectedPrinters.push(result.value);
          }
        });
      }

      // Add common printer IP addresses
      const commonPrinterIPs = [
        '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.200',
        '192.168.0.100', '192.168.0.101', '192.168.0.102', '192.168.0.200',
        '10.0.0.100', '10.0.0.101', '10.0.0.102', '10.0.0.200',
        '172.16.0.100', '172.16.0.101', '172.16.0.102'
      ];
      
      for (const ip of commonPrinterIPs) {
        for (const port of printerPorts) {
          try {
            const printer = await this.scanPrinterIP(ip, port);
            if (printer) {
              detectedPrinters.push(printer);
            }
          } catch (error) {
            // Ignore failures
          }
        }
      }

      this.networkPrinters = detectedPrinters;
      console.log(`✅ Found ${detectedPrinters.length} wireless printers`);
    } catch (error) {
      console.warn('Network printer detection failed:', error);
    }
  }

  // Scan single printer IP
  private static async scanPrinterIP(ip: string, port: number): Promise<any | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      
      // Try to connect to printer
      const response = await fetch(`http://${ip}:${port}`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors'
      });
      
      clearTimeout(timeoutId);
      
      console.log(`🖨️ Wireless printer found at ${ip}:${port}`);
      
      return {
        ip,
        port,
        type: 'wireless',
        name: `Wireless Printer (${ip})`,
        brand: 'Unknown',
        model: 'Network Printer',
        status: 'available',
        connectionType: 'wifi'
      };
    } catch (error) {
      return null;
    }
  }

  // Get multiple network ranges for scanning
  private static getNetworkRanges(): string[] {
    return [
      '192.168.1',   // Most common home/office
      '192.168.0',   // Common router default
      '10.0.0',      // Corporate networks
      '172.16.0',    // Private networks
      '192.168.2',   // Secondary networks
      '192.168.10'   // Office networks
    ];
  }

  // Detect shared printers in network
  static async detectSharedPrinters() {
    try {
      console.log('🔍 Scanning for shared network printers...');
      const sharedPrinters = [];
      
      // Common shared printer discovery
      const sharedPrinterIPs = [
        '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.200',
        '192.168.0.100', '192.168.0.101', '192.168.0.102', '192.168.0.200',
        '10.0.0.100', '10.0.0.101', '10.0.0.102', '10.0.0.200'
      ];

      for (const ip of sharedPrinterIPs) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000);
          
          await fetch(`http://${ip}:9100`, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors'
          });
          
          clearTimeout(timeoutId);
          
          sharedPrinters.push({
            ip,
            port: 9100,
            type: 'shared_network',
            name: `Shared Printer (${ip})`,
            status: 'available'
          });
          
          console.log(`🖨️ Shared printer found at ${ip}:9100`);
        } catch (error) {
          // Ignore failed connections
        }
      }
      
      this.networkPrinters = [...this.networkPrinters, ...sharedPrinters];
      return sharedPrinters;
    } catch (error) {
      console.error('Shared printer detection failed:', error);
      return [];
    }
  }

  // Detect Bluetooth printers
  static async detectBluetoothPrinters() {
    try {
      if (!navigator.bluetooth) {
        console.warn('Web Bluetooth API not supported');
        return;
      }

      // Don't auto-scan, just prepare for manual scanning
      console.log('Bluetooth API available for manual scanning');
    } catch (error) {
      console.warn('Bluetooth detection failed:', error);
    }
  }

  // Scan for Bluetooth printers (manual trigger)
  static async scanBluetoothPrinters(): Promise<BluetoothDevice[]> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth not supported in this browser');
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Serial Port Profile
          { namePrefix: 'POS' },
          { namePrefix: 'Printer' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'Receipt' },
          { namePrefix: 'Epson' },
          { namePrefix: 'Star' },
          { namePrefix: 'Citizen' },
          { namePrefix: 'Bixolon' },
          { namePrefix: 'HP' },
          { namePrefix: 'Canon' },
          { namePrefix: 'Brother' },
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      if (!this.bluetoothDevices.find(d => d.id === device.id)) {
        this.bluetoothDevices.push(device);
      }
      
      return this.bluetoothDevices;
    } catch (error) {
      console.error('Bluetooth scan failed:', error);
      throw error;
    }
  }

  // Add new printer configuration
  static addPrinter(printerConfig: Omit<PrinterConfig, 'id' | 'createdAt' | 'updatedAt'>): PrinterConfig {
    const newPrinter: PrinterConfig = {
      ...printerConfig,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.printers.push(newPrinter);
    this.savePrinters();
    return newPrinter;
  }

  // Update printer configuration
  static updatePrinter(id: string, updates: Partial<PrinterConfig>): void {
    const index = this.printers.findIndex(p => p.id === id);
    if (index >= 0) {
      this.printers[index] = {
        ...this.printers[index],
        ...updates,
        updatedAt: new Date()
      };
      this.savePrinters();
    }
  }

  // Remove printer
  static removePrinter(id: string): void {
    this.printers = this.printers.filter(p => p.id !== id);
    this.savePrinters();
  }

  // Get all configured printers
  static getAllPrinters(): PrinterConfig[] {
    return this.printers;
  }

  // Get printers by type
  static getPrintersByType(type: 'thermal' | 'inkjet' | 'laser' | 'dot_matrix'): PrinterConfig[] {
    return this.printers.filter(p => p.type === type && p.isActive);
  }

  // Get printers by connection type
  static getPrintersByConnection(connectionType: 'usb' | 'ethernet' | 'wifi' | 'bluetooth' | 'serial' | 'parallel'): PrinterConfig[] {
    return this.printers.filter(p => p.connectionType === connectionType && p.isActive);
  }

  // Get default printer
  static getDefaultPrinter(): PrinterConfig | null {
    return this.printers.find(p => p.isDefault && p.isActive) || null;
  }

  // Get printer by ID
  static getPrinterById(id: string): PrinterConfig | null {
    return this.printers.find(p => p.id === id) || null;
  }

  // Test printer connection
  static async testPrinter(printer: PrinterConfig): Promise<boolean> {
    try {
      console.log(`Testing printer: ${printer.name} (${printer.type} - ${printer.connectionType})`);
      
      switch (printer.connectionType) {
        case 'usb':
          return this.testUSBConnection(printer);
        case 'ethernet':
        case 'wifi':
          return this.testNetworkConnection(printer);
        case 'bluetooth':
          return this.testBluetoothConnection(printer);
        case 'serial':
          return this.testSerialConnection(printer);
        case 'parallel':
          return this.testParallelConnection(printer);
        default:
          console.warn('Unknown connection type:', printer.connectionType);
          return false;
      }
    } catch (error) {
      console.error('Printer test failed:', error);
      return false;
    }
  }

  // Print receipt with enhanced support for all printer types
  static async printReceipt(printer: PrinterConfig, receiptData: any): Promise<boolean> {
    try {
      const receiptContent = this.generateReceiptContent(printer, receiptData);
      
      switch (printer.connectionType) {
        case 'usb':
          return this.printViaUSB(printer, receiptContent);
        case 'ethernet':
        case 'wifi':
          return this.printViaNetwork(printer, receiptContent);
        case 'bluetooth':
          return this.printViaBluetooth(printer, receiptContent);
        case 'serial':
          return this.printViaSerial(printer, receiptContent);
        case 'parallel':
          return this.printViaParallel(printer, receiptContent);
        default:
          return this.printViaSystemDefault(printer, receiptContent);
      }
    } catch (error) {
      console.error('Print failed:', error);
      return false;
    }
  }

  // Generate receipt content optimized for different printer types
  private static generateReceiptContent(printer: PrinterConfig, receiptData: any): string {
    const { businessInfo, receiptLayout } = printer;
    let content = '';

    // Printer-specific initialization commands
    switch (printer.type) {
      case 'thermal':
        content += this.getThermalCommands(printer);
        break;
      case 'inkjet':
      case 'laser':
        content += this.getStandardCommands(printer);
        break;
      case 'dot_matrix':
        content += this.getDotMatrixCommands(printer);
        break;
    }

    // Business header
    if (receiptLayout.showLogo && businessInfo.logo) {
      content += `[LOGO: ${businessInfo.logo}]\n`;
    }

    if (receiptLayout.showBusinessInfo) {
      content += `${businessInfo.companyName}\n`;
      content += `${businessInfo.address}\n`;
      if (businessInfo.city && businessInfo.state) {
        content += `${businessInfo.city}, ${businessInfo.state} ${businessInfo.zipCode}\n`;
      }
      content += `${businessInfo.phone}\n`;
      if (businessInfo.email) content += `${businessInfo.email}\n`;
      if (businessInfo.website) content += `${businessInfo.website}\n`;
    }

    // Tax information
    if (receiptLayout.showTaxInfo) {
      if (businessInfo.registrationNumber) {
        content += `RC: ${businessInfo.registrationNumber}\n`;
      }
      if (businessInfo.taxId) {
        content += `TIN: ${businessInfo.taxId}\n`;
      }
    }

    // Header text
    if (receiptLayout.headerText) {
      content += `\n${receiptLayout.headerText}\n`;
    }

    content += '\n' + this.getSeparatorLine(printer) + '\n';

    // Transaction details
    if (receiptLayout.showDateTime) {
      content += `Date: ${receiptData.timestamp.toLocaleDateString()}\n`;
      content += `Time: ${receiptData.timestamp.toLocaleTimeString()}\n`;
    }
    content += `Receipt #: ${receiptData.receiptNumber}\n`;
    
    if (receiptLayout.showCashier) {
      content += `Cashier: ${receiptData.cashierName || 'System'}\n`;
    }
    
    if (receiptLayout.showCustomerInfo && receiptData.customer) {
      content += `Customer: ${receiptData.customer.name}\n`;
      if (receiptLayout.showLoyaltyInfo && receiptData.customer.loyaltyCard) {
        content += `Loyalty: ${receiptData.customer.loyaltyCard.cardNumber}\n`;
      }
    }

    content += '\n' + this.getSeparatorLine(printer, '-') + '\n';

    // Items with proper formatting for printer width
    const maxWidth = this.getPrinterWidth(printer);
    receiptData.items.forEach((item: any) => {
      const itemName = item.productName.substring(0, receiptLayout.itemNameWidth);
      const price = `₦${item.total.toLocaleString()}`;
      const qtyPrice = `${item.quantity} x ₦${item.unitPrice.toLocaleString()}`;
      
      content += `${itemName}\n`;
      
      if (receiptLayout.priceAlignment === 'right') {
        const spaces = Math.max(1, maxWidth - qtyPrice.length - price.length);
        content += qtyPrice + ' '.repeat(spaces) + price;
      } else {
        content += `${qtyPrice} = ${price}`;
      }
      content += '\n';
    });

    content += '\n' + this.getSeparatorLine(printer, '-') + '\n';

    // Totals
    content += this.formatLine('Subtotal:', `₦${receiptData.subtotal.toLocaleString()}`, maxWidth);
    if (receiptData.discount > 0) {
      content += this.formatLine('Discount:', `-₦${receiptData.discount.toLocaleString()}`, maxWidth);
    }
    if (receiptData.tax > 0) {
      content += this.formatLine('Tax:', `₦${receiptData.tax.toLocaleString()}`, maxWidth);
    }
    content += this.formatLine('TOTAL:', `₦${receiptData.total.toLocaleString()}`, maxWidth, true);

    content += '\n' + this.getSeparatorLine(printer, '-') + '\n';

    // Payment information
    content += `Payment: ${receiptData.paymentMethod.toUpperCase()}\n`;
    if (receiptData.paymentDetails.length > 1) {
      receiptData.paymentDetails.forEach((detail: any) => {
        content += `${detail.method.toUpperCase()}: ₦${detail.amount.toLocaleString()}\n`;
      });
    }

    // Loyalty points
    if (receiptLayout.showLoyaltyInfo && receiptData.loyaltyPointsEarned > 0) {
      content += `\nPoints Earned: ${receiptData.loyaltyPointsEarned}\n`;
      if (receiptData.customer) {
        content += `Total Points: ${receiptData.customer.loyaltyCard.points + receiptData.loyaltyPointsEarned}\n`;
      }
    }

    // Footer text
    if (receiptLayout.footerText) {
      content += `\n${receiptLayout.footerText}\n`;
    }

    // Permanent watermark
    content += '\n' + this.getSeparatorLine(printer) + '\n';
    content += this.centerText('Powered by BrainBox-RetailPlus V25', maxWidth) + '\n';
    content += this.centerText('© 2025 Truetech IT World', maxWidth) + '\n';
    content += this.centerText('truetechitworldno1@gmail.com', maxWidth) + '\n';

    // Printer-specific ending commands
    content += this.getPrinterEndCommands(printer);

    return content;
  }

  // Get thermal printer commands
  private static getThermalCommands(printer: PrinterConfig): string {
    let commands = '';
    commands += '\x1B\x40'; // Initialize printer
    commands += '\x1B\x61\x01'; // Center alignment
    
    // Set print density
    switch (printer.printDensity) {
      case 'light':
        commands += '\x1D\x7C\x00';
        break;
      case 'dark':
        commands += '\x1D\x7C\x02';
        break;
      default:
        commands += '\x1D\x7C\x01'; // Medium
    }
    
    // Set print speed
    switch (printer.printSpeed) {
      case 'slow':
        commands += '\x1B\x73\x00';
        break;
      case 'fast':
        commands += '\x1B\x73\x02';
        break;
      default:
        commands += '\x1B\x73\x01'; // Medium
    }
    
    return commands;
  }

  // Get standard printer commands (inkjet/laser)
  private static getStandardCommands(printer: PrinterConfig): string {
    // Standard PCL or PostScript commands
    return '%!PS-Adobe-3.0\n'; // PostScript header
  }

  // Get dot matrix printer commands
  private static getDotMatrixCommands(printer: PrinterConfig): string {
    let commands = '';
    commands += '\x1B\x40'; // Initialize
    commands += '\x1B\x50'; // Select 10 CPI
    return commands;
  }

  // Get separator line based on printer width
  private static getSeparatorLine(printer: PrinterConfig, char: string = '='): string {
    const width = this.getPrinterWidth(printer);
    return char.repeat(width);
  }

  // Get printer width in characters
  private static getPrinterWidth(printer: PrinterConfig): number {
    switch (printer.paperSize) {
      case 'thermal_58mm': return 32;
      case 'thermal_80mm': return 48;
      case 'thermal_112mm': return 64;
      case 'a4': return 80;
      case 'a5': return 60;
      case 'letter': return 80;
      default: return printer.paperWidth || 48;
    }
  }

  // Format line with proper spacing
  private static formatLine(label: string, value: string, width: number, bold: boolean = false): string {
    const spaces = Math.max(1, width - label.length - value.length);
    const line = label + ' '.repeat(spaces) + value;
    return bold ? `\x1B\x45\x01${line}\x1B\x45\x00\n` : `${line}\n`;
  }

  // Center text
  private static centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  // Get printer end commands
  private static getPrinterEndCommands(printer: PrinterConfig): string {
    let commands = '';
    
    if (printer.type === 'thermal') {
      // Paper cut commands
      switch (printer.cutType) {
        case 'full':
          commands += '\x1D\x56\x00'; // Full cut
          break;
        case 'partial':
          commands += '\x1D\x56\x01'; // Partial cut
          break;
        default:
          commands += '\n\n\n'; // Feed paper
      }
      
      // Open cash drawer if configured
      if (printer.printSettings.openDrawerAfterPrint) {
        commands += '\x1B\x70\x00\x19\x19'; // Open drawer command
      }
      
      // Buzzer if configured
      if (printer.printSettings.buzzerOnPrint) {
        commands += '\x1B\x42\x05\x05'; // Buzzer command
      }
    }
    
    return commands;
  }

  // Connection test methods for all printer types
  private static async testUSBConnection(printer: PrinterConfig): Promise<boolean> {
    try {
      if (!navigator.usb) {
        console.warn('Web USB API not supported');
        return false;
      }

      // Check if printer is in detected USB devices
      const usbPrinter = this.usbPrinters.find(device => 
        device.productName?.toLowerCase().includes(printer.model.toLowerCase())
      );

      if (usbPrinter) {
        console.log('USB printer found:', usbPrinter);
        return true;
      }

      // Try to request device access
      const device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0519 }, // Star
          { vendorId: 0x1504 }, // Citizen
          { vendorId: 0x0bda }, // Bixolon
        ]
      });

      if (device) {
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);
        console.log('USB printer connected successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('USB connection test failed:', error);
      return false;
    }
  }

  private static async testNetworkConnection(printer: PrinterConfig): Promise<boolean> {
    if (!printer.ipAddress) return false;
    
    try {
      // Test network connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${printer.ipAddress}:${printer.port || 9100}`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors'
      });
      
      clearTimeout(timeoutId);
      console.log('Network printer responded');
      return true;
    } catch (error) {
      console.error('Network connection test failed:', error);
      
      // Try ping-like test
      try {
        const img = new Image();
        img.onload = () => console.log('Network printer accessible');
        img.onerror = () => console.log('Network printer not accessible');
        img.src = `http://${printer.ipAddress}/favicon.ico?${Date.now()}`;
        return true;
      } catch (pingError) {
        return false;
      }
    }
  }

  private static async testBluetoothConnection(printer: PrinterConfig): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        console.warn('Web Bluetooth API not supported');
        return false;
      }

      // Check if device is already connected
      const device = this.bluetoothDevices.find(d => 
        d.name?.toLowerCase().includes(printer.model.toLowerCase()) ||
        d.id === printer.bluetoothAddress
      );

      if (device && device.gatt?.connected) {
        console.log('Bluetooth printer already connected');
        return true;
      }

      if (device && !device.gatt?.connected) {
        const server = await device.gatt?.connect();
        if (server) {
          console.log('Bluetooth printer connected');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Bluetooth connection test failed:', error);
      return false;
    }
  }

  private static async testSerialConnection(printer: PrinterConfig): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        console.warn('Web Serial API not supported');
        return false;
      }

      // @ts-ignore - Web Serial API
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: printer.baudRate || 9600 });
      
      console.log('Serial printer connected');
      return true;
    } catch (error) {
      console.error('Serial connection test failed:', error);
      return false;
    }
  }

  private static async testParallelConnection(printer: PrinterConfig): Promise<boolean> {
    console.log('Parallel port connection test (legacy)');
    // Parallel ports are legacy, mostly not supported in modern browsers
    return false;
  }

  // Print methods for different connection types
  private static async printViaUSB(printer: PrinterConfig, content: string): Promise<boolean> {
    try {
      if (!navigator.usb) {
        throw new Error('Web USB API not supported');
      }

      const device = this.usbPrinters.find(d => 
        d.productName?.toLowerCase().includes(printer.model.toLowerCase())
      );

      if (device) {
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);
        
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        
        await device.transferOut(1, data);
        console.log('USB print successful');
        return true;
      }

      throw new Error('USB printer not found');
    } catch (error) {
      console.error('USB printing failed:', error);
      return this.fallbackPrint(content);
    }
  }

  private static async printViaNetwork(printer: PrinterConfig, content: string): Promise<boolean> {
    try {
      // For network printers, send raw data to printer IP
      const response = await fetch(`http://${printer.ipAddress}:${printer.port || 9100}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: content
      });

      if (response.ok) {
        console.log('Network print successful');
        return true;
      }

      throw new Error('Network print failed');
    } catch (error) {
      console.error('Network printing failed:', error);
      return this.fallbackPrint(content);
    }
  }

  private static async printViaBluetooth(printer: PrinterConfig, content: string): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not supported');
      }

      console.log('🖨️ Attempting to print via Bluetooth to:', printer.name);
      
      const device = this.bluetoothDevices.find(d => 
        d.name?.toLowerCase().includes(printer.model.toLowerCase()) ||
        d.id === printer.bluetoothAddress ||
        d.name?.toLowerCase().includes('xprinter') ||
        d.name?.toLowerCase().includes('xp-')
      );

      if (device && device.gatt?.connected) {
        try {
          const server = device.gatt;
          
          // Try multiple service UUIDs for better XPrinter compatibility
          let service;
          const serviceUUIDs = [
            '000018f0-0000-1000-8000-00805f9b34fb', // Serial Port Profile
            '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile UUID
            '0000180f-0000-1000-8000-00805f9b34fb'  // Battery Service (some printers)
          ];
          
          for (const serviceUUID of serviceUUIDs) {
            try {
              service = await server.getPrimaryService(serviceUUID);
              console.log(`✅ Connected to service: ${serviceUUID}`);
              break;
            } catch (serviceError) {
              console.log(`❌ Service ${serviceUUID} not available`);
              continue;
            }
          }
          
          if (!service) {
            throw new Error('No compatible Bluetooth service found on XPrinter');
          }
          
          // Try multiple characteristic UUIDs
          let characteristic;
          const characteristicUUIDs = [
            '00002af1-0000-1000-8000-00805f9b34fb',
            '00002a19-0000-1000-8000-00805f9b34fb',
            '0000ff01-0000-1000-8000-00805f9b34fb'
          ];
          
          for (const charUUID of characteristicUUIDs) {
            try {
              characteristic = await service.getCharacteristic(charUUID);
              console.log(`✅ Found characteristic: ${charUUID}`);
              break;
            } catch (charError) {
              console.log(`❌ Characteristic ${charUUID} not available`);
              continue;
            }
          }
          
          if (!characteristic) {
            throw new Error('No writable characteristic found on XPrinter');
          }
          
          const encoder = new TextEncoder();
          const data = encoder.encode(content);
          
          // Send data in smaller chunks for better XPrinter compatibility
          const chunkSize = 20;
          console.log(`📤 Sending ${data.length} bytes to XPrinter in ${Math.ceil(data.length / chunkSize)} chunks`);
          
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await characteristic.writeValue(chunk);
            await new Promise(resolve => setTimeout(resolve, 100)); // Longer delay for XPrinter
          }
          
          console.log('✅ XPrinter Bluetooth print successful');
          return true;
        } catch (printError) {
          console.error('XPrinter print operation failed:', printError);
          throw new Error(`XPrinter print failed: ${printError.message}`);
        }
      }

      throw new Error('XPrinter not connected. Please connect your XPrinter first.');
    } catch (error) {
      console.error('XPrinter Bluetooth printing failed:', error);
      return this.fallbackPrint(content);
    }
  }

  private static async printViaSerial(printer: PrinterConfig, content: string): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported');
      }

      // @ts-ignore - Web Serial API
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: printer.baudRate || 9600 });
      
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      
      await writer.write(data);
      writer.releaseLock();
      
      console.log('Serial print successful');
      return true;
    } catch (error) {
      console.error('Serial printing failed:', error);
      return this.fallbackPrint(content);
    }
  }

  private static async printViaParallel(printer: PrinterConfig, content: string): Promise<boolean> {
    console.warn('Parallel port printing not supported in modern browsers');
    return this.fallbackPrint(content);
  }

  private static async printViaSystemDefault(printer: PrinterConfig, content: string): Promise<boolean> {
    return this.fallbackPrint(content);
  }

  // Fallback print method using browser print dialog
  private static fallbackPrint(content: string): boolean {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return false;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt Print</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 0; 
                padding: 20px;
                white-space: pre-wrap;
              }
              @media print {
                body { margin: 0; padding: 10px; }
              }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      
      console.log('Fallback print successful');
      return true;
    } catch (error) {
      console.error('Fallback print failed:', error);
      return false;
    }
  }

  // Shared printer discovery for network environments
  static async discoverSharedPrinters(): Promise<any[]> {
    const sharedPrinters = [];
    
    try {
      // Common shared printer discovery methods
      const commonPrinterIPs = [
        '192.168.1.100', '192.168.1.101', '192.168.1.102',
        '192.168.0.100', '192.168.0.101', '192.168.0.102',
        '10.0.0.100', '10.0.0.101', '10.0.0.102'
      ];

      for (const ip of commonPrinterIPs) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          await fetch(`http://${ip}:9100`, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors'
          });
          
          clearTimeout(timeoutId);
          
          sharedPrinters.push({
            ip,
            port: 9100,
            type: 'shared_network',
            name: `Network Printer (${ip})`,
            status: 'available'
          });
        } catch (error) {
          // Ignore failed connections
        }
      }
    } catch (error) {
      console.error('Shared printer discovery failed:', error);
    }

    return sharedPrinters;
  }
  // Get detected network printers
  static getNetworkPrinters(): any[] {
    return this.networkPrinters;
  }

  // Get available printers summary
  static getAvailablePrinters(): any {
    return {
      usb: this.usbPrinters.length,
      network: this.networkPrinters.length,
      bluetooth: this.bluetoothDevices.length,
      configured: this.printers.length,
      total: this.usbPrinters.length + this.networkPrinters.length + this.bluetoothDevices.length
    };
  }

  // Save printers to localStorage
  private static savePrinters(): void {
    localStorage.setItem('brainbox_printers', JSON.stringify(this.printers));
  }

  // Generate comprehensive test page
  static generateTestPage(printer: PrinterConfig): string {
    const width = this.getPrinterWidth(printer);
    
    let content = this.getThermalCommands(printer);
    content += this.centerText('PRINTER TEST PAGE', width) + '\n';
    content += this.getSeparatorLine(printer) + '\n\n';
    
    content += `Printer: ${printer.name}\n`;
    content += `Type: ${printer.type.toUpperCase()}\n`;
    content += `Brand: ${printer.brand.toUpperCase()}\n`;
    content += `Model: ${printer.model}\n`;
    content += `Connection: ${printer.connectionType.toUpperCase()}\n`;
    content += `Paper: ${printer.paperSize}\n`;
    content += `Width: ${width} characters\n\n`;
    
    content += this.getSeparatorLine(printer, '-') + '\n';
    content += 'BUSINESS INFORMATION:\n';
    content += this.getSeparatorLine(printer, '-') + '\n';
    content += `${printer.businessInfo.companyName}\n`;
    content += `${printer.businessInfo.address}\n`;
    content += `${printer.businessInfo.city}, ${printer.businessInfo.state}\n`;
    content += `${printer.businessInfo.phone}\n`;
    content += `${printer.businessInfo.email}\n\n`;
    
    content += this.getSeparatorLine(printer, '-') + '\n';
    content += 'PRINT SETTINGS:\n';
    content += this.getSeparatorLine(printer, '-') + '\n';
    content += `Density: ${printer.printDensity}\n`;
    content += `Speed: ${printer.printSpeed}\n`;
    content += `Cut Type: ${printer.cutType}\n`;
    content += `Auto Print: ${printer.printSettings.autoprint ? 'Yes' : 'No'}\n`;
    content += `Copies: ${printer.printSettings.copies}\n\n`;
    
    content += this.getSeparatorLine(printer, '-') + '\n';
    content += 'CHARACTER WIDTH TEST:\n';
    content += this.getSeparatorLine(printer, '-') + '\n';
    content += '1234567890'.repeat(Math.ceil(width / 10)).substring(0, width) + '\n';
    content += 'ABCDEFGHIJ'.repeat(Math.ceil(width / 10)).substring(0, width) + '\n\n';
    
    content += `Test completed: ${new Date().toLocaleString()}\n\n`;
    
    content += this.getSeparatorLine(printer) + '\n';
    content += this.centerText('Powered by BrainBox-RetailPlus V25', width) + '\n';
    content += this.centerText('© 2025 Technology Innovation Worldwide', width) + '\n';
    
    content += this.getPrinterEndCommands(printer);
    
    return content;
  }

  // Print test page
  static async printTestPage(printer: PrinterConfig): Promise<boolean> {
    const testContent = this.generateTestPage(printer);
    return this.printReceipt(printer, {
      receiptNumber: 'TEST',
      timestamp: new Date(),
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      paymentMethod: 'test',
      paymentDetails: [],
      cashierName: 'Test'
    });
  }
}

// Initialize printer service
PrinterService.initialize();