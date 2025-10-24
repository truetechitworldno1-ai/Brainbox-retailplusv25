import React, { useState } from 'react';
import { Upload, Download, FileText, Database, X } from 'lucide-react';
import { ImportExportService } from '../services/ImportExportService';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
}

export default function ImportExportModal({ isOpen, onClose, mode }: ImportExportModalProps) {
  const { products, customers, suppliers, sales } = useData();
  const { addNotification } = useNotification();
  const [selectedFormat, setSelectedFormat] = useState<'quickbooks' | 'csv' | 'json' | 'excel'>('quickbooks');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['products']);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formats = [
    { value: 'quickbooks', label: 'QuickBooks (.qbx)', icon: Database },
    { value: 'csv', label: 'CSV (.csv)', icon: FileText },
    { value: 'json', label: 'JSON (.json)', icon: FileText },
    { value: 'excel', label: 'Excel (.xlsx)', icon: FileText },
  ];

  const dataTypes = [
    { value: 'products', label: 'Products & Inventory' },
    { value: 'customers', label: 'Customers & Loyalty' },
    { value: 'suppliers', label: 'Suppliers & Vendors' },
    { value: 'sales', label: 'Sales & Transactions' },
  ];

  const handleExport = async () => {
    setIsProcessing(true);
    
    try {
      const exportData = {
        products: selectedDataTypes.includes('products') ? products : undefined,
        customers: selectedDataTypes.includes('customers') ? customers : undefined,
        suppliers: selectedDataTypes.includes('suppliers') ? suppliers : undefined,
        sales: selectedDataTypes.includes('sales') ? sales : undefined,
        format: selectedFormat,
        timestamp: new Date()
      };

      let content = '';
      let filename = '';
      let mimeType = '';

      switch (selectedFormat) {
        case 'quickbooks':
          content = ImportExportService.exportToQuickBooks(exportData);
          filename = `brainbox_export_${Date.now()}.qbx`;
          mimeType = 'application/json';
          break;
        case 'csv':
          content = ImportExportService.exportToCSV(exportData);
          filename = `brainbox_export_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = ImportExportService.exportToJSON(exportData);
          filename = `brainbox_export_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addNotification({
        title: 'Export Successful',
        message: `Data exported successfully as ${selectedFormat.toUpperCase()}`,
        type: 'success'
      });

      onClose();
    } catch (error) {
      addNotification({
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const content = await file.text();
      let importedData;

      switch (selectedFormat) {
        case 'quickbooks':
          importedData = await ImportExportService.importFromQuickBooks(content);
          break;
        case 'csv':
          importedData = await ImportExportService.importFromCSV(content);
          break;
        case 'json':
          importedData = JSON.parse(content);
          break;
        default:
          throw new Error('Unsupported format');
      }

      console.log('Import completed:', importedData);

      addNotification({
        title: 'Import Successful',
        message: `Data imported successfully from ${selectedFormat.toUpperCase()}`,
        type: 'success'
      });

      onClose();
    } catch (error) {
      addNotification({
        title: 'Import Failed',
        message: 'Failed to import data. Please check file format.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              {mode === 'import' ? <Upload className="h-5 w-5 mr-2" /> : <Download className="h-5 w-5 mr-2" />}
              {mode === 'import' ? 'Import Data' : 'Export Data'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedFormat === format.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <format.icon className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{format.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Data to {mode === 'import' ? 'Import' : 'Export'}
            </label>
            <div className="space-y-2">
              {dataTypes.map((dataType) => (
                <label key={dataType.value} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedDataTypes.includes(dataType.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDataTypes([...selectedDataTypes, dataType.value]);
                      } else {
                        setSelectedDataTypes(selectedDataTypes.filter(t => t !== dataType.value));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{dataType.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {mode === 'export' ? (
              <button
                onClick={handleExport}
                disabled={isProcessing || selectedDataTypes.length === 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{isProcessing ? 'Exporting...' : 'Export Data'}</span>
              </button>
            ) : (
              <label className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>{isProcessing ? 'Importing...' : 'Select File'}</span>
                <input
                  type="file"
                  onChange={handleImport}
                  accept=".qbx,.csv,.json,.xlsx"
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}