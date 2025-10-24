import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import DisplayBoard from './pages/DisplayBoard';
import PointOfSale from './pages/PointOfSale';
import CustomerManagement from './pages/CustomerManagement';
import InventoryManagement from './pages/InventoryManagement';
import PurchaseManagement from './pages/PurchaseManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import FinancialManagement from './pages/FinancialManagement';
import StoreTransfer from './pages/StoreTransfer';
import SupplierManagement from './pages/SupplierManagement';
import AccountingReports from './pages/AccountingReports';
import SalariesExpenses from './pages/SalariesExpenses';
import VATAnalysis from './pages/VATAnalysis';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Reports from './pages/Reports';
import SubscriptionManagement from './pages/SubscriptionManagement';
import CompanyOperations from './pages/CompanyOperations';
import GlobalAdmin from './pages/GlobalAdmin';
import LoginScreen from './components/auth/LoginScreen';
import VerifyEmailScreen from './components/auth/VerifyEmailScreen';
import ResetPasswordScreen from './components/auth/ResetPasswordScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AudioProvider } from './contexts/AudioContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import SubscriptionAlert from './components/SubscriptionAlert';
import OfflineIndicator from './components/OfflineIndicator';
import TenantSelector from './components/TenantSelector';
// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="mb-4">
              <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl">🧠</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">BrainBox-RetailPlus V25</h1>
              <p className="text-gray-600 mb-4">Application Error</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">
                The application encountered an error and needs to be refreshed.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Application
            </button>
            <p className="text-xs text-gray-500 mt-4">
              © 2025 Technology Innovation Worldwide (TIW)
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return window.innerWidth >= 1024;
  });

  if (!user) {
    return (
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50 relative">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex flex-col w-full lg:w-auto min-w-0 h-screen">
          <div className="bg-gray-100 border-b border-gray-200 p-2 lg:p-3 flex-shrink-0 overflow-x-auto z-10">
            <TenantSelector />
          </div>
          <div className="flex-shrink-0 z-10">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          </div>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-2 sm:p-3 lg:p-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/display-board" element={<DisplayBoard />} />
              <Route path="/pos" element={<PointOfSale />} />
              <Route path="/customers" element={<CustomerManagement />} />
              <Route path="/inventory" element={<InventoryManagement />} />
              <Route path="/suppliers" element={<SupplierManagement />} />
              <Route path="/purchases" element={<PurchaseManagement />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/financial" element={<FinancialManagement />} />
              <Route path="/store-transfer" element={<StoreTransfer />} />
              <Route path="/salaries-expenses" element={<SalariesExpenses />} />
              <Route path="/accounting" element={<AccountingReports />} />
              <Route path="/vat-analysis" element={<VATAnalysis />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/subscription" element={<SubscriptionManagement />} />
              <Route path="/companies" element={<CompanyOperations />} />
              <Route path="/global-admin" element={<GlobalAdmin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
            </Routes>
          </main>
        </div>
      </div>
      <SubscriptionAlert />
      <OfflineIndicator />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AudioProvider>
          <TenantProvider>
            <AuthProvider>
              <DataProvider>
                <NotificationProvider>
                  <SubscriptionProvider>
                    <AppContent />
                  </SubscriptionProvider>
                </NotificationProvider>
              </DataProvider>
            </AuthProvider>
          </TenantProvider>
        </AudioProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;