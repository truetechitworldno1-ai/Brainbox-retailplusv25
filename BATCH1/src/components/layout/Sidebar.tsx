import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  ShoppingBag,
  UserCheck,
  DollarSign,
  Settings,
  HelpCircle,
  Menu,
  Brain,
  ArrowRightLeft,
  Monitor,
  FileText,
  Crown,
  User,
  Building,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Display Board', href: '/display-board', icon: Monitor, permission: 'dashboard' },
  { name: 'Point of Sales', href: '/pos', icon: ShoppingCart, permission: 'pos' },
  { name: 'Customers', href: '/customers', icon: Users, permission: 'customers' },
  { name: 'Inventory', href: '/inventory', icon: Package, permission: 'inventory' },
  { name: 'Suppliers', href: '/suppliers', icon: Building, permission: 'purchases' },
  { name: 'Purchases', href: '/purchases', icon: ShoppingBag, permission: 'purchases' },
  { name: 'Employees', href: '/employees', icon: UserCheck, permission: 'employees' },
  { name: 'Multi-Outlet Transfer', href: '/store-transfer', icon: ArrowRightLeft, permission: 'store_transfer' },
  { name: 'Salaries & Expenses', href: '/salaries-expenses', icon: DollarSign, permission: 'financial' },
  { name: 'Financial', href: '/financial', icon: DollarSign, permission: 'financial' },
  { name: 'VAT Analysis', href: '/vat-analysis', icon: FileText, permission: 'view_reports' },
  { name: 'Reports', href: '/reports', icon: FileText, permission: 'view_reports' },
  { name: 'Company Operations', href: '/companies', icon: Building, permission: 'system_settings' },
  { name: 'Subscription', href: '/subscription', icon: Crown, permission: 'dashboard' },
  { name: 'Global Admin', href: '/global-admin', icon: Shield, permission: 'super_admin', superAdminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'system_settings' },
  { name: 'Help', href: '/help', icon: HelpCircle, permission: 'help' },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { hasPermission, user, logout, isImpersonating, currentView } = useAuth();
  const { currentTenant } = useTenant();

  // Filter navigation based on current view for Global Admin
  const getFilteredNavigation = () => {
    if (user?.role !== 'global_admin') return navigation;
    
    switch (currentView) {
      case 'basic':
        return navigation.filter(item => 
          ['dashboard', 'pos', 'customers', 'inventory', 'employees', 'help'].includes(item.permission)
        );
      case 'pro':
        return navigation.filter(item => 
          !['store_transfer'].includes(item.permission)
        );
      default:
        return navigation;
    }
  };

  const filteredNavigation = getFilteredNavigation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
          style={{ touchAction: 'none' }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-64 lg:w-64 ${
          isImpersonating ? 'bg-red-50 border-r-4 border-red-500' : 'bg-white'
        } shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col max-h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isImpersonating ? 'bg-red-600' : 'bg-blue-600'
            }`}>
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">BrainBox</h1>
              <p className="text-xs text-gray-500">RetailPlus V25</p>
              {isImpersonating && (
                <p className="text-xs text-red-600 font-bold">IMPERSONATING</p>
              )}
              {currentTenant && (
                <p className="text-xs text-blue-600 font-medium truncate max-w-28 sm:max-w-32">{currentTenant.companyName}</p>
              )}
              {user?.role === 'global_admin' && (
                <p className="text-xs text-purple-600 font-medium">{currentView.toUpperCase()} View</p>
              )}
              <p className="text-xs text-green-600 font-medium hidden sm:block">Licensed by Truetech IT World</p>
              <p className="text-xs text-gray-400">© 2025 All Rights Reserved</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {filteredNavigation.map((item: any) => {
            if (item.superAdminOnly && user?.role !== 'super_admin') {
              return null;
            }

            if (!hasPermission(item.permission) && !hasPermission('all')) {
              return null;
            }

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Auto-close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-target ${
                    isActive
                      ? `${isImpersonating ? 'bg-red-50 text-red-700 border-r-2 border-red-700' : item.superAdminOnly ? 'bg-red-100 text-red-800 border-r-2 border-red-700' : 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'}`
                      : item.superAdminOnly ? 'text-red-600 hover:bg-red-50 font-bold' : 'text-gray-600 hover:bg-green-50 hover:text-green-700 font-semibold'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info and Logout at Bottom */}
        <div className="p-3 sm:p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors touch-target"
          >
            <User className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}