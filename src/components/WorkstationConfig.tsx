import React, { useState } from 'react';
import { Monitor, Printer, Scan, Settings, Plus, Edit, Trash2, Scale, DollarSign, Package } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { WorkstationConfig } from '../types';

export default function WorkstationConfigPanel() {
  const { systemSettings, updateSystemSettings } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkstation, setEditingWorkstation] = useState<WorkstationConfig | null>(null);
  const [workstationForm, setWorkstationForm] = useState({
    name: '',
    type: 'pos' as 'pos' | 'price_checker' | 'inventory' | 'admin',
    location: '',
    ipAddress: '',
    macAddress: '',
    // Printer Configuration
    printerEnabled: false,
    printerName: '',
    printerModel: '',
    printerConnection: 'usb' as 'usb' | 'network' | 'bluetooth',
    printerIP: '',
    paperSize: 'thermal_80mm' as 'thermal_58mm' | 'thermal_80mm' | 'a4',
    autoprint: true,
    copies: 1,
    headerText: '',
    footerText: '',
    // Scanner Configuration
    scannerEnabled: false,
    scannerModel: '',
    scannerType: 'usb' as 'usb' | 'bluetooth' | 'wireless',
    connectionPort: '',
    autoSubmit: true,
    beepOnScan: true,
    scanPrefix: '',
    scanSuffix: '',
    // Display Configuration
    customerDisplay: false,
    customerDisplayModel: '',
    dualMonitor: false,
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    theme: 'light' as 'light' | 'dark' | 'auto',
    language: 'en',
    // Cash Drawer Configuration
    cashDrawerEnabled: false,
    cashDrawerModel: '',
    cashDrawerConnection: 'usb' as 'usb' | 'network' | 'serial',
    openOnSale: true,
    openCommand: '',
    // Scale Configuration
    scaleEnabled: false,
    scaleModel: '',
    scaleConnection: 'usb' as 'usb' | 'serial',
    scaleUnit: 'kg' as 'kg' | 'lb',
    scalePrecision: 2
  });

  const workstationTypes = [
    { value: 'pos', label: 'Point of Sale Terminal', icon: Monitor, description: 'Main sales terminal with full features' },
    { value: 'price_checker', label: 'Price Checker Station', icon: Scan, description: 'Customer self-service price checking' },
    { value: 'inventory', label: 'Inventory Management', icon: Package, description: 'Stock management and receiving' },
    { value: 'admin', label: 'Administrative Terminal', icon: Settings, description: 'Management and reporting station' },
  ];

  const printerModels = [
    'Epson TM-T20III',
    'Epson TM-T82III',
    'Star TSP143III',
    'Citizen CT-S310II',
    'Bixolon SRP-330II',
    'Custom Model'
  ];

  const scannerModels = [
    'Honeywell Voyager 1200g',
    'Symbol LS2208',
    'Datalogic QuickScan QD2430',
    'Zebra DS2208',
    'Code CR1000',
    'Custom Model'
  ];

  const handleAddWorkstation = () => {
    const newWorkstation: WorkstationConfig = {
      id: Date.now().toString(),
      name: workstationForm.name,
      type: workstationForm.type,
      location: workstationForm.location,
      ipAddress: workstationForm.ipAddress,
      macAddress: workstationForm.macAddress,
      printerConfig: workstationForm.printerEnabled ? {
        enabled: true,
        printerName: workstationForm.printerName,
        printerModel: workstationForm.printerModel,
        connectionType: workstationForm.printerConnection,
        ipAddress: workstationForm.printerIP,
        paperSize: workstationForm.paperSize,
        autoprint: workstationForm.autoprint,
        copies: workstationForm.copies,
        headerText: workstationForm.headerText,
        footerText: workstationForm.footerText,
      } : undefined,
      scannerConfig: workstationForm.scannerEnabled ? {
        enabled: true,
        scannerModel: workstationForm.scannerModel,
        scannerType: workstationForm.scannerType,
        connectionPort: workstationForm.connectionPort,
        autoSubmit: workstationForm.autoSubmit,
        beepOnScan: workstationForm.beepOnScan,
        scanPrefix: workstationForm.scanPrefix,
        scanSuffix: workstationForm.scanSuffix,
      } : undefined,
      displayConfig: {
        customerDisplay: workstationForm.customerDisplay,
        customerDisplayModel: workstationForm.customerDisplayModel,
        dualMonitor: workstationForm.dualMonitor,
        fontSize: workstationForm.fontSize,
        theme: workstationForm.theme,
        language: workstationForm.language,
      },
      cashDrawerConfig: workstationForm.cashDrawerEnabled ? {
        enabled: true,
        model: workstationForm.cashDrawerModel,
        connectionType: workstationForm.cashDrawerConnection,
        openOnSale: workstationForm.openOnSale,
        openCommand: workstationForm.openCommand,
      } : undefined,
      scaleConfig: workstationForm.scaleEnabled ? {
        enabled: true,
        model: workstationForm.scaleModel,
        connectionType: workstationForm.scaleConnection,
        unit: workstationForm.scaleUnit,
        precision: workstationForm.scalePrecision,
      } : undefined,
      isActive: true,
      createdAt: new Date(),
    };

    updateSystemSettings({
      workstations: [...systemSettings.workstations, newWorkstation]
    });

    resetForm();
    setShowAddModal(false);
  };

  const resetForm = () => {
    setWorkstationForm({
      name: '',
      type: 'pos',
      location: '',
      ipAddress: '',
      macAddress: '',
      printerEnabled: false,
      printerName: '',
      printerModel: '',
      printerConnection: 'usb',
      printerIP: '',
      paperSize: 'thermal_80mm',
      autoprint: true,
      copies: 1,
      headerText: '',
      footerText: '',
      scannerEnabled: false,
      scannerModel: '',
      scannerType: 'usb',
      connectionPort: '',
      autoSubmit: true,
      beepOnScan: true,
      scanPrefix: '',
      scanSuffix: '',
      customerDisplay: false,
      customerDisplayModel: '',
      dualMonitor: false,
      fontSize: 'medium',
      theme: 'light',
      language: 'en',
      cashDrawerEnabled: false,
      cashDrawerModel: '',
      cashDrawerConnection: 'usb',
      openOnSale: true,
      openCommand: '',
      scaleEnabled: false,
      scaleModel: '',
      scaleConnection: 'usb',
      scaleUnit: 'kg',
      scalePrecision: 2
    });
    setEditingWorkstation(null);
  };

  const removeWorkstation = (id: string) => {
    updateSystemSettings({
      workstations: systemSettings.workstations.filter(ws => ws.id !== id)
    });
  };

  const editWorkstation = (workstation: WorkstationConfig) => {
    setWorkstationForm({
      name: workstation.name,
      type: workstation.type,
      location: workstation.location,
      ipAddress: workstation.ipAddress || '',
      macAddress: workstation.macAddress || '',
      printerEnabled: !!workstation.printerConfig?.enabled,
      printerName: workstation.printerConfig?.printerName || '',
      printerModel: workstation.printerConfig?.printerModel || '',
      printerConnection: workstation.printerConfig?.connectionType || 'usb',
      printerIP: workstation.printerConfig?.ipAddress || '',
      paperSize: workstation.printerConfig?.paperSize || 'thermal_80mm',
      autoprint: workstation.printerConfig?.autoprint ?? true,
      copies: workstation.printerConfig?.copies || 1,
      headerText: workstation.printerConfig?.headerText || '',
      footerText: workstation.printerConfig?.footerText || '',
      scannerEnabled: !!workstation.scannerConfig?.enabled,
      scannerModel: workstation.scannerConfig?.scannerModel || '',
      scannerType: workstation.scannerConfig?.scannerType || 'usb',
      connectionPort: workstation.scannerConfig?.connectionPort || '',
      autoSubmit: workstation.scannerConfig?.autoSubmit ?? true,
      beepOnScan: workstation.scannerConfig?.beepOnScan ?? true,
      scanPrefix: workstation.scannerConfig?.scanPrefix || '',
      scanSuffix: workstation.scannerConfig?.scanSuffix || '',
      customerDisplay: workstation.displayConfig?.customerDisplay ?? false,
      customerDisplayModel: workstation.displayConfig?.customerDisplayModel || '',
      dualMonitor: workstation.displayConfig?.dualMonitor ?? false,
      fontSize: workstation.displayConfig?.fontSize || 'medium',
      theme: workstation.displayConfig?.theme || 'light',
      language: workstation.displayConfig?.language || 'en',
      cashDrawerEnabled: !!workstation.cashDrawerConfig?.enabled,
      cashDrawerModel: workstation.cashDrawerConfig?.model || '',
      cashDrawerConnection: workstation.cashDrawerConfig?.connectionType || 'usb',
      openOnSale: workstation.cashDrawerConfig?.openOnSale ?? true,
      openCommand: workstation.cashDrawerConfig?.openCommand || '',
      scaleEnabled: !!workstation.scaleConfig?.enabled,
      scaleModel: workstation.scaleConfig?.model || '',
      scaleConnection: workstation.scaleConfig?.connectionType || 'usb',
      scaleUnit: workstation.scaleConfig?.unit || 'kg',
      scalePrecision: workstation.scaleConfig?.precision || 2
    });
    setEditingWorkstation(workstation);
    setShowAddModal(true);
  };

  const updateWorkstation = () => {
    if (!editingWorkstation) return;

    const updatedWorkstation: WorkstationConfig = {
      ...editingWorkstation,
      name: workstationForm.name,
      type: workstationForm.type,
      location: workstationForm.location,
      ipAddress: workstationForm.ipAddress,
      macAddress: workstationForm.macAddress,
      printerConfig: workstationForm.printerEnabled ? {
        enabled: true,
        printerName: workstationForm.printerName,
        printerModel: workstationForm.printerModel,
        connectionType: workstationForm.printerConnection,
        ipAddress: workstationForm.printerIP,
        paperSize: workstationForm.paperSize,
        autoprint: workstationForm.autoprint,
        copies: workstationForm.copies,
        headerText: workstationForm.headerText,
        footerText: workstationForm.footerText,
      } : undefined,
      scannerConfig: workstationForm.scannerEnabled ? {
        enabled: true,
        scannerModel: workstationForm.scannerModel,
        scannerType: workstationForm.scannerType,
        connectionPort: workstationForm.connectionPort,
        autoSubmit: workstationForm.autoSubmit,
        beepOnScan: workstationForm.beepOnScan,
        scanPrefix: workstationForm.scanPrefix,
        scanSuffix: workstationForm.scanSuffix,
      } : undefined,
      displayConfig: {
        customerDisplay: workstationForm.customerDisplay,
        customerDisplayModel: workstationForm.customerDisplayModel,
        dualMonitor: workstationForm.dualMonitor,
        fontSize: workstationForm.fontSize,
        theme: workstationForm.theme,
        language: workstationForm.language,
      },
      cashDrawerConfig: workstationForm.cashDrawerEnabled ? {
        enabled: true,
        model: workstationForm.cashDrawerModel,
        connectionType: workstationForm.cashDrawerConnection,
        openOnSale: workstationForm.openOnSale,
        openCommand: workstationForm.openCommand,
      } : undefined,
      scaleConfig: workstationForm.scaleEnabled ? {
        enabled: true,
        model: workstationForm.scaleModel,
        connectionType: workstationForm.scaleConnection,
        unit: workstationForm.scaleUnit,
        precision: workstationForm.scalePrecision,
      } : undefined,
    };

    updateSystemSettings({
      workstations: systemSettings.workstations.map(ws => 
        ws.id === editingWorkstation.id ? updatedWorkstation : ws
      )
    });

    resetForm();
    setEditingWorkstation(null);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Workstation Configuration</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Workstation</span>
        </button>
      </div>

      {/* Workstation List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systemSettings.workstations.map((workstation) => {
          const typeInfo = workstationTypes.find(t => t.value === workstation.type);
          return (
            <div key={workstation.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {typeInfo && <typeInfo.icon className="h-6 w-6 text-blue-600" />}
                  <div>
                    <h4 className="font-semibold text-gray-900">{workstation.name}</h4>
                    <p className="text-sm text-gray-600">{typeInfo?.label}</p>
                    <p className="text-xs text-gray-500">{workstation.location}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => editWorkstation(workstation)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeWorkstation(workstation.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {workstation.printerConfig?.enabled && (
                  <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-2 rounded">
                    <Printer className="h-4 w-4" />
                    <span>{workstation.printerConfig.printerModel} ({workstation.printerConfig.paperSize})</span>
                  </div>
                )}
                {workstation.scannerConfig?.enabled && (
                  <div className="flex items-center space-x-2 text-blue-700 bg-blue-50 p-2 rounded">
                    <Scan className="h-4 w-4" />
                    <span>{workstation.scannerConfig.scannerModel} ({workstation.scannerConfig.scannerType})</span>
                  </div>
                )}
                {workstation.cashDrawerConfig?.enabled && (
                  <div className="flex items-center space-x-2 text-purple-700 bg-purple-50 p-2 rounded">
                    <DollarSign className="h-4 w-4" />
                    <span>Cash Drawer: {workstation.cashDrawerConfig.model}</span>
                  </div>
                )}
                {workstation.scaleConfig?.enabled && (
                  <div className="flex items-center space-x-2 text-orange-700 bg-orange-50 p-2 rounded">
                    <Scale className="h-4 w-4" />
                    <span>Scale: {workstation.scaleConfig.model} ({workstation.scaleConfig.unit})</span>
                  </div>
                )}
                {workstation.displayConfig?.customerDisplay && (
                  <div className="flex items-center space-x-2 text-indigo-700 bg-indigo-50 p-2 rounded">
                    <Monitor className="h-4 w-4" />
                    <span>Customer Display: {workstation.displayConfig.customerDisplayModel}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Workstation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {editingWorkstation ? 'Edit Workstation' : 'Add New Workstation'}
              </h3>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workstation Name *</label>
                    <input
                      type="text"
                      value={workstationForm.name}
                      onChange={(e) => setWorkstationForm({...workstationForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Main POS Terminal"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select
                      value={workstationForm.type}
                      onChange={(e) => setWorkstationForm({...workstationForm, type: e.target.value as any})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {workstationTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={workstationForm.location}
                      onChange={(e) => setWorkstationForm({...workstationForm, location: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Counter 1, Main Floor"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                    <input
                      type="text"
                      value={workstationForm.ipAddress}
                      onChange={(e) => setWorkstationForm({...workstationForm, ipAddress: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="192.168.1.100"
                    />
                  </div>
                </div>

                {/* Printer Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={workstationForm.printerEnabled}
                      onChange={(e) => setWorkstationForm({...workstationForm, printerEnabled: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Printer className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Printer Configuration</span>
                  </div>
                  
                  {workstationForm.printerEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Printer Name</label>
                        <input
                          type="text"
                          value={workstationForm.printerName}
                          onChange={(e) => setWorkstationForm({...workstationForm, printerName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Receipt Printer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Printer Model</label>
                        <select
                          value={workstationForm.printerModel}
                          onChange={(e) => setWorkstationForm({...workstationForm, printerModel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Model</option>
                          {printerModels.map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
                        <select
                          value={workstationForm.printerConnection}
                          onChange={(e) => setWorkstationForm({...workstationForm, printerConnection: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="usb">USB</option>
                          <option value="network">Network</option>
                          <option value="bluetooth">Bluetooth</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                        <select
                          value={workstationForm.paperSize}
                          onChange={(e) => setWorkstationForm({...workstationForm, paperSize: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="thermal_58mm">Thermal 58mm</option>
                          <option value="thermal_80mm">Thermal 80mm</option>
                          <option value="a4">A4 Paper</option>
                        </select>
                      </div>
                      {workstationForm.printerConnection === 'network' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Printer IP Address</label>
                          <input
                            type="text"
                            value={workstationForm.printerIP}
                            onChange={(e) => setWorkstationForm({...workstationForm, printerIP: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="192.168.1.101"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Copies</label>
                        <input
                          type="number"
                          value={workstationForm.copies}
                          onChange={(e) => setWorkstationForm({...workstationForm, copies: parseInt(e.target.value) || 1})}
                          min="1"
                          max="5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={workstationForm.autoprint}
                              onChange={(e) => setWorkstationForm({...workstationForm, autoprint: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Auto-print receipts</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scanner Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={workstationForm.scannerEnabled}
                      onChange={(e) => setWorkstationForm({...workstationForm, scannerEnabled: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Scan className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Scanner Configuration</span>
                  </div>
                  
                  {workstationForm.scannerEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scanner Model</label>
                        <select
                          value={workstationForm.scannerModel}
                          onChange={(e) => setWorkstationForm({...workstationForm, scannerModel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Model</option>
                          {scannerModels.map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scanner Type</label>
                        <select
                          value={workstationForm.scannerType}
                          onChange={(e) => setWorkstationForm({...workstationForm, scannerType: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="usb">USB Scanner</option>
                          <option value="bluetooth">Bluetooth Scanner</option>
                          <option value="wireless">Wireless Scanner</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Connection Port</label>
                        <input
                          type="text"
                          value={workstationForm.connectionPort}
                          onChange={(e) => setWorkstationForm({...workstationForm, connectionPort: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="COM1, /dev/ttyUSB0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={workstationForm.autoSubmit}
                              onChange={(e) => setWorkstationForm({...workstationForm, autoSubmit: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Auto-submit on scan</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={workstationForm.beepOnScan}
                              onChange={(e) => setWorkstationForm({...workstationForm, beepOnScan: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Beep on scan</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cash Drawer Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={workstationForm.cashDrawerEnabled}
                      onChange={(e) => setWorkstationForm({...workstationForm, cashDrawerEnabled: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Cash Drawer Configuration</span>
                  </div>
                  
                  {workstationForm.cashDrawerEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cash Drawer Model</label>
                        <input
                          type="text"
                          value={workstationForm.cashDrawerModel}
                          onChange={(e) => setWorkstationForm({...workstationForm, cashDrawerModel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Star SMD2-1317"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
                        <select
                          value={workstationForm.cashDrawerConnection}
                          onChange={(e) => setWorkstationForm({...workstationForm, cashDrawerConnection: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="usb">USB</option>
                          <option value="network">Network</option>
                          <option value="serial">Serial</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={workstationForm.openOnSale}
                            onChange={(e) => setWorkstationForm({...workstationForm, openOnSale: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Open drawer automatically on sale completion</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scale Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={workstationForm.scaleEnabled}
                      onChange={(e) => setWorkstationForm({...workstationForm, scaleEnabled: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Scale className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Digital Scale Configuration</span>
                  </div>
                  
                  {workstationForm.scaleEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scale Model</label>
                        <input
                          type="text"
                          value={workstationForm.scaleModel}
                          onChange={(e) => setWorkstationForm({...workstationForm, scaleModel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Mettler Toledo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
                        <select
                          value={workstationForm.scaleConnection}
                          onChange={(e) => setWorkstationForm({...workstationForm, scaleConnection: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="usb">USB</option>
                          <option value="serial">Serial</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                          value={workstationForm.scaleUnit}
                          onChange={(e) => setWorkstationForm({...workstationForm, scaleUnit: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="kg">Kilograms (kg)</option>
                          <option value="lb">Pounds (lb)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precision (decimal places)</label>
                        <input
                          type="number"
                          value={workstationForm.scalePrecision}
                          onChange={(e) => setWorkstationForm({...workstationForm, scalePrecision: parseInt(e.target.value) || 2})}
                          min="0"
                          max="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Display Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Monitor className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Display Configuration</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                      <select
                        value={workstationForm.fontSize}
                        onChange={(e) => setWorkstationForm({...workstationForm, fontSize: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                      <select
                        value={workstationForm.theme}
                        onChange={(e) => setWorkstationForm({...workstationForm, theme: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={workstationForm.customerDisplay}
                            onChange={(e) => setWorkstationForm({...workstationForm, customerDisplay: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Customer display</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={workstationForm.dualMonitor}
                            onChange={(e) => setWorkstationForm({...workstationForm, dualMonitor: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Dual monitor setup</span>
                        </label>
                      </div>
                    </div>
                    {workstationForm.customerDisplay && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Display Model</label>
                        <input
                          type="text"
                          value={workstationForm.customerDisplayModel}
                          onChange={(e) => setWorkstationForm({...workstationForm, customerDisplayModel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Epson DM-D110"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingWorkstation(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingWorkstation ? updateWorkstation : handleAddWorkstation}
                  disabled={!workstationForm.name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingWorkstation ? 'Update Workstation' : 'Add Workstation'}
                </button>
              </div>
               
               <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                 <p className="text-sm text-green-800">
                   <strong>Note:</strong> Workstation configurations are automatically saved and applied to the selected terminal.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}