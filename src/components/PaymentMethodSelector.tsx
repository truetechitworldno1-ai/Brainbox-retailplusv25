import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, Smartphone, Building, Split, Calculator } from 'lucide-react';
import { PaymentDetail } from '../types';
import { useData } from '../contexts/DataContext';

interface PaymentMethodSelectorProps {
  total: number;
  onPaymentComplete: (paymentDetails: PaymentDetail[]) => void;
  onCancel: () => void;
}

export default function PaymentMethodSelector({ total, onPaymentComplete, onCancel }: PaymentMethodSelectorProps) {
  const { systemSettings } = useData();
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'pos' | 'transfer' | 'debit' | 'credit' | 'split'>('cash');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [splitPayments, setSplitPayments] = useState<PaymentDetail[]>([
    { method: 'pos', amount: 0 },
    { method: 'cash', amount: 0 }
  ]);
  const [cashReceived, setCashReceived] = useState(total);
  const [selectedBank, setSelectedBank] = useState('');
  const [transferReference, setTransferReference] = useState('');

  const paymentMethods = [
    { 
      value: 'cash', 
      label: systemSettings.paymentMethods.cash.label, 
      icon: Banknote, 
      description: systemSettings.paymentMethods.cash.description,
      enabled: systemSettings.paymentMethods.cash.enabled
    },
    { 
      value: 'pos', 
      label: systemSettings.paymentMethods.pos.label, 
      icon: CreditCard, 
      description: systemSettings.paymentMethods.pos.description,
      enabled: systemSettings.paymentMethods.pos.enabled
    },
    { 
      value: 'transfer', 
      label: systemSettings.paymentMethods.transfer.label, 
      icon: Building, 
      description: systemSettings.paymentMethods.transfer.description,
      enabled: systemSettings.paymentMethods.transfer.enabled
    },
    { 
      value: 'debit', 
      label: systemSettings.paymentMethods.debit.label, 
      icon: CreditCard, 
      description: systemSettings.paymentMethods.debit.description,
      enabled: systemSettings.paymentMethods.debit.enabled
    },
    { 
      value: 'credit', 
      label: systemSettings.paymentMethods.credit.label, 
      icon: CreditCard, 
      description: systemSettings.paymentMethods.credit.description,
      enabled: systemSettings.paymentMethods.credit.enabled
    },
    { value: 'split', label: 'Split Payment', icon: Split, description: 'Multiple payment methods', enabled: true },
  ].filter(method => method.enabled);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : paymentMethods.length - 1;
            setSelectedMethod(paymentMethods[newIndex].value as any);
            return newIndex;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev < paymentMethods.length - 1 ? prev + 1 : 0;
            setSelectedMethod(paymentMethods[newIndex].value as any);
            return newIndex;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (isValidPayment()) {
            handleComplete();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paymentMethods, selectedMethod]);

  // Update selected index when method changes manually
  useEffect(() => {
    const index = paymentMethods.findIndex(method => method.value === selectedMethod);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [selectedMethod, paymentMethods]);

  // Auto-calculate remaining amount for split payments when adding new payment
  useEffect(() => {
    if (selectedMethod === 'split' && splitPayments.length > 0) {
      const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const remaining = total - totalPaid;

      // Only auto-fill if there's a remaining amount and last payment is exactly 0
      if (remaining > 0) {
        const lastIndex = splitPayments.length - 1;
        const lastPayment = splitPayments[lastIndex];

        // Auto-fill only if the last payment was just added (amount is 0)
        if (lastPayment.amount === 0 && splitPayments.length >= 2) {
          const updatedPayments = [...splitPayments];
          updatedPayments[lastIndex].amount = remaining;
          setSplitPayments(updatedPayments);
        }
      }
    }
  }, [splitPayments.length, selectedMethod]);

  const handleSplitPaymentChange = (index: number, field: 'method' | 'amount', value: any) => {
    const updated = [...splitPayments];
    if (field === 'amount') {
      updated[index].amount = parseFloat(value) || 0;
    } else {
      updated[index].method = value;
    }
    setSplitPayments(updated);
  };

  const addSplitPayment = () => {
    const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = Math.max(0, total - totalPaid);
    
    setSplitPayments([...splitPayments, { method: 'cash', amount: remaining }]);
  };

  const removeSplitPayment = (index: number) => {
    if (splitPayments.length > 1) {
      setSplitPayments(splitPayments.filter((_, i) => i !== index));
    }
  };

  const getSplitTotal = () => {
    return splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getSplitSummary = () => {
    const nonZeroPayments = splitPayments.filter(p => p.amount > 0);
    return nonZeroPayments.map(p => 
      `${p.method.toUpperCase()} ₦${p.amount.toLocaleString()}`
    ).join(', ');
  };

  const handleComplete = () => {
    let paymentDetails: PaymentDetail[];

    if (selectedMethod === 'split') {
      paymentDetails = splitPayments.filter(p => p.amount > 0);
    } else {
      paymentDetails = [{ method: selectedMethod, amount: total }];
    }

    onPaymentComplete(paymentDetails);
  };

  const isValidPayment = () => {
    if (selectedMethod === 'split') {
      return Math.abs(getSplitTotal() - total) < 0.01;
    }
    if (selectedMethod === 'cash') {
      return cashReceived >= total;
    }
    return true;
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-h-[80vh] overflow-y-auto payment-scroll">
      <div className="text-center">
        <h3 className="text-xl lg:text-2xl font-bold text-gray-900">₦{total.toLocaleString()}</h3>
        <p className="text-gray-600">Total Amount Due</p>
        <p className="text-sm text-blue-600 mt-1">Use ↑↓ arrows to navigate • Enter to confirm • Esc to cancel</p>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200">
        {paymentMethods.map((method, index) => (
          <button
            key={method.value}
            onClick={() => setSelectedMethod(method.value as any)}
            className={`p-3 lg:p-4 rounded-lg border-2 transition-all text-left touch-target relative ${
              selectedMethod === method.value || index === selectedIndex
                ? 'border-blue-500 bg-blue-50 text-blue-700 payment-method-focused'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <method.icon className="h-5 lg:h-6 w-5 lg:w-6 mb-2" />
            <p className="font-medium text-xs lg:text-sm">{method.label}</p>
            <p className="text-xs text-gray-500 hidden lg:block">{method.description}</p>
            {index === selectedIndex && (
              <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* Cash Payment Details */}
      {selectedMethod === 'cash' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-32 overflow-y-auto">
          <label className="block text-sm font-medium text-green-800 mb-2">
            Cash Received
          </label>
          <input
            type="number"
            value={cashReceived}
            onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && cashReceived >= total) {
                e.preventDefault();
                handleComplete();
              }
            }}
            className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            step="0.01"
            min={total}
            autoFocus
          />
          {cashReceived > total && (
            <p className="text-sm text-green-700 mt-2">
              Change: ₦{(cashReceived - total).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Split Payment Details */}
      {selectedMethod === 'split' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">Split Payment Details</h4>
            <button
              onClick={addSplitPayment}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Payment
            </button>
          </div>
          
          <div className="space-y-3">
            {splitPayments.map((payment, index) => (
              <div key={index} className="flex items-center space-x-3">
                <select
                  value={payment.method}
                  onChange={(e) => handleSplitPaymentChange(index, 'method', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValidPayment()) {
                      e.preventDefault();
                      handleComplete();
                    }
                  }}
                  className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="pos">POS</option>
                  <option value="transfer">Transfer</option>
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
                <input
                  type="number"
                  value={payment.amount}
                  onChange={(e) => handleSplitPaymentChange(index, 'amount', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValidPayment()) {
                      e.preventDefault();
                      handleComplete();
                    }
                  }}
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                />
                {splitPayments.length > 1 && (
                  <button
                    onClick={() => removeSplitPayment(index)}
                    className="text-red-600 hover:text-red-700 px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Split Payment Summary - Sticky */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200 payment-sticky">
            <div className="flex items-center space-x-2 mb-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Payment Summary</span>
            </div>
            <p className="text-sm text-blue-800 mb-2">
              Split: {getSplitSummary()} = ₦{getSplitTotal().toLocaleString()}
            </p>
            <div className="flex justify-between text-sm">
              <span>Total Due:</span>
              <span className="font-medium">₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Paid:</span>
              <span className={getSplitTotal() === total ? 'text-green-600 font-medium' : 'text-red-600'}>
                ₦{getSplitTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Remaining:</span>
              <span className={total - getSplitTotal() === 0 ? 'text-green-600' : 'text-red-600'}>
                ₦{(total - getSplitTotal()).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Other Payment Method Details */}
      {['pos', 'transfer', 'debit', 'credit'].includes(selectedMethod) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
          <p className="text-sm text-gray-700 mb-3">
            <strong>Note:</strong> Processing {selectedMethod.toUpperCase()} payment of ₦{total.toLocaleString()}
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleComplete();
                  }
                }}
                placeholder="Enter transaction reference"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {selectedMethod === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Bank
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleComplete();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Bank</option>
                  {systemSettings.paymentMethods.transfer.banks.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                  {systemSettings.paymentMethods.transfer.customBanks.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons - Sticky */}
      <div className="flex space-x-3 payment-sticky bg-white pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCancel();
            }
          }}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleComplete}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleComplete();
            }
          }}
          disabled={!isValidPayment()}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg"
        >
          Complete Payment (Enter)
        </button>
      </div>
      
      {/* Keyboard Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-600">
          <strong>Keyboard Shortcuts:</strong> ↑↓ Navigate • Enter Complete • Esc Cancel
        </p>
      </div>
    </div>
  );
}