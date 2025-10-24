import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Calculator, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { CashierSession } from '../types';

interface CashierSessionManagerProps {
  onSessionStart: (session: CashierSession) => void;
  onSessionEnd: () => void;
}

export default function CashierSessionManager({ onSessionStart, onSessionEnd }: CashierSessionManagerProps) {
  const { cashierSessions, startCashierSession, endCashierSession, updateCashierSession } = useData();
  const { user } = useAuth();
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [currentSession, setCurrentSession] = useState<CashierSession | null>(null);

  useEffect(() => {
    if (user) {
      const activeSession = cashierSessions.find(s => s.cashierId === user.id && s.isActive);
      setCurrentSession(activeSession || null);
    }
  }, [user, cashierSessions]);

  const handleStartSession = () => {
    if (!user) return;
    
    const session = startCashierSession(user.id, openingBalance);
    setCurrentSession(session);
    onSessionStart(session);
    setShowOpeningModal(false);
    setOpeningBalance(0);
  };

  const handleEndSession = () => {
    if (!currentSession) return;
    
    endCashierSession(currentSession.id, closingBalance);
    setCurrentSession(null);
    onSessionEnd();
    setShowClosingModal(false);
    setClosingBalance(0);
  };

  const getSessionDuration = () => {
    if (!currentSession) return '0:00';
    
    const now = new Date();
    const start = currentSession.sessionStart;
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  if (!currentSession) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Cashier Session</h3>
          <p className="text-gray-600 mb-4">Enter your opening cash balance to begin</p>
          <button
            onClick={() => setShowOpeningModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Start Session
          </button>
        </div>

        {/* Opening Balance Modal */}
        {showOpeningModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Start Cashier Session</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Cash Balance (₦)
                  </label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    placeholder="0.00"
                    step="0.01"
                    autoFocus
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Count all cash in your drawer and enter the total amount. This will be your starting balance for tracking.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowOpeningModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartSession}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Session</h3>
        <button
          onClick={() => setShowClosingModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          End Session
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <Clock className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <p className="text-sm text-green-600">Duration</p>
          <p className="font-bold text-green-900">{getSessionDuration()}</p>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <DollarSign className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="text-sm text-blue-600">Opening</p>
          <p className="font-bold text-blue-900">₦{currentSession.openingBalance.toLocaleString()}</p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <p className="text-sm text-purple-600">Sales</p>
          <p className="font-bold text-purple-900">₦{currentSession.totalSales.toLocaleString()}</p>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <RotateCcw className="h-5 w-5 text-orange-600 mx-auto mb-1" />
          <p className="text-sm text-orange-600">Returns</p>
          <p className="font-bold text-orange-900">₦{currentSession.totalReturns.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Cash</p>
          <p className="font-bold text-gray-900">₦{currentSession.totalCash.toLocaleString()}</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Card</p>
          <p className="font-bold text-gray-900">₦{currentSession.totalCard.toLocaleString()}</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Transfer</p>
          <p className="font-bold text-gray-900">₦{currentSession.totalTransfer.toLocaleString()}</p>
        </div>
      </div>

      {/* Closing Balance Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">End Cashier Session</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Session Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Opening Balance:</span>
                    <span>₦{currentSession.openingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Sales:</span>
                    <span>₦{currentSession.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Returns:</span>
                    <span>₦{currentSession.totalReturns.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Expected Balance:</span>
                    <span>₦{(currentSession.openingBalance + currentSession.totalCash - currentSession.totalReturns).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Closing Cash Balance (₦)
                </label>
                <input
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  placeholder="0.00"
                  step="0.01"
                  autoFocus
                />
              </div>
              
              {closingBalance !== (currentSession.openingBalance + currentSession.totalCash - currentSession.totalReturns) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Variance:</strong> ₦{Math.abs(closingBalance - (currentSession.openingBalance + currentSession.totalCash - currentSession.totalReturns)).toFixed(2)}
                    {closingBalance > (currentSession.openingBalance + currentSession.totalCash - currentSession.totalReturns) ? ' Over' : ' Short'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowClosingModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}