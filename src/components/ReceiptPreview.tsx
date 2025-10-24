import React from 'react';
import { X, Printer } from 'lucide-react';
import { Sale, Customer } from '../types';
import { useData } from '../contexts/DataContext';
import { PrinterService } from '../services/PrinterService';

interface ReceiptPreviewProps {
  sale: Sale;
  customer?: Customer;
  onClose: () => void;
  onPrint?: () => void;
}

export default function ReceiptPreview({ sale, customer, onClose, onPrint }: ReceiptPreviewProps) {
  const { systemSettings } = useData();
  const [selectedPrinter, setSelectedPrinter] = React.useState<string>('');
  const [availablePrinters, setAvailablePrinters] = React.useState<any[]>([]);

  React.useEffect(() => {
    const printers = PrinterService.getAllPrinters();
    setAvailablePrinters(printers);
    
    // Auto-select default printer
    const defaultPrinter = PrinterService.getDefaultPrinter();
    if (defaultPrinter) {
      setSelectedPrinter(defaultPrinter.id);
    }
  }, []);

  const printReceipt = () => {
    const printer = availablePrinters.find(p => p.id === selectedPrinter);
    if (printer) {
      // Use printer's business information for receipt
      const businessInfo = printer.businessInfo;
      const receiptLayout = printer.receiptLayout;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt ${sale.receiptNumber}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: ${receiptLayout.fontSize === 'small' ? '10px' : receiptLayout.fontSize === 'large' ? '14px' : '12px'}; 
                margin: 0; 
                padding: 20px;
                background: white;
                line-height: ${receiptLayout.lineSpacing === 'compact' ? '1.2' : receiptLayout.lineSpacing === 'wide' ? '1.8' : '1.5'};
              }
              .receipt { 
                width: ${printer.paperSize === 'thermal_58mm' ? '200px' : printer.paperSize === 'thermal_80mm' ? '300px' : '400px'}; 
                margin: 0 auto; 
                background: white;
                position: relative;
              }
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 24px;
                color: rgba(0, 0, 0, 0.1);
                font-weight: bold;
                z-index: 1;
                pointer-events: none;
              }
              .content {
                position: relative;
                z-index: 2;
              }
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .border-top { border-top: 1px dashed #000; margin: 5px 0; }
              .header { margin-bottom: 10px; }
              .footer { margin-top: 10px; font-size: 10px; }
              .item-line { display: flex; justify-content: space-between; margin: 2px 0; }
              .business-logo { max-width: 100px; max-height: 50px; margin: 0 auto 10px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <!-- Watermark -->
              <div class="watermark">BrainBox-RetailPlus V25</div>
              
              <div class="content">
                <!-- Header -->
                <div class="header center">
                  ${receiptLayout.showLogo && businessInfo.logo ? `<img src="${businessInfo.logo}" alt="Logo" class="business-logo" />` : ''}
                  ${receiptLayout.showBusinessInfo ? `
                    <div class="bold">${businessInfo.companyName}</div>
                    <div>${businessInfo.address}</div>
                    ${businessInfo.city && businessInfo.state ? `<div>${businessInfo.city}, ${businessInfo.state}</div>` : ''}
                    <div>${businessInfo.phone}</div>
                    ${businessInfo.email ? `<div>${businessInfo.email}</div>` : ''}
                    ${businessInfo.website ? `<div>${businessInfo.website}</div>` : ''}
                  ` : ''}
                  ${receiptLayout.showTaxInfo ? `
                    ${businessInfo.registrationNumber ? `<div>RC: ${businessInfo.registrationNumber}</div>` : ''}
                    ${businessInfo.taxId ? `<div>TIN: ${businessInfo.taxId}</div>` : ''}
                  ` : ''}
                  ${receiptLayout.headerText ? `<div style="margin-top: 10px;">${receiptLayout.headerText.replace(/\n/g, '<br>')}</div>` : ''}
                </div>
                
                <div class="border-top"></div>
                
                <!-- Transaction Details -->
                <div>
                  <div>Receipt #: ${sale.receiptNumber}</div>
                  ${receiptLayout.showDateTime ? `
                    <div>Date: ${sale.timestamp.toLocaleDateString()}</div>
                    <div>Time: ${sale.timestamp.toLocaleTimeString()}</div>
                  ` : ''}
                  ${receiptLayout.showCustomerInfo ? `<div>Customer: ${customer?.name || 'Walk-in'}</div>` : ''}
                  ${receiptLayout.showLoyaltyInfo && customer?.loyaltyCard ? `<div>Loyalty Card: ${customer.loyaltyCard.cardNumber}</div>` : ''}
                  ${receiptLayout.showCashier ? `<div>Cashier: System</div>` : ''}
                </div>
                
                <div class="border-top"></div>
                
                <!-- Items -->
                <div>
                  ${sale.items.map(item => `
                    <div class="item-line">
                      <span>${item.productName.substring(0, receiptLayout.itemNameWidth)}</span>
                    </div>
                    <div class="item-line">
                      <span>${item.quantity} x ₦${item.unitPrice.toLocaleString()}</span>
                      <span>₦${item.total.toLocaleString()}</span>
                    </div>
                  `).join('')}
                </div>
                
                <div class="border-top"></div>
                
                <!-- Totals -->
                <div>
                  <div class="item-line">
                    <span>Subtotal:</span>
                    <span>₦${sale.subtotal.toLocaleString()}</span>
                  </div>
                  ${sale.discount > 0 ? `
                    <div class="item-line">
                      <span>Discount:</span>
                      <span>-₦${sale.discount.toLocaleString()}</span>
                    </div>
                  ` : ''}
                  ${sale.tax > 0 ? `
                    <div class="item-line">
                      <span>Tax:</span>
                      <span>₦${sale.tax.toLocaleString()}</span>
                    </div>
                  ` : ''}
                  <div class="item-line bold">
                    <span>TOTAL:</span>
                    <span>₦${sale.total.toLocaleString()}</span>
                  </div>
                </div>
                
                <div class="border-top"></div>
                
                <!-- Payment Details -->
                <div>
                  <div>Payment: ${sale.paymentMethod.toUpperCase()}</div>
                  ${sale.paymentDetails.length > 1 ? 
                    sale.paymentDetails.map(detail => `
                      <div>${detail.method.toUpperCase()}: ₦${detail.amount.toLocaleString()}</div>
                    `).join('') : ''
                  }
                  ${receiptLayout.showLoyaltyInfo && customer?.loyaltyCard && sale.loyaltyPointsEarned > 0 ? `
                    <div>Points Earned: ${sale.loyaltyPointsEarned}</div>
                    <div>Total Points: ${customer.loyaltyCard.points + sale.loyaltyPointsEarned}</div>
                  ` : ''}
                </div>
                
                <!-- Footer -->
                <div class="footer center">
                  <div class="border-top"></div>
                  ${receiptLayout.footerText ? `<div>${receiptLayout.footerText.replace(/\n/g, '<br>')}</div>` : ''}
                  
                  <!-- Permanent Watermark Footer -->
                  <div style="margin-top: 10px; color: #666; font-size: 8px;">
                    Powered by BrainBox-RetailPlus V25 | TIW<br>
                    © 2025 Technology Innovation Worldwide<br>
                    Support: truetechitworldno1@gmail.com
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      
      return;
    }

    // Fallback to default printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${sale.receiptNumber}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 20px;
              background: white;
            }
            .receipt { 
              width: 300px; 
              margin: 0 auto; 
              background: white;
              position: relative;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 24px;
              color: rgba(0, 0, 0, 0.1);
              font-weight: bold;
              z-index: 1;
              pointer-events: none;
            }
            .content {
              position: relative;
              z-index: 2;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .border-top { border-top: 1px dashed #000; margin: 5px 0; }
            .header { margin-bottom: 10px; }
            .footer { margin-top: 10px; font-size: 10px; }
            .item-line { display: flex; justify-content: space-between; margin: 2px 0; }
            .business-logo { max-width: 100px; max-height: 50px; margin: 0 auto 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <!-- Watermark -->
            <div class="watermark">BrainBox-RetailPlus V25</div>
            
            <div class="content">
              <!-- Header -->
              <div class="header center">
                ${systemSettings.businessLogo ? `<img src="${systemSettings.businessLogo}" alt="Logo" class="business-logo" />` : ''}
                <div class="bold">${systemSettings.businessName}</div>
                <div>${systemSettings.businessAddress}</div>
                <div>${systemSettings.businessPhone}</div>
                <div>${systemSettings.businessEmail}</div>
                ${systemSettings.businessRegistration ? `<div>RC: ${systemSettings.businessRegistration}</div>` : ''}
                ${systemSettings.taxId ? `<div>TIN: ${systemSettings.taxId}</div>` : ''}
                ${systemSettings.receiptHeader ? `<div style="margin-top: 10px;">${systemSettings.receiptHeader.replace(/\n/g, '<br>')}</div>` : ''}
              </div>
              
              <div class="border-top"></div>
              
              <!-- Transaction Details -->
              <div>
                <div>Receipt #: ${sale.receiptNumber}</div>
                <div>Date: ${sale.timestamp.toLocaleDateString()}</div>
                <div>Time: ${sale.timestamp.toLocaleTimeString()}</div>
                ${customer ? `<div>Customer: ${customer.name}</div>` : '<div>Customer: Walk-in</div>'}
                ${customer?.loyaltyCard ? `<div>Loyalty Card: ${customer.loyaltyCard.cardNumber}</div>` : ''}
              </div>
              
              <div class="border-top"></div>
              
              <!-- Items -->
              <div>
                ${sale.items.map(item => `
                  <div class="item-line">
                    <span>${item.productName}</span>
                  </div>
                  <div class="item-line">
                    <span>${item.quantity} x ₦${item.unitPrice.toLocaleString()}</span>
                    <span>₦${item.total.toLocaleString()}</span>
                  </div>
                `).join('')}
              </div>
              
              <div class="border-top"></div>
              
              <!-- Totals -->
              <div>
                <div class="item-line">
                  <span>Subtotal:</span>
                  <span>₦${sale.subtotal.toLocaleString()}</span>
                </div>
                ${sale.discount > 0 ? `
                  <div class="item-line">
                    <span>Discount:</span>
                    <span>-₦${sale.discount.toLocaleString()}</span>
                  </div>
                ` : ''}
                ${sale.tax > 0 ? `
                  <div class="item-line">
                    <span>Tax (${systemSettings.taxRate}%):</span>
                    <span>₦${sale.tax.toLocaleString()}</span>
                  </div>
                ` : ''}
                <div class="item-line bold">
                  <span>TOTAL:</span>
                  <span>₦${sale.total.toLocaleString()}</span>
                </div>
              </div>
              
              <div class="border-top"></div>
              
              <!-- Payment Details -->
              <div>
                <div>Payment: ${sale.paymentMethod.toUpperCase()}</div>
                ${sale.paymentDetails.length > 1 ? 
                  sale.paymentDetails.map(detail => `
                    <div>${detail.method.toUpperCase()}: ₦${detail.amount.toLocaleString()}</div>
                  `).join('') : ''
                }
                ${customer?.loyaltyCard && sale.loyaltyPointsEarned > 0 ? `
                  <div>Points Earned: ${sale.loyaltyPointsEarned}</div>
                  <div>Total Points: ${customer.loyaltyCard.points + sale.loyaltyPointsEarned}</div>
                ` : ''}
              </div>
              
              <!-- Footer -->
              <div class="footer center">
                <div class="border-top"></div>
                ${systemSettings.receiptFooter ? `<div>${systemSettings.receiptFooter.replace(/\n/g, '<br>')}</div>` : ''}
                ${systemSettings.returnPolicy ? `<div style="margin-top: 5px;">${systemSettings.returnPolicy}</div>` : ''}
                ${systemSettings.contactInfo ? `<div style="margin-top: 5px;">${systemSettings.contactInfo.replace(/\n/g, '<br>')}</div>` : ''}
                
                <div style="margin-top: 10px; color: #666; font-size: 8px;">
                  Powered by BrainBox-RetailPlus V25 | TIW<br>
                  © 2025 Technology Innovation Worldwide
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Receipt Preview</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Receipt Preview */}
          <div className="bg-gray-50 p-4 rounded-lg border relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="transform rotate-45 text-gray-200 text-2xl font-bold opacity-30">
                BrainBox-RetailPlus V25
              </div>
            </div>
            
            {/* Receipt Content */}
            <div className="relative z-10 font-mono text-xs space-y-2">
              {/* Header */}
              <div className="text-center">
                {systemSettings.businessLogo && (
                  <img 
                    src={systemSettings.businessLogo} 
                    alt="Business Logo" 
                    className="max-w-20 max-h-12 mx-auto mb-2"
                  />
                )}
                <div className="font-bold text-sm">{systemSettings.businessName}</div>
                <div>{systemSettings.businessAddress}</div>
                <div>{systemSettings.businessPhone}</div>
                <div>{systemSettings.businessEmail}</div>
                {systemSettings.businessRegistration && (
                  <div>RC: {systemSettings.businessRegistration}</div>
                )}
                {systemSettings.taxId && (
                  <div>TIN: {systemSettings.taxId}</div>
                )}
                {systemSettings.receiptHeader && (
                  <div className="mt-2 text-gray-600">
                    {systemSettings.receiptHeader.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-400 my-2"></div>
              
              {/* Transaction Info */}
              <div>
                <div>Receipt #: {sale.receiptNumber}</div>
                <div>Date: {sale.timestamp.toLocaleDateString()}</div>
                <div>Time: {sale.timestamp.toLocaleTimeString()}</div>
                <div>Customer: {customer?.name || 'Walk-in'}</div>
                {customer?.loyaltyCard && (
                  <div>Loyalty: {customer.loyaltyCard.cardNumber}</div>
                )}
              </div>
              
              <div className="border-t border-gray-400 my-2"></div>
              
              {/* Items */}
              <div>
                {sale.items.map((item, index) => (
                  <div key={index}>
                    <div>{item.productName}</div>
                    <div className="flex justify-between">
                      <span>{item.quantity} x ₦{item.unitPrice.toLocaleString()}</span>
                      <span>₦{item.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-400 my-2"></div>
              
              {/* Totals */}
              <div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₦{sale.subtotal.toLocaleString()}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₦{sale.discount.toLocaleString()}</span>
                  </div>
                )}
                {sale.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({systemSettings.taxRate}%):</span>
                    <span>₦{sale.tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>₦{sale.total.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-400 my-2"></div>
              
              {/* Payment */}
              <div>
                <div>Payment: {sale.paymentMethod.toUpperCase()}</div>
                {sale.paymentDetails.length > 1 && (
                  <div>
                    {sale.paymentDetails.map((detail, index) => (
                      <div key={index}>
                        {detail.method.toUpperCase()}: ₦{detail.amount.toLocaleString()}
                      </div>
                    ))}
                  </div>
                )}
                {customer?.loyaltyCard && sale.loyaltyPointsEarned > 0 && (
                  <div>
                    <div>Points Earned: {sale.loyaltyPointsEarned}</div>
                    <div>Total Points: {customer.loyaltyCard.points + sale.loyaltyPointsEarned}</div>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="text-center mt-4">
                <div className="border-t border-gray-400 my-2"></div>
                {systemSettings.receiptFooter && (
                  <div className="text-gray-600 mb-2">
                    {systemSettings.receiptFooter.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}
                {systemSettings.returnPolicy && (
                  <div className="text-gray-600 mb-2">{systemSettings.returnPolicy}</div>
                )}
                {systemSettings.contactInfo && (
                  <div className="text-gray-600 mb-2">
                    {systemSettings.contactInfo.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}
                
                {/* Permanent Watermark */}
                <div className="text-gray-400 text-xs mt-3 border-t border-gray-300 pt-2">
                  Powered by BrainBox-RetailPlus V25<br/>
                  © 2025 Truetech IT World
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mt-6">
            {/* Printer Selection */}
            {availablePrinters.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Printer</label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Default System Printer</option>
                  {availablePrinters.map((printer) => (
                    <option key={printer.id} value={printer.id}>
                      {printer.name} ({printer.brand} {printer.model})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={printReceipt}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}