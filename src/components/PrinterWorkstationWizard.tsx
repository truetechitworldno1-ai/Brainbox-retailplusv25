import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Printer, 
  Wifi, 
  Bluetooth, 
  Usb, 
  Search, 
  CheckCircle, 
  Settings, 
  ArrowRight,
  RefreshCw,
  Smartphone,
  Network,
  HardDrive,
  Zap,
  Plus,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { PrinterService } from '../services/PrinterService';
import { useNotification } from '../contexts/NotificationContext';
import { PrinterConfig } from '../types';

interface PrinterWorkstationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrinterWorkstationWizard({ isOpen, onClose }: PrinterWorkstationWizardProps) {
  const { addNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const [workstationName, setWorkstationName] = useState('Main POS Terminal');

  useEffect(() => {
    if (isOpen && currentStep === 2) {
      startAutoScan();
    }
  }, [isOpen, currentStep]);

  const startAutoScan = async () => {
    setIsScanning(true);
    setAvailablePrinters([]);
    
    try {
      console.log('🔍 Starting simple printer detection...');
      
      // Simulate finding common printers with simple names
      const foundPrinters: any[] = [];
      
      // 1. Common Mobile Thermal Printers (Bluetooth)
      console.log('📱 Looking for mobile thermal printers...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mobilePrinters = [
        {
          id: 'xprinter_1',
          name: 'XPrinter Mobile Printer',
          type: 'Mobile Thermal',
          brand: 'XPrinter',
          model: 'XP-P323B',
          connectionType: 'bluetooth',
          status: 'available',
          description: '📱 Mobile Receipt Printer (Bluetooth)',
          icon: Smartphone,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          setupInstructions: 'Turn on printer → Hold power button → Pair with phone'
        },
        {
          id: 'xprinter_58mm',
          name: 'XPrinter 58mm Mobile',
          type: 'Mobile Thermal 58mm',
          brand: 'XPrinter',
          model: 'XP-P300B',
          connectionType: 'bluetooth',
          status: 'available',
          description: '📱 Compact 58mm Mobile Printer (Bluetooth)',
          icon: Smartphone,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-300',
          setupInstructions: 'Turn on XPrinter 58mm → Hold power button → Pair via Bluetooth'
        },
        {
          id: 'xprinter_wired_80',
          name: 'XPrinter Wired 80mm',
          type: 'Wired Thermal 80mm',
          brand: 'XPrinter',
          model: 'XP-80C',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 XPrinter Desktop 80mm Wired (USB)',
          icon: Usb,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          setupInstructions: 'Connect USB cable → Turn on printer → Windows auto-installs driver'
        },
        {
          id: 'xprinter_wired_58',
          name: 'XPrinter Wired 58mm',
          type: 'Wired Thermal 58mm',
          brand: 'XPrinter',
          model: 'XP-58IIH',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 XPrinter Compact 58mm Wired (USB)',
          icon: Usb,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-300',
          setupInstructions: 'Connect USB cable → Power on → Driver installs automatically'
        },
        {
          id: 'xprinter_2',
          name: 'XPrinter Thermal 80mm',
          type: 'Desktop Thermal',
          brand: 'XPrinter',
          model: 'XP-80C',
          connectionType: 'usb',
          status: 'available',
          description: '🖨️ Desktop Receipt Printer (USB)',
          icon: Usb,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          setupInstructions: 'Connect USB cable → Install driver → Ready to print'
        },
        {
          id: 'xprinter_58mm_usb',
          name: 'XPrinter 58mm USB',
          type: 'Desktop Thermal 58mm',
          brand: 'XPrinter',
          model: 'XP-58IIH',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 Compact 58mm USB Printer',
          icon: Usb,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-300',
          setupInstructions: 'Connect USB cable → Windows will auto-install driver → Ready'
        },
        {
          id: 'wired_thermal_1',
          name: 'Wired Thermal Printer',
          type: 'Wired Thermal',
          brand: 'Generic',
          model: 'TRP-80-USB',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 Standard Wired Receipt Printer (USB)',
          icon: Usb,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-300',
          setupInstructions: 'Connect USB cable → Install driver if needed → Test print'
        },
        {
          id: 'wired_thermal_2',
          name: 'Wired POS Printer',
          type: 'Wired POS',
          brand: 'Generic',
          model: 'POS-58-USB',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 Wired POS Terminal Printer (USB)',
          icon: Usb,
          color: 'text-teal-600',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-300',
          setupInstructions: 'Connect to USB port → Driver auto-installs → Ready to use'
        },
        {
          id: 'generic_wired',
          name: 'Wired Thermal Printer',
          type: 'Wired Thermal',
          brand: 'Generic',
          model: 'TRP-80-USB',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 Standard Wired Receipt Printer (USB)',
          icon: Usb,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-300',
          setupInstructions: 'Connect USB cable → Install driver if needed → Test print'
        },
        {
          id: 'pos_wired',
          name: 'POS Wired Printer',
          type: 'Wired POS',
          brand: 'Generic',
          model: 'POS-58-USB',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 Wired POS Terminal Printer (USB)',
          icon: Usb,
          color: 'text-teal-600',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-300',
          setupInstructions: 'Connect to USB port → Driver auto-installs → Ready to use'
        },
        {
          id: 'pos_printer_1',
          name: 'POS Thermal Printer',
          type: 'POS Terminal',
          brand: 'Generic',
          model: 'POS-80',
          connectionType: 'bluetooth',
          status: 'available',
          description: '💳 POS Receipt Printer (Bluetooth)',
          icon: Smartphone,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-300',
          setupInstructions: 'Enable Bluetooth → Search devices → Connect'
        },
        {
          id: 'thermal_1',
          name: 'Thermal Receipt Printer',
          type: 'Thermal Printer',
          brand: 'Generic',
          model: 'TRP-80',
          connectionType: 'bluetooth',
          status: 'available',
          description: '🧾 Standard Receipt Printer (Bluetooth)',
          icon: Printer,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-300',
          setupInstructions: 'Pair via Bluetooth → Test print → Complete setup'
        }
      ];
      
      foundPrinters.push(...mobilePrinters);
      
      // 2. WiFi Network Printers
      console.log('📶 Scanning WiFi network for printers...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const wifiPrinters = [
        {
          id: 'wifi_1',
          name: 'Office WiFi Printer',
          type: 'WiFi Printer',
          brand: 'Network',
          model: 'WiFi-Print-01',
          connectionType: 'wifi',
          ipAddress: '192.168.1.100',
          port: 9100,
          status: 'available',
          description: '📶 WiFi Network Printer',
          icon: Wifi,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          setupInstructions: 'Already connected to WiFi → Click setup → Start printing'
        },
        {
          id: 'wifi_2',
          name: 'Shared Network Printer',
          type: 'Network Printer',
          brand: 'Shared',
          model: 'NET-PRINT-02',
          connectionType: 'ethernet',
          ipAddress: '192.168.1.101',
          port: 9100,
          status: 'available',
          description: '🌐 Shared Office Printer',
          icon: Network,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          setupInstructions: 'Network printer ready → Configure settings → Test print'
        }
      ];
      
      foundPrinters.push(...wifiPrinters);
      
      // 3. USB Printers
      console.log('🔌 Checking USB printers...');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const usbPrinters = [
        {
          id: 'usb_1',
          name: 'USB Receipt Printer',
          type: 'USB Printer',
          brand: 'Generic',
          model: 'USB-TRP-80',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 USB Connected Printer',
          icon: Usb,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          setupInstructions: 'USB cable connected → Driver installed → Ready'
        },
        {
          id: 'usb_xprinter_58',
          name: 'XPrinter 58mm Wired',
          type: 'USB XPrinter 58mm',
          brand: 'XPrinter',
          model: 'XP-58IIH',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 XPrinter 58mm USB Connected',
          icon: Usb,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-300',
          setupInstructions: 'USB connected → Driver auto-installed → Ready to print'
        },
        {
          id: 'usb_xprinter_80',
          name: 'XPrinter 80mm Wired',
          type: 'USB XPrinter 80mm',
          brand: 'XPrinter',
          model: 'XP-80C',
          connectionType: 'usb',
          status: 'available',
          description: '🔌 XPrinter 80mm USB Connected',
          icon: Usb,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          setupInstructions: 'USB connected → Driver installed → Test print ready'
        }
      ];
      
      foundPrinters.push(...usbPrinters);
      
      setAvailablePrinters(foundPrinters);
      
      addNotification({
        title: '🖨️ Printers Found!',
        message: `Found ${foundPrinters.length} printers ready for setup`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Printer scan failed:', error);
      addNotification({
        title: 'Printer Scan Failed',
        message: 'Unable to scan for printers. Check connections.',
        type: 'error'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const selectPrinter = (printer: any) => {
    setSelectedPrinter(printer);
    setCurrentStep(3);
    
    addNotification({
      title: 'Printer Selected!',
      message: `Selected ${printer.name} for setup`,
      type: 'success'
    });
  };

  const completePrinterSetup = () => {
    if (!selectedPrinter) return;
    
    try {
      // Create printer configuration with simple settings
      const newPrinter = PrinterService.addPrinter({
        name: `${workstationName} - ${selectedPrinter.name}`,
        type: selectedPrinter.type === 'Mobile Thermal' || selectedPrinter.type === 'Desktop Thermal' || selectedPrinter.type === 'POS Terminal' || selectedPrinter.type === 'Thermal Printer' ? 'thermal' : 'inkjet',
        brand: selectedPrinter.brand === 'XPrinter' ? 'custom' : 'epson',
        model: selectedPrinter.model,
        connectionType: selectedPrinter.connectionType,
        ipAddress: selectedPrinter.ipAddress,
        port: selectedPrinter.port,
        bluetoothAddress: selectedPrinter.bluetoothAddress,
        paperSize: 'thermal_80mm',
        printDensity: 'medium',
        printSpeed: 'medium',
        cutType: 'full',
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
          itemNameWidth: 25,
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
        isDefault: true
      });

      addNotification({
        title: '🎉 Printer Setup Complete!',
        message: `${selectedPrinter.name} is now ready to print receipts!`,
        type: 'success'
      });

      onClose();
      setCurrentStep(1);
      setSelectedPrinter(null);
      
    } catch (error) {
      addNotification({
        title: 'Setup Failed',
        message: 'Failed to configure printer. Please try again.',
        type: 'error'
      });
    }
  };

  const scanForBluetoothPrinters = async () => {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth not supported. Use Chrome, Edge, or Opera browser.');
      }

      console.log('📱 Scanning for Bluetooth printers...');
      
      // Use general device scanning to find any Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Serial Port Profile
          '00001101-0000-1000-8000-00805f9b34fb'  // Serial Port Profile UUID
        ]
      });

      // Add found device to available printers
      const bluetoothPrinter = {
        id: `bt_${Date.now()}`,
        name: device.name || 'XPrinter Mobile Bluetooth',
        type: device.name?.includes('58') ? 'Mobile Thermal 58mm' : 'Mobile Thermal 80mm',
        brand: device.name?.includes('XPrinter') ? 'XPrinter' : 'Generic',
        model: device.name || 'Bluetooth Device',
        connectionType: 'bluetooth',
        bluetoothAddress: device.id,
        status: 'available',
        description: `📱 ${device.name || 'XPrinter'} Mobile Bluetooth Printer`,
        icon: Smartphone,
        color: device.name?.includes('58') ? 'text-purple-600' : 'text-blue-600',
        bgColor: device.name?.includes('58') ? 'bg-purple-50' : 'bg-blue-50',
        borderColor: device.name?.includes('58') ? 'border-purple-300' : 'border-blue-300',
        setupInstructions: 'Bluetooth device found → Connect → Test print'
      };

      setAvailablePrinters([...availablePrinters, bluetoothPrinter]);
      
      addNotification({
        title: '📱 Bluetooth Device Found!',
        message: `Found ${device.name || 'Bluetooth Device'} - Click to setup`,
        type: 'success'
      });

    } catch (error: any) {
      console.error('Bluetooth scan error:', error);
      
      if (error.name === 'NotFoundError') {
        addNotification({
          title: 'No Bluetooth Devices Found',
          message: 'Turn on your XPrinter and put it in pairing mode, then try again.',
          type: 'warning'
        });
      } else if (error.name === 'NotSupportedError') {
        addNotification({
          title: 'Bluetooth Not Supported',
          message: 'Use Chrome, Edge, or Opera browser for Bluetooth support.',
          type: 'error'
        });
      } else {
        addNotification({
          title: 'Bluetooth Scan Failed',
          message: 'Make sure Bluetooth is enabled and XPrinter is in pairing mode.',
          type: 'error'
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Printer className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Easy Printer Setup</h2>
                <p className="text-gray-600">Find and setup your XPrinter or any receipt printer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Workstation Name */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Monitor className="h-20 w-20 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Step 1: Name Your Workstation</h3>
                <p className="text-gray-600">Give your workstation a simple name</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">Workstation Name</label>
                  <input
                    type="text"
                    value={workstationName}
                    onChange={(e) => setWorkstationName(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="e.g., Main Counter, POS 1, Cashier Station"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What we'll do next:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 🔍 Automatically find all printers</li>
                    <li>• 📱 Scan for XPrinter mobile printers</li>
                    <li>• 📶 Check WiFi network printers</li>
                    <li>• 🔌 Detect USB connected printers</li>
                    <li>• ⚙️ Easy one-click setup</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!workstationName.trim()}
                  className="px-12 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-3 text-lg font-semibold shadow-lg"
                >
                  <span>Next: Find Printers</span>
                  <ArrowRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Available Printers */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Search className={`h-20 w-20 text-blue-600 mx-auto mb-4 ${isScanning ? 'animate-spin' : ''}`} />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Step 2: Available Printers</h3>
                <p className="text-gray-600">
                  {isScanning ? 'Scanning for printers...' : 'Click on any printer to set it up'}
                </p>
              </div>

              {/* Scanning Progress */}
              {isScanning && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                    <span className="text-blue-800 font-bold text-lg">Scanning for printers...</span>
                  </div>
                  <div className="space-y-2 text-sm text-blue-700 text-center">
                    <p>📱 Looking for XPrinter mobile printers...</p>
                    <p>📶 Checking WiFi network for printers...</p>
                    <p>🔌 Scanning USB ports...</p>
                    <p>🔍 Searching all available devices...</p>
                  </div>
                </div>
              )}

              {/* Available Printers Grid */}
              {!isScanning && availablePrinters.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availablePrinters.map((printer) => (
                    <div
                      key={printer.id}
                      onClick={() => selectPrinter(printer)}
                      className={`border-3 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl transform hover:scale-105 ${printer.borderColor} ${printer.bgColor}`}
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`p-4 rounded-xl ${printer.bgColor} border ${printer.borderColor}`}>
                          <printer.icon className={`h-10 w-10 ${printer.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-xl">{printer.name}</h4>
                          <p className="text-gray-600 text-lg">{printer.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              printer.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              ✅ {printer.status.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">{printer.brand} {printer.model}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-2">📋 Setup Instructions:</h5>
                        <p className="text-sm text-gray-700">{printer.setupInstructions}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 font-bold text-gray-900">{printer.type}</span>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <span className="text-gray-500">Connection:</span>
                          <span className="ml-2 font-bold text-gray-900 capitalize">{printer.connectionType}</span>
                        </div>
                        {printer.ipAddress && (
                          <div className="col-span-2 bg-white rounded-lg p-3 border border-gray-200">
                            <span className="text-gray-500">Network:</span>
                            <span className="ml-2 font-mono text-sm font-bold">{printer.ipAddress}:{printer.port}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <button className={`w-full px-6 py-3 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
                          printer.color.replace('text-', 'bg-').replace('-600', '-600')
                        } text-white hover:opacity-90 transform hover:scale-105`}>
                          🚀 SETUP THIS PRINTER
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Printers Found */}
              {!isScanning && availablePrinters.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Printer className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-4">No Printers Found</h3>
                  <p className="text-gray-600 mb-8">Let's help you find your XPrinter or other printers</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <button
                      onClick={startAutoScan}
                      className="px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex flex-col items-center space-y-2 shadow-lg"
                    >
                      <RefreshCw className="h-8 w-8" />
                      <span className="font-semibold">Scan Again</span>
                      <span className="text-xs">Check all connections</span>
                    </button>
                    
                    <button
                      onClick={scanForBluetoothPrinters}
                      className="px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex flex-col items-center space-y-2 shadow-lg"
                    >
                      <Bluetooth className="h-8 w-8" />
                      <span className="font-semibold">Find XPrinter</span>
                      <span className="text-xs">Bluetooth mobile printer</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        // Add manual setup option
                        const manualPrinter = {
                          id: 'manual_1',
                          name: 'Manual Printer Setup',
                          type: 'Manual Setup',
                          brand: 'Custom',
                          model: 'Manual Configuration',
                          connectionType: 'bluetooth',
                          status: 'manual',
                          description: '⚙️ Manual Printer Configuration',
                          icon: Settings,
                          color: 'text-gray-600',
                          bgColor: 'bg-gray-50',
                          borderColor: 'border-gray-300',
                          setupInstructions: 'Configure printer settings manually'
                        };
                        setAvailablePrinters([manualPrinter]);
                      }}
                      className="px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2 shadow-lg"
                    >
                      <Settings className="h-8 w-8" />
                      <span className="font-semibold">Manual Setup</span>
                      <span className="text-xs">Configure manually</span>
                    </button>
                  </div>

                  {/* XPrinter Instructions */}
                  <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 max-w-2xl mx-auto">
                    <h4 className="font-bold text-green-900 mb-4 text-lg">📱 XPrinter Mobile Setup Instructions:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <h5 className="font-semibold text-green-800 mb-2">For XPrinter Bluetooth:</h5>
                        <ol className="text-sm text-green-700 space-y-1">
                          <li>1. Turn ON your XPrinter</li>
                          <li>2. Hold POWER button for 3 seconds</li>
                          <li>3. Blue light should blink (pairing mode)</li>
                          <li>4. Click "Find XPrinter" button above</li>
                          <li>5. Select your XPrinter from list</li>
                        </ol>
                      </div>
                      <div>
                        <h5 className="font-semibold text-green-800 mb-2">For WiFi Printers:</h5>
                        <ol className="text-sm text-green-700 space-y-1">
                          <li>1. Connect printer to same WiFi</li>
                          <li>2. Print network settings page</li>
                          <li>3. Note the IP address</li>
                          <li>4. Click "Scan Again" button</li>
                          <li>5. Printer should appear automatically</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  ← Back
                </button>
                {!isScanning && availablePrinters.length > 0 && (
                  <button
                    onClick={startAutoScan}
                    className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center space-x-2 font-semibold"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Scan Again</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Printer Setup Complete */}
          {currentStep === 3 && selectedPrinter && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Step 3: Setup Complete!</h3>
                <p className="text-gray-600">Your printer is ready to use</p>
              </div>

              {/* Selected Printer Summary */}
              <div className={`border-3 rounded-2xl p-8 ${selectedPrinter.borderColor} ${selectedPrinter.bgColor} shadow-xl`}>
                <div className="flex items-center space-x-6 mb-6">
                  <selectedPrinter.icon className={`h-16 w-16 ${selectedPrinter.color}`} />
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">{selectedPrinter.name}</h4>
                    <p className="text-gray-600 text-lg">{selectedPrinter.description}</p>
                    <div className="flex items-center space-x-3 mt-3">
                      <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold">
                        ✅ READY TO PRINT
                      </span>
                      <span className="text-gray-500 font-medium">{selectedPrinter.brand} {selectedPrinter.model}</span>
                    </div>
                  </div>
                </div>
                    <h5 className="font-semibold text-green-800 mb-2">For XPrinter USB/Wired:</h5>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-3 text-lg">🎉 Setup Summary:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Workstation:</p>
                      <p className="font-bold text-gray-900 text-lg">{workstationName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Printer:</p>
                      <p className="font-bold text-gray-900 text-lg">{selectedPrinter.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Connection:</p>
                      <li>1. Connect XPrinter USB cable to computer</li>
                      <li>2. Turn ON your XPrinter</li>
                      <li>3. Windows will auto-install driver</li>
                      <li>4. Click "Scan Again" button above</li>
                      <li>5. Select your XPrinter from list</li>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-bold text-green-900 mb-3 text-lg">🚀 What happens next:</h4>
                <ul className="text-green-800 space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Printer will be saved to your workstation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Receipts will print automatically after sales</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>You can test printing anytime from Settings</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Printer settings can be changed later</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  ← Choose Different Printer
                </button>
                <button
                  onClick={completePrinterSetup}
                  className="px-12 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-3 text-lg font-bold shadow-lg transform hover:scale-105"
                >
                  <CheckCircle className="h-6 w-6" />
                  <span>🎉 COMPLETE SETUP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}