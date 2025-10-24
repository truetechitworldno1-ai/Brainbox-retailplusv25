import React, { createContext, useContext, useState, useEffect } from 'react';
import { RolePermissions, UserSession, TIWSettings, TIWAccessLog } from '../types';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'global_admin' | 'franchise' | 'business_owner' | 'manager' | 'inventory' | 'supervisor' | 'cashier' | 'custom';
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  loginAttempts: number;
  isLocked: boolean;
  currentSessions: UserSession[];
  requirePasswordReset?: boolean;
  customPermissions?: string[];
  canBeImpersonated?: boolean;
  franchiseId?: string;
  businessId?: string;
  impersonatedBy?: string;
  originalUser?: User;
}

// Device detection utility
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const getBrowser = () => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };
  
  const getOS = () => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  };
  
  const getDevice = () => {
    if (/Mobi|Android/i.test(userAgent)) return 'Mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  };

  return {
    browser: getBrowser(),
    os: getOS(),
    device: getDevice(),
    ip: 'Local Network', // Would be actual IP in production
    userAgent
  };
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isFirstTimeSetup: boolean;
  completeFirstTimeSetup: (adminPassword: string, staffPasswords: { [role: string]: string }) => void;
  login: (email: string, password: string) => Promise<boolean>;
  setAdminPassword: (newPassword: string) => boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'loginAttempts' | 'isLocked'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  rolePermissions: RolePermissions[];
  updateRolePermissions: (role: string, permissions: any) => void;
  activeSessions: UserSession[];
  getUserSessions: (userId: string) => UserSession[];
  terminateSession: (sessionId: string) => void;
  tiwSettings: TIWSettings;
  updateTIWSettings: (updates: Partial<TIWSettings>) => void;
  verifyTIWAccess: (password: string) => boolean;
  impersonateUser: (userId: string) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  canSwitchView: boolean;
  currentView: 'basic' | 'pro' | 'advanced';
  switchView: (view: 'basic' | 'pro' | 'advanced') => void;
  remotelyDisableApp: (userId: string, reason: string) => void;
  remotelyEnableApp: (userId: string) => void;
  canOverrideBasicFeatures: () => boolean;
  hasFeatureAccess: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultRolePermissions: RolePermissions[] = [
  {
    role: 'global_admin',
    permissions: {
      dashboard: true,
      pos: true,
      customers: true,
      inventory: true,
      purchases: true,
      employees: true,
      financial: true,
      store_transfer: true,
      settings: true,
      help: true,
      apply_discount: true,
      void_sale: true,
      refund: true,
      hold_receipt: true,
      price_override: true,
      view_reports: true,
      export_data: true,
      manage_users: true,
      system_settings: true,
    }
  },
  {
    role: 'business_owner',
    permissions: {
      dashboard: true,
      pos: true,
      customers: true,
      inventory: true,
      purchases: true,
      employees: true,
      financial: true,
      store_transfer: true,
      settings: true,
      help: true,
      apply_discount: true,
      void_sale: true,
      refund: true,
      hold_receipt: true,
      price_override: true,
      view_reports: true,
      export_data: true,
      manage_users: true,
      system_settings: true,
    }
  },
  {
    role: 'franchise',
    permissions: {
      dashboard: true,
      pos: true,
      customers: true,
      inventory: true,
      purchases: true,
      employees: true,
      financial: true,
      store_transfer: true,
      settings: false,
      help: true,
      apply_discount: true,
      void_sale: true,
      refund: true,
      hold_receipt: true,
      price_override: true,
      view_reports: true,
      export_data: true,
      manage_users: false,
      system_settings: false,
    }
  },
  {
    role: 'manager',
    permissions: {
      dashboard: true,
      pos: true,
      customers: true,
      inventory: true,
      purchases: true,
      employees: false,
      financial: true,
      store_transfer: true,
      settings: true,
      help: true,
      apply_discount: true,
      void_sale: true,
      refund: true,
      hold_receipt: true,
      price_override: true,
      view_reports: true,
      export_data: true,
      manage_users: true,
      system_settings: true,
    }
  },
  {
    role: 'supervisor',
    permissions: {
      dashboard: true,
      pos: true,
      customers: true,
      inventory: true,
      purchases: false,
      employees: true,
      financial: false,
      store_transfer: false,
      settings: false,
      help: true,
      apply_discount: true,
      void_sale: true,
      refund: true,
      hold_receipt: true,
      price_override: false,
      view_reports: true,
      export_data: false,
      manage_users: false,
      system_settings: false,
    }
  },
  {
    role: 'inventory',
    permissions: {
      dashboard: true,
      pos: false,
      customers: false,
      inventory: true,
      purchases: true,
      employees: true,
      financial: false,
      store_transfer: true,
      settings: false,
      help: true,
      apply_discount: false,
      void_sale: false,
      refund: false,
      hold_receipt: false,
      price_override: false,
      view_reports: true,
      export_data: false,
      manage_users: false,
      system_settings: false,
    }
  },
  {
    role: 'cashier',
    permissions: {
      dashboard: true,
      pos: true,
      customers: true,
      inventory: false,
      purchases: false,
      employees: false,
      financial: false,
      store_transfer: false,
      settings: false,
      help: true,
      apply_discount: false,
      void_sale: false,
      refund: false,
      hold_receipt: true,
      price_override: false,
      view_reports: false,
      export_data: false,
      manage_users: false,
      system_settings: false,
    }
  },
  {
    role: 'custom',
    permissions: {
      dashboard: false,
      pos: false,
      customers: false,
      inventory: false,
      purchases: false,
      employees: false,
      financial: false,
      store_transfer: false,
      settings: false,
      help: true,
      apply_discount: false,
      void_sale: false,
      refund: false,
      hold_receipt: false,
      price_override: false,
      view_reports: false,
      export_data: false,
      manage_users: false,
      system_settings: false,
      salaries_expenses: false
    }
  }
];

const initialDefaultUsers: User[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    email: 'admin',
    password: 'admin',
    name: 'Global Administrator (TIW)',
    role: 'global_admin',
    permissions: ['all'],
    isActive: true,
    createdAt: new Date(),
    loginAttempts: 0,
    isLocked: false,
    currentSessions: [],
    requirePasswordReset: false,
    canBeImpersonated: false,
  },
  {
    id: 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
    email: 'admin',
    password: 'admin',
    name: 'System Administrator',
    role: 'business_owner',
    permissions: ['all'],
    isActive: true,
    createdAt: new Date(),
    loginAttempts: 0,
    isLocked: false,
    currentSessions: [],
    requirePasswordReset: false,
    canBeImpersonated: false,
  },
  {
    id: 'c3d4e5f6-g7h8-9012-3456-789012cdefgh',
    email: 'manager',
    password: 'manager123',
    name: 'Store Manager',
    role: 'manager',
    permissions: [],
    isActive: true,
    createdAt: new Date(),
    loginAttempts: 0,
    isLocked: false,
    currentSessions: [],
    requirePasswordReset: false,
    canBeImpersonated: true,
  },
  {
    id: 'd4e5f6g7-h8i9-0123-4567-890123defghi',
    email: 'cashier',
    password: 'cashier123',
    name: 'Cashier',
    role: 'cashier',
    permissions: [],
    isActive: true,
    createdAt: new Date(),
    loginAttempts: 0,
    isLocked: false,
    currentSessions: [],
    requirePasswordReset: false,
    canBeImpersonated: true,
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>(defaultRolePermissions);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'basic' | 'pro' | 'advanced'>('basic');
  const [disabledApps, setDisabledApps] = useState<{[userId: string]: string}>({});
  const [tiwSettings, setTIWSettings] = useState<TIWSettings>({
    id: '1',
    tiwPassword: 'TIW@Secure2025!',
    shortKey: 'Ctrl+Shift+T',
    canEditBuyerSettings: true,
    canEditClientDetails: true,
    lastAccess: new Date(),
    accessLog: []
  });

  useEffect(() => {
    // Initialize users but DO NOT auto-login
    const savedUsers = localStorage.getItem('brainbox_users');

    // Check if this is first time setup
    if (!savedUsers) {
      // Initialize with default users for immediate login
      setUsers(initialDefaultUsers);
      setIsFirstTimeSetup(false);
      localStorage.setItem('brainbox_users', JSON.stringify(initialDefaultUsers));
      return;
    }

    try {
      const usersData = JSON.parse(savedUsers);
      if (usersData.length === 0) {
        // Initialize with default users
        setUsers(initialDefaultUsers);
        setIsFirstTimeSetup(false);
        localStorage.setItem('brainbox_users', JSON.stringify(initialDefaultUsers));
        return;
      }

      // Load existing users
      usersData.forEach((user: any) => {
        if (user.createdAt) user.createdAt = new Date(user.createdAt);
        if (user.lastLogin) user.lastLogin = new Date(user.lastLogin);
      });
      setUsers(usersData);
      setIsFirstTimeSetup(false);
    } catch (error) {
      console.error('Error parsing saved users:', error);
      // Initialize with default users on error
      setUsers(initialDefaultUsers);
      setIsFirstTimeSetup(false);
      localStorage.setItem('brainbox_users', JSON.stringify(initialDefaultUsers));
      return;
    }

    // REMOVED: Auto-login from saved session
    // Users must now explicitly log in each time
    localStorage.removeItem('brainbox_user');
  }, []);

  const completeFirstTimeSetup = (adminPassword: string, staffPasswords: { [role: string]: string }) => {
    const defaultUsers: User[] = [
      {
        id: crypto.randomUUID(),
        email: 'admin',
        password: adminPassword,
        name: 'System Administrator',
        role: 'business_owner',
        permissions: ['all'],
        isActive: true,
        createdAt: new Date(),
        loginAttempts: 0,
        isLocked: false,
        currentSessions: [],
        requirePasswordReset: false,
        isFirstLogin: false,
      },
      {
        id: crypto.randomUUID(),
        email: 'business_owner',
        password: 'owner123',
        name: 'Business Owner',
        role: 'business_owner',
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        loginAttempts: 0,
        isLocked: false,
        currentSessions: [],
        requirePasswordReset: false,
        isFirstLogin: false,
        canBeImpersonated: true,
      },
      {
        id: crypto.randomUUID(),
        email: 'manager',
        password: 'manager123',
        name: 'Store Manager',
        role: 'manager',
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        loginAttempts: 0,
        isLocked: false,
        currentSessions: [],
        requirePasswordReset: false,
        isFirstLogin: false,
        canBeImpersonated: true,
      },
      {
        id: crypto.randomUUID(),
        email: 'cashier',
        password: staffPasswords.cashier || 'cashier123',
        name: 'Cashier',
        role: 'cashier',
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        loginAttempts: 0,
        isLocked: false,
        currentSessions: [],
        requirePasswordReset: false,
        isFirstLogin: false,
        canBeImpersonated: true,
      }
    ];
    
    setUsers(defaultUsers);
    localStorage.setItem('brainbox_users', JSON.stringify(defaultUsers));
    setIsFirstTimeSetup(false);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check if this is an email address (contains @)
    if (email.includes('@')) {
      // Try Supabase authentication for email-based logins
      try {
        const { AuthService } = await import('../services/AuthService');
        const result = await AuthService.signIn(email, password);

        if (result.success && result.data) {
          const { user: authUser, profile } = result.data;

          // Create user object for AuthContext
          const newUser: User = {
            id: authUser.id,
            email: authUser.email || email,
            password: '', // Don't store password
            name: profile?.full_name || authUser.user_metadata?.full_name || 'User',
            role: profile?.role || 'business_owner',
            permissions: ['all'],
            isActive: profile?.is_active ?? true,
            createdAt: new Date(authUser.created_at),
            loginAttempts: 0,
            isLocked: false,
            currentSessions: [],
            requirePasswordReset: false,
            canBeImpersonated: false,
          };

          const deviceInfo = getDeviceInfo();
          const newSession: UserSession = {
            id: crypto.randomUUID(),
            userId: newUser.id,
            deviceInfo,
            loginTime: new Date(),
            lastActivity: new Date(),
            isActive: true,
            location: 'Local Network'
          };

          newUser.lastLogin = new Date();
          newUser.currentSessions = [newSession];

          setUser(newUser);
          setIsAuthenticated(true);
          localStorage.setItem('brainbox_user', JSON.stringify(newUser));

          const updatedSessions = [...activeSessions, newSession];
          setActiveSessions(updatedSessions);
          localStorage.setItem('brainbox_active_sessions', JSON.stringify(updatedSessions));

          return true;
        }
      } catch (error) {
        console.error('Supabase login error:', error);
      }
    }

    // Fall back to local users for username-based logins
    const foundUser = users.find(u => u.email === email);
    if (!foundUser) {
      console.warn('User not found:', email);
      return false;
    }

    if (foundUser.isLocked) {
      console.warn('User is locked:', foundUser.email);
      return false;
    }

    // Check password
    if (foundUser.password === password) {
      // Successful login
      const deviceInfo = getDeviceInfo();
      const newSession: UserSession = {
        id: crypto.randomUUID(),
        userId: foundUser.id,
        deviceInfo,
        loginTime: new Date(),
        lastActivity: new Date(),
        isActive: true,
        location: 'Local Network'
      };

      const updatedUser = {
        ...foundUser,
        lastLogin: new Date(),
        loginAttempts: 0,
        isFirstLogin: false,
        currentSessions: [...(foundUser.currentSessions || []), newSession]
      };

      setUser(updatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('brainbox_user', JSON.stringify(updatedUser));

      // Add to active sessions
      const updatedSessions = [...activeSessions, newSession];
      setActiveSessions(updatedSessions);
      localStorage.setItem('brainbox_active_sessions', JSON.stringify(updatedSessions));

      // Update user in users array
      updateUser(foundUser.id, {
        lastLogin: new Date(),
        loginAttempts: 0,
        isFirstLogin: false,
        currentSessions: updatedUser.currentSessions
      });

      return true;
    } else {
      // Failed login
      const newAttempts = foundUser.loginAttempts + 1;
      const isLocked = newAttempts >= 5;

      updateUser(foundUser.id, {
        loginAttempts: newAttempts,
        isLocked
      });

      return false;
    }
  };

  const setAdminPassword = (newPassword: string): boolean => {
    if (!user || user.role !== 'admin') return false;
    
    const updatedUser = {
      ...user,
      password: newPassword,
      isFirstLogin: false,
      requirePasswordReset: false
    };
    
    setUser(updatedUser);
    updateUser(user.id, {
      password: newPassword,
      isFirstLogin: false,
      requirePasswordReset: false
    });
    
    localStorage.setItem('brainbox_user', JSON.stringify(updatedUser));
    return true;
  };

  const logout = () => {
    if (user) {
      // Terminate current session
      const updatedSessions = activeSessions.map(session =>
        session.userId === user.id && session.isActive
          ? { ...session, isActive: false }
          : session
      );
      setActiveSessions(updatedSessions);
      localStorage.setItem('brainbox_active_sessions', JSON.stringify(updatedSessions));
      
      // Update user sessions
      updateUser(user.id, {
        currentSessions: user.currentSessions?.map(session => ({ ...session, isActive: false })) || []
      });
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('brainbox_user');
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'loginAttempts' | 'isLocked'>) => {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      loginAttempts: 0,
      isLocked: false,
      currentSessions: [],
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('brainbox_users', JSON.stringify(updatedUsers));
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const updatedUsers = users.map(user =>
      user.id === id ? { ...user, ...updates } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('brainbox_users', JSON.stringify(updatedUsers));
  };

  const deleteUser = (id: string) => {
    const updatedUsers = users.filter(user => user.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('brainbox_users', JSON.stringify(updatedUsers));
  };

  const updateRolePermissions = (role: string, permissions: any) => {
    const updatedPermissions = rolePermissions.map(rp =>
      rp.role === role ? { ...rp, permissions } : rp
    );
    setRolePermissions(updatedPermissions);
    localStorage.setItem('brainbox_role_permissions', JSON.stringify(updatedPermissions));
  };

  const getUserSessions = (userId: string): UserSession[] => {
    return activeSessions.filter(session => session.userId === userId && session.isActive);
  };

  const terminateSession = (sessionId: string) => {
    const updatedSessions = activeSessions.map(session =>
      session.id === sessionId ? { ...session, isActive: false } : session
    );
    setActiveSessions(updatedSessions);
    localStorage.setItem('brainbox_active_sessions', JSON.stringify(updatedSessions));
  };

  const updateTIWSettings = (updates: Partial<TIWSettings>) => {
    const updatedSettings = {
      ...tiwSettings,
      ...updates,
      lastAccess: new Date(),
      accessLog: [
        ...tiwSettings.accessLog,
        {
          id: crypto.randomUUID(),
          action: 'Settings Updated',
          timestamp: new Date(),
          details: Object.keys(updates).join(', ')
        }
      ]
    };
    setTIWSettings(updatedSettings);
    localStorage.setItem('brainbox_tiw_settings', JSON.stringify(updatedSettings));
  };

  const verifyTIWAccess = (password: string): boolean => {
    return password === tiwSettings.tiwPassword;
  };

  // Impersonation functions
  const impersonateUser = (userId: string) => {
    if (!user || user.role !== 'global_admin') return;
    
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser || !targetUser.canBeImpersonated) return;
    
    setOriginalUser(user);
    setUser({
      ...targetUser,
      impersonatedBy: user.id,
      originalUser: user
    });
  };

  const stopImpersonation = () => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
    }
  };

  const switchView = (view: 'basic' | 'pro' | 'advanced') => {
    if (user?.role === 'global_admin') {
      setCurrentView(view);
    }
  };

  const remotelyDisableApp = (userId: string, reason: string) => {
    if (user?.role !== 'global_admin') return;
    
    setDisabledApps(prev => ({
      ...prev,
      [userId]: reason
    }));
    
    localStorage.setItem('brainbox_disabled_apps', JSON.stringify({
      ...disabledApps,
      [userId]: reason
    }));
  };

  const remotelyEnableApp = (userId: string) => {
    if (user?.role !== 'global_admin') return;
    
    const updated = { ...disabledApps };
    delete updated[userId];
    setDisabledApps(updated);
    
    localStorage.setItem('brainbox_disabled_apps', JSON.stringify(updated));
  };

  const canOverrideBasicFeatures = (): boolean => {
    return user?.role === 'global_admin';
  };

  const hasFeatureAccess = (feature: string): boolean => {
    // Global Admin can override all restrictions
    if (user?.role === 'global_admin') return true;
    
    // Core POS features always available
    const corePOSFeatures = [
      'pos', 'printerConfiguration', 'cashierCounters', 
      'returnItems', 'inventory', 'customers', 'basicReporting'
    ];
    
    if (corePOSFeatures.includes(feature)) return true;
    
    // Check subscription-based features
    // This would integrate with SubscriptionService in real implementation
    return hasPermission(feature);
  };

  // Update last activity for current session
  useEffect(() => {
    if (user && isAuthenticated) {
      const interval = setInterval(() => {
        const updatedSessions = activeSessions.map(session =>
          session.userId === user.id && session.isActive
            ? { ...session, lastActivity: new Date() }
            : session
        );
        setActiveSessions(updatedSessions);
        localStorage.setItem('brainbox_active_sessions', JSON.stringify(updatedSessions));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [user, isAuthenticated, activeSessions]);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Global admin has all permissions
    if (user.role === 'global_admin') return true;
    
    if (user.permissions.includes('all')) return true;
    
    const rolePerms = rolePermissions.find(rp => rp.role === user.role);
    if (rolePerms) {
      return rolePerms.permissions[permission as keyof typeof rolePerms.permissions] || false;
    }
    
    // Check custom permissions
    if (user.customPermissions?.includes(permission)) return true;
    
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      setAdminPassword,
      logout,
      hasPermission,
      users,
      addUser,
      updateUser,
      deleteUser,
      rolePermissions,
      updateRolePermissions,
      activeSessions,
      getUserSessions,
      terminateSession,
      isFirstTimeSetup,
      completeFirstTimeSetup,
      tiwSettings,
      updateTIWSettings,
      verifyTIWAccess,
      impersonateUser,
      stopImpersonation,
      isImpersonating: !!originalUser,
      canSwitchView: user?.role === 'global_admin',
      currentView,
      switchView,
      remotelyDisableApp,
      remotelyEnableApp,
      canOverrideBasicFeatures,
      hasFeatureAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}