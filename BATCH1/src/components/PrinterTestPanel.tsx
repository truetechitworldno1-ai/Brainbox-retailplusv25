import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Bluetooth, 
  Usb, 
  Wifi, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Smartphone,
  Monitor,
  Search,
  Plus,
  Settings,
  Zap,
  Network,
  HardDrive
} from 'lucide-react';
import { PrinterService } from '../services/PrinterService';
import { useNotification } from '../contexts/NotificationContext';
import { PrinterConfig } from '../types';

export default function PrinterTestPanel() {
  const { addNotification } = useNotification();
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [networkPrinters, setNetworkPrinters] = useState<any[]>([]);
  const [usbPrinters, setUsbPrinters] = useState<any[]>([]);
  const [configuredPrinters, setConfiguredPrinters] = useState<PrinterConfig[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [testResults, setTestResults] = useState<{[key: string]: boolean | null}>({});
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [autoScanRunning, setAutoScanRunning] = useState(false);
  const [detectedPrinters, setDetectedPrinters] = useState<any[]>([]);
  const [printerForm, setPrinterForm] = useState({
    name: '',
    type: 'thermal' as 'thermal' | 'inkjet' | 'laser' | 'dot_matrix',
    brand: 'epson' as 'epson' | 'star' | 'citizen' | 'bixolon' | 'zebra' | 'hp' | 'canon' | 'brother' | 'custom',
    model: '',
    connectionType: 'bluetooth' as 'usb' | 'ethernet' | 'wifi' | 'bluetooth' | 'serial' | 'parallel',
    ipAddress: '',
    port: 9100,
    bluetoothAddress: '',
    paperSize: 'thermal_80mm' as 'thermal_58mm' | 'thermal_80mm' | 'thermal_112mm' | 'a4' | 'a5' | 'letter',
    printDensity: 'medium' as 'light' | 'medium' | 'dark',
    printSpeed: 'medium' as 'slow' | 'medium' | 'fast',
    cutType: 'full' as 'full' | 'partial' | 'none'
  });

  useEffect(() => {
    loadPrinters();
    // Auto-detect printers on component mount
    startAutoDetection();
  }, []);

  const startAutoDetection = async () => {
    setAutoScanRunning(true);
    try {
      console.log('🔍 Starting automatic printer detection...');
      
      // Scan for network printers
      const networkPrinters = await scanNetworkPrinters();
      setDetectedPrinters(networkPrinters);
      
      if (networkPrinters.length > 0) {
        addNotification({
          title: 'Printers Found!',
          message: `Found ${networkPrinters.length} wireless printer${networkPrinters.length > 1 ? 's' : ''} on your network`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
    } finally {
      setAutoScanRunning(false);
    }
  };

  const scanNetworkPrinters = async (): Promise<any[]> => {
    const foundPrinters: any[] = [];
    
    // Common printer IP addresses in office networks
    const commonPrinterIPs = [
      '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.200',
      '192.168.0.100', '192.168.0.101', '192.168.0.102', '192.168.0.200',
      '10.0.0.100', '10.0.0.101', '10.0.0.102', '10.0.0.200',
      '172.16.0.100', '172.16.0.101', '172.16.0.102'
    ];
    
    // Scan each IP for printer services
    for (const ip of commonPrinterIPs) {
      try {
        // Test multiple printer ports
        const ports = [9100, 515, 631, 80];
        for (const port of ports) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);
            
            await fetch(`http://${ip}:${port}`, {
              method: 'HEAD',
              signal: controller.signal,
              mode: 'no-cors'
            });
            
            clearTimeout(timeoutId);
            
            foundPrinters.push({
              ip,
              port,
              name: `Network Printer (${ip})`,
              type: 'network',
              brand: 'Unknown',
              model: 'Network Printer',
              status: 'available',
              connectionType: 'wifi'
            });
            
            console.log(`🖨️ Found printer at ${ip}:${port}`);
            break; // Found on this IP, no need to check other ports
          } catch (error) {
            // Continue to next port
          }
        }
      } catch (error) {
        // Continue to next IP
      }
    }
    
    return foundPrinters;
  };
  const loadPrinters = () => {
    const printers = PrinterService.getAllPrinters();
    setConfiguredPrinters(printers);
  };

  const detectAllPrinters = async () => {
    setIsScanning(true);
    try {
      console.log('🔍 Starting comprehensive printer detection...');
      await PrinterService.detectAvailablePrinters();
      
      // Get detected printers
      const summary = PrinterService.getAvailablePrinters();
      console.log('Printer detection summary:', summary);
      
      // Update local state with detected network printers
      const detectedNetwork = PrinterService.getNetworkPrinters();
      setNetworkPrinters(detectedNetwork);
      
      addNotification({
        title: 'Printer Detection Complete',
        message: `Found ${summary.total} available printers (${summary.network} wireless, ${summary.bluetooth} bluetooth)`,
        type: 'success'
      });
    } catch (error) {
      console.error('Printer detection failed:', error);
      addNotification({
        title: 'Printer Detection Failed',
        message: 'Some printers may not be detected. Try manual setup.',
        type: 'warning'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const scanForBluetoothPrinters = async () => {
    setIsScanning(true);
    try {
      if (!navigator.bluetooth) {
        addNotification({
          title: 'Bluetooth Not Supported',
          message: 'Please use Chrome, Edge, or Opera browser for Bluetooth support.',
          type: 'error'
        });
        setIsScanning(false);
        return;
      }

      console.log('📱 Scanning for XPrinter and other Bluetooth thermal printers...');
      
      // Try multiple scanning approaches for better XPrinter detection
      let device;
      
      try {
        // First try: Scan specifically for XPrinter and common thermal printer names
        device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'XPrinter' },
            { namePrefix: 'XPRINTER' },
            { namePrefix: 'xprinter' },
            { namePrefix: 'XP-' },
            { namePrefix: 'POS' },
            { namePrefix: 'Printer' },
            { namePrefix: 'Thermal' },
            { namePrefix: 'Receipt' },
            { namePrefix: 'TRP' },
            { namePrefix: 'BTP' },
            { namePrefix: 'MTP' },
            { namePrefix: 'RPP' },
            { namePrefix: 'Epson' },
            { namePrefix: 'Star' },
            { namePrefix: 'Citizen' },
            { namePrefix: 'Bixolon' },
            { namePrefix: 'TSP' },
            { namePrefix: 'TM-' },
            { namePrefix: 'CT-' },
            { namePrefix: 'SRP-' },
            { namePrefix: 'BT-' },
            { namePrefix: 'Mobile' },
            { namePrefix: 'Portable' },
            { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
            { services: ['00001101-0000-1000-8000-00805f9b34fb'] }
          ],
          optionalServices: [
            '000018f0-0000-1000-8000-00805f9b34fb', // Serial Port Profile
            '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile UUID
            '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
            '0000180a-0000-1000-8000-00805f9b34fb'  // Device Information Service
          ]
        });
      } catch (filterError) {
        console.log('Filtered scan failed, trying acceptAllDevices approach...');
        
        // Second try: Accept all devices (broader scan)
        try {
          device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
              '000018f0-0000-1000-8000-00805f9b34fb', // Serial Port Profile
              '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile UUID
              '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
              '0000180a-0000-1000-8000-00805f9b34fb'  // Device Information Service
            ]
          });
        } catch (acceptAllError) {
          throw new Error('No Bluetooth devices found. Make sure your XPrinter is turned on and in pairing mode.');
        }
      }

      if (!device) {
        throw new Error('No device selected');
      }

      console.log('🎉 Bluetooth device found:', device.name || 'Unknown Device', 'ID:', device.id);
      
      // Enhanced device information logging
      addNotification({
        title: '📱 Bluetooth Device Found!',
        message: `Found: ${device.name || 'Unknown Device'} - Attempting connection...`,
        type: 'success'
      });

      // Add device to list if not already present
      const existingDevice = bluetoothDevices.find(d => d.id === device.id);
      if (!existingDevice) {
        const updatedDevices = [...bluetoothDevices, device];
        setBluetoothDevices(updatedDevices);
        
        // Auto-connect to the device
        await connectToBluetoothPrinter(device);
      } else {
        addNotification({
          title: 'Device Already Added',
          message: `${device.name || 'Device'} is already in your printer list`,
          type: 'info'
        });
      }
      
    } catch (error: any) {
      console.error('Bluetooth scan error:', error);
      
      if (error.name === 'NotFoundError') {
        addNotification({
          title: 'No XPrinter Found',
          message: 'No XPrinter found. Make sure it\'s ON and in pairing mode (hold power button for 3 seconds until blue light blinks).',
          type: 'warning'
        });
      } else if (error.name === 'NotSupportedError') {
        addNotification({
          title: 'Bluetooth Not Supported',
          message: 'Your browser doesn\'t support Bluetooth. Use Chrome, Edge, or Opera browser.',
          type: 'error'
        });
      } else if (error.name === 'SecurityError') {
        addNotification({
          title: 'Bluetooth Permission Denied',
          message: 'Please allow Bluetooth access in your browser settings and try again.',
          type: 'error'
        });
      } else if (error.name === 'NotAllowedError') {
        addNotification({
          title: 'Bluetooth Access Denied',
          message: 'Bluetooth access was denied. Please enable Bluetooth permissions and try again.',
          type: 'error'
        });
      } else {
        addNotification({
          title: 'XPrinter Scan Failed',
          message: 'XPrinter scan failed. Ensure: 1) XPrinter is ON, 2) In pairing mode (blue light blinking), 3) Bluetooth enabled on device.',
          type: 'error'
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const connectToBluetoothPrinter = async (device: BluetoothDevice) => {
    try {
      console.log('🔗 Attempting to connect to:', device.name || 'Unknown Device');
      
      if (!device.gatt) {
        throw new Error('Device GATT not available');
      }

      addNotification({
        title: 'Connecting to XPrinter...',
        message: `Connecting to ${device.name || 'Bluetooth Device'}...`,
        type: 'info'
      });

      const server = await device.gatt.connect();
      console.log('✅ Successfully connected to Bluetooth printer:', device.name || 'Unknown Device');
      
      setSelectedDevice(device);
      addNotification({
        title: '🎉 XPrinter Connected!',
        message: `Successfully connected to ${device.name || 'XPrinter'}! Ready to print.`,
        type: 'success'
      });

      // Auto-add to configured printers with enhanced XPrinter detection
      const isXPrinter = device.name?.toLowerCase().includes('xprinter') || 
                        device.name?.toLowerCase().includes('xp-') ||
                        device.name?.toLowerCase().includes('pos') ||
                        device.name?.toLowerCase().includes('thermal');
      
      const newPrinter = PrinterService.addPrinter({
        name: device.name || (isXPrinter ? 'XPrinter Mobile' : 'Bluetooth Printer'),
        type: 'thermal',
        brand: isXPrinter ? 'custom' : 'custom',
        model: device.name || (isXPrinter ? 'XPrinter Mobile' : 'Unknown Model'),
        connectionType: 'bluetooth',
        bluetoothAddress: device.id,
        paperSize: device.name?.includes('58') ? 'thermal_58mm' : 'thermal_80mm',
        printDensity: 'medium',
        printSpeed: 'medium',
        cutType: 'full',
        businessInfo: {
          companyName: 'Demo Store',
          address: '123 Business Street',
          city: 'Lagos',
          state: 'Lagos',
          zipCode: '12345',
          country: 'Nigeria',
          phone: '+234-xxx-xxx-xxxx',
          email: 'info@demostore.com',
          website: '',
          taxId: '',
          registrationNumber: '',
          logo: ''
        },
        receiptLayout: {
          showLogo: false,
          showBusinessInfo: true,
          showTaxInfo: true,
          showDateTime: true,
          showCashier: true,
          showCustomerInfo: true,
          showLoyaltyInfo: true,
          itemNameWidth: device.name?.includes('58') ? 16 : 20,
          priceAlignment: 'right',
          fontSize: 'medium',
          lineSpacing: 'normal'
        },
        printSettings: {
          autoprint: true,
          copies: 1,
          printCustomerCopy: true,
          printMerchantCopy: false,
          openDrawerAfterPrint: false,
          buzzerOnPrint: true,
          printTestPageOnSetup: false
        },
        isActive: true,
        isDefault: configuredPrinters.length === 0
      });

      // Immediately test the connection
      setTimeout(async () => {
        try {
          const testSuccess = await PrinterService.testPrinter(newPrinter);
          if (testSuccess) {
            addNotification({
              title: '✅ XPrinter Test Successful!',
              message: `${device.name || 'XPrinter'} is ready to print receipts!`,
              type: 'success'
            });
          }
        } catch (testError) {
          console.warn('Printer test failed:', testError);
        }
      }, 1000);

      loadPrinters();
    } catch (error: any) {
      console.error('XPrinter connection failed:', error);
      addNotification({
        title: 'XPrinter Connection Failed',
        message: error.message || 'Failed to connect to XPrinter. Try: 1) Turn OFF/ON XPrinter, 2) Hold power button until blue light blinks, 3) Try again.',
        type: 'error'
      });
    }
  };

  const testPrinter = async (printer: PrinterConfig) => {
    setTestResults({ ...testResults, [printer.id]: null });
    
    try {
      const success = await PrinterService.testPrinter(printer);
      setTestResults({ ...testResults, [printer.id]: success });
      
      if (success) {
        addNotification({
          title: 'Printer Test Successful',
          message: `${printer.name} is working correctly`,
          type: 'success'
        });
      } else {
        addNotification({
          title: 'Printer Test Failed',
          message: `${printer.name} is not responding`,
          type: 'error'
        });
      }
    } catch (error) {
      setTestResults({ ...testResults, [printer.id]: false });
      addNotification({
        title: 'Printer Test Error',
        message: 'Failed to test printer connection',
        type: 'error'
      });
    }
  };

  const printTestReceipt = async (printer: PrinterConfig) => {
    try {
      const success = await PrinterService.printTestPage(printer);
      
      if (success) {
        addNotification({
          title: 'Test Print Successful',
          message: `Test page sent to ${printer.name}`,
          type: 'success'
        });
      } else {
        addNotification({
          title: 'Test Print Failed',
          message: `Failed to print test page on ${printer.name}`,
          type: 'error'
        });
      }
    } catch (error) {
      addNotification({
        title: 'Print Error',
        message: 'Failed to send test print',
        type: 'error'
      });
    }
  };

  const addPrinter = () => {
    if (!printerForm.name.trim() || !printerForm.model.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Please fill in printer name and model',
        type: 'error'
      });
      return;
    }

    const newPrinter = PrinterService.addPrinter({
      ...printerForm,
      businessInfo: {
        companyName: 'Your Business Name',
        address: 'Your Business Address',
        city: 'Your City',
        state: 'Your State',
        zipCode: '12345',
        country: 'Nigeria',
        phone: '+234-xxx-xxx-xxxx',
        email: 'info@yourbusiness.com',
        website: '',
        taxId: '',
        registrationNumber: '',
        logo: ''
      },
      receiptLayout: {
        showLogo: false,
        showBusinessInfo: true,
        showTaxInfo: true,
        showDateTime: true,
        showCashier: true,
        showCustomerInfo: true,
        showLoyaltyInfo: true,
        itemNameWidth: 20,
        priceAlignment: 'right',
        fontSize: 'medium',
        lineSpacing: 'normal'
      },
      printSettings: {
        autoprint: true,
        copies: 1,
        printCustomerCopy: true,
        printMerchantCopy: false,
        openDrawerAfterPrint: false,
        buzzerOnPrint: true,
        printTestPageOnSetup: false
      },
      isActive: true,
      isDefault: configuredPrinters.length === 0
    });

    loadPrinters();
    setShowAddPrinter(false);
    setPrinterForm({
      name: '',
      type: 'thermal',
      brand: 'epson',
      model: '',
      connectionType: 'bluetooth',
      ipAddress: '',
      port: 9100,
      bluetoothAddress: '',
      paperSize: 'thermal_80mm',
      printDensity: 'medium',
      printSpeed: 'medium',
      cutType: 'full'
    });

    addNotification({
      title: 'Printer Added',
      message: `${newPrinter.name} has been configured`,
      type: 'success'
    });
  };

  const getTestIcon = (result: boolean | null) => {
    if (result === null) return <TestTube className="h-4 w-4 text-gray-400" />;
    if (result === true) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getConnectionIcon = (connectionType: string) => {
    switch (connectionType) {
      case 'bluetooth': return <Bluetooth className="h-5 w-5 text-blue-600" />;
      case 'usb': return <Usb className="h-5 w-5 text-green-600" />;
      case 'ethernet': case 'wifi': return <Wifi className="h-5 w-5 text-purple-600" />;
      case 'serial': return <HardDrive className="h-5 w-5 text-orange-600" />;
      case 'parallel': return <Network className="h-5 w-5 text-gray-600" />;
      default: return <Printer className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Printer Detection Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Printer className="h-5 w-5 mr-2" />
            Comprehensive Printer Support
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={detectAllPrinters}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Detect All</span>
            </button>
            <button
              onClick={() => setShowAddPrinter(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Printer</span>
            </button>
          </div>
        </div>

        {/* Printer Types Support */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-900">Thermal</p>
            <p className="text-xs text-blue-700">58mm, 80mm, 112mm</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Monitor className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-900">Inkjet</p>
            <p className="text-xs text-green-700">HP, Canon, Epson</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-purple-900">Laser</p>
            <p className="text-xs text-purple-700">HP, Brother, Canon</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <HardDrive className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="font-medium text-orange-900">Dot Matrix</p>
            <p className="text-xs text-orange-700">Legacy Support</p>
          </div>
        </div>

        {/* Connection Types Support */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Usb className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-xs font-medium">USB</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Wifi className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-xs font-medium">WiFi</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Network className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <p className="text-xs font-medium">Ethernet</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Bluetooth className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-xs font-medium">Bluetooth</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <HardDrive className="h-6 w-6 text-orange-600 mx-auto mb-1" />
            <p className="text-xs font-medium">Serial</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Monitor className="h-6 w-6 text-gray-600 mx-auto mb-1" />
            <p className="text-xs font-medium">Parallel</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Wifi className="h-4 w-4 mr-2 text-purple-600" />
              🌐 Wireless Network Printers
            </h4>
            <button
              onClick={startAutoDetection}
              disabled={autoScanRunning}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <Search className={`h-4 w-4 ${autoScanRunning ? 'animate-spin' : ''}`} />
              <span>{autoScanRunning ? 'Scanning Network...' : 'Scan Network'}</span>
            </button>
          </div>
        
          {detectedPrinters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detectedPrinters.map((printer, index) => (
                <div key={index} className="border-2 border-purple-300 rounded-lg p-4 bg-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-purple-900 text-lg">🖨️ {printer.name}</p>
                      <p className="text-sm text-purple-700 font-medium">📍 IP: {printer.ip}:{printer.port}</p>
                      <p className="text-xs text-purple-600 font-medium">
                        📶 WiFi Network Printer
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">Available</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setPrinterForm({
                            ...printerForm,
                            name: printer.name,
                            connectionType: 'wifi',
                            ipAddress: printer.ip,
                            port: printer.port,
                            type: 'thermal',
                            brand: 'custom',
                            model: 'Network Printer'
                          });
                          setShowAddPrinter(true);
                        }}
                        className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-bold shadow-lg"
                      >
                        🔧 Setup This Printer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              {autoScanRunning ? (
                <div>
                  <div className="relative">
                    <Search className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-purple-600 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <p className="text-purple-600 font-bold text-lg">🔍 Scanning Network for Printers...</p>
                  <p className="text-sm text-purple-500">Checking WiFi network for available printers</p>
                </div>
              ) : (
                <div>
                  <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No wireless printers found</p>
                  <p className="text-sm text-gray-500">Click "Scan Network" to search again</p>
                </div>
              )}
              <div className="text-sm text-gray-500 space-y-1 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p>📶 <strong>Wireless Printer Setup:</strong></p>
                <p>1. Ensure printer is connected to same WiFi network</p>
                <p>2. Make sure printer is powered on and ready</p>
                <p>3. Check printer supports network printing</p>
                <p>4. Click "Scan Network" to search automatically</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bluetooth Printers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Smartphone className="h-4 w-4 mr-2 text-blue-600" />
            📱 Mobile Bluetooth Printers
          </h4>
          <button
            onClick={scanForBluetoothPrinters}
            disabled={isScanning}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <Bluetooth className={`h-4 w-4 ${isScanning ? 'animate-pulse' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Bluetooth'}</span>
          </button>
        </div>

        {bluetoothDevices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bluetoothDevices.map((device, index) => (
              <div key={index} className="border-2 border-blue-300 rounded-lg p-4 bg-white shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-blue-900 text-lg">📱 {device.name || 'Bluetooth Device'}</p>
                    <p className="text-sm text-blue-700 font-medium">🆔 ID: {device.id.substring(0, 12)}...</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${device.gatt?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={`text-xs font-medium ${device.gatt?.connected ? 'text-green-600' : 'text-red-600'}`}>
                        {device.gatt?.connected ? '🟢 Connected' : '🔴 Disconnected'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!device.gatt?.connected && (
                      <button
                        onClick={() => connectToBluetoothPrinter(device)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-lg"
                      >
                        🔗 Connect
                      </button>
                    )}
                    {device.gatt?.connected && (
                      <button
                        onClick={() => {
                          const printer = configuredPrinters.find(p => p.bluetoothAddress === device.id);
                          if (printer) printTestReceipt(printer);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-bold shadow-lg"
                      >
                        🖨️ Test Print
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            {isScanning ? (
              <div>
                <div className="relative">
                  <Bluetooth className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full animate-ping"></div>
                  </div>
                </div>
                <p className="text-blue-600 font-bold text-lg">📱 Scanning for Bluetooth Printers...</p>
                <p className="text-sm text-blue-500">Looking for nearby thermal printers</p>
              </div>
            ) : (
              <div>
                <Bluetooth className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No Bluetooth devices found</p>
              </div>
            )}
            <div className="text-sm text-gray-500 space-y-1 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p>📱 <strong>Mobile Instructions:</strong></p>
              <p>1. Turn on your Bluetooth thermal printer</p>
              <p>2. Put printer in pairing mode (usually hold power button)</p>
              <p>3. Enable Bluetooth on your phone/computer</p>
              <p>4. Click "Scan Bluetooth" and select your printer</p>
              <p>5. Allow Bluetooth permissions when prompted</p>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>✅ Supported:</strong> Chrome, Edge, Opera browsers with Bluetooth Web API
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Configured Printers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          Configured Printers ({configuredPrinters.length})
        </h4>
        
        {configuredPrinters.length > 0 ? (
          <div className="space-y-4">
            {configuredPrinters.map((printer) => (
              <div key={printer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getConnectionIcon(printer.connectionType)}
                    <div>
                      <p className="font-medium text-gray-900">{printer.name}</p>
                      <p className="text-sm text-gray-600">{printer.brand.toUpperCase()} {printer.model}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{printer.type} printer</span>
                        <span className="capitalize">{printer.connectionType} connection</span>
                        <span>{printer.paperSize.replace('_', ' ')}</span>
                        {printer.isDefault && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {testResults[printer.id] === true && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {testResults[printer.id] === false && <XCircle className="h-5 w-5 text-red-600" />}
                    {testResults[printer.id] === null && <RefreshCw className="h-5 w-5 text-gray-400" />}
                    
                    <button
                      onClick={() => testPrinter(printer)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center space-x-1"
                    >
                      <TestTube className="h-3 w-3" />
                      <span>Test</span>
                    </button>
                    
                    <button
                      onClick={() => printTestReceipt(printer)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center space-x-1"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
                
                {/* Printer Details */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {printer.ipAddress && (
                    <div>
                      <span className="text-gray-500">IP:</span>
                      <span className="ml-1 font-mono">{printer.ipAddress}:{printer.port}</span>
                    </div>
                  )}
                  {printer.bluetoothAddress && (
                    <div>
                      <span className="text-gray-500">Bluetooth:</span>
                      <span className="ml-1 font-mono">{printer.bluetoothAddress.substring(0, 8)}...</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Density:</span>
                    <span className="ml-1 capitalize">{printer.printDensity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Speed:</span>
                    <span className="ml-1 capitalize">{printer.printSpeed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No printers configured</p>
            <p className="text-sm text-gray-500">Add your first printer to get started</p>
          </div>
        )}
      </div>

      {/* Add Printer Modal */}
      {showAddPrinter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Printer</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Printer Name *</label>
                  <input
                    type="text"
                    value={printerForm.name}
                    onChange={(e) => setPrinterForm({...printerForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Main Counter Printer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Printer Type</label>
                  <select
                    value={printerForm.type}
                    onChange={(e) => setPrinterForm({...printerForm, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="thermal">Thermal Printer</option>
                    <option value="inkjet">Inkjet Printer</option>
                    <option value="laser">Laser Printer</option>
                    <option value="dot_matrix">Dot Matrix Printer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <select
                    value={printerForm.brand}
                    onChange={(e) => setPrinterForm({...printerForm, brand: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="epson">Epson</option>
                    <option value="star">Star Micronics</option>
                    <option value="citizen">Citizen</option>
                    <option value="bixolon">Bixolon</option>
                    <option value="zebra">Zebra</option>
                    <option value="hp">HP</option>
                    <option value="canon">Canon</option>
                    <option value="brother">Brother</option>
                    <option value="custom">Custom/Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                  <input
                    type="text"
                    value={printerForm.model}
                    onChange={(e) => setPrinterForm({...printerForm, model: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., TM-T20III, LaserJet Pro"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Connection Type</label>
                  <select
                    value={printerForm.connectionType}
                    onChange={(e) => setPrinterForm({...printerForm, connectionType: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bluetooth">Bluetooth</option>
                    <option value="usb">USB</option>
                    <option value="wifi">WiFi</option>
                    <option value="ethernet">Ethernet</option>
                    <option value="serial">Serial Port</option>
                    <option value="parallel">Parallel Port</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                  <select
                    value={printerForm.paperSize}
                    onChange={(e) => setPrinterForm({...printerForm, paperSize: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="thermal_58mm">Thermal 58mm</option>
                    <option value="thermal_80mm">Thermal 80mm</option>
                    <option value="thermal_112mm">Thermal 112mm</option>
                    <option value="a4">A4 Paper</option>
                    <option value="a5">A5 Paper</option>
                    <option value="letter">Letter Size</option>
                  </select>
                </div>

                {/* Network Connection Settings */}
                {(printerForm.connectionType === 'wifi' || printerForm.connectionType === 'ethernet') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">IP Address *</label>
                      <input
                        type="text"
                        value={printerForm.ipAddress}
                        onChange={(e) => setPrinterForm({...printerForm, ipAddress: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                      <input
                        type="number"
                        value={printerForm.port}
                        onChange={(e) => setPrinterForm({...printerForm, port: parseInt(e.target.value) || 9100})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="9100"
                      />
                    </div>
                  </>
                )}

                {/* Bluetooth Settings */}
                {printerForm.connectionType === 'bluetooth' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bluetooth Address</label>
                    <select
                      value={printerForm.bluetoothAddress}
                      onChange={(e) => setPrinterForm({...printerForm, bluetoothAddress: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Bluetooth Device</option>
                      {bluetoothDevices.map((device, index) => (
                        <option key={index} value={device.id}>
                          {device.name || `Device ${index + 1}`} ({device.id.substring(0, 8)}...)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Print Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Print Density</label>
                  <select
                    value={printerForm.printDensity}
                    onChange={(e) => setPrinterForm({...printerForm, printDensity: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Print Speed</label>
                  <select
                    value={printerForm.printSpeed}
                    onChange={(e) => setPrinterForm({...printerForm, printSpeed: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="slow">Slow</option>
                    <option value="medium">Medium</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddPrinter(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPrinter}
                  disabled={!printerForm.name.trim() || !printerForm.model.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Add Printer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printer Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-4">🖨️ Printer Setup Instructions:</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-blue-800 mb-2">📱 Mobile Bluetooth Printers:</h5>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Turn on your Bluetooth thermal printer</li>
              <li>2. Put printer in pairing mode</li>
              <li>3. Click "Scan Bluetooth" button</li>
              <li>4. Select your printer and click "Connect"</li>
              <li>5. Test print to verify connection</li>
            </ol>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-800 mb-2">🌐 Network Shared Printers:</h5>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Get printer IP address from network settings</li>
              <li>2. Click "Add Printer" and select WiFi/Ethernet</li>
              <li>3. Enter IP address and port (usually 9100)</li>
              <li>4. Configure paper size and settings</li>
              <li>5. Test connection and print</li>
            </ol>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-800 mb-2">🔌 USB Printers:</h5>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Connect printer via USB cable</li>
              <li>2. Install printer drivers if needed</li>
              <li>3. Click "Detect All" to find USB printers</li>
              <li>4. Add printer and configure settings</li>
              <li>5. Test print functionality</li>
            </ol>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-800 mb-2">⚡ Supported Features:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All printer types (thermal, inkjet, laser)</li>
              <li>• Multiple connections (USB, WiFi, Bluetooth)</li>
              <li>• Shared network printers</li>
              <li>• Custom paper sizes</li>
              <li>• Print density and speed control</li>
              <li>• Auto-cut and cash drawer integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}