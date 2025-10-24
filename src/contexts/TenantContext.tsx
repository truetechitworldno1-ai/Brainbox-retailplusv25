import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAudio } from './AudioContext';

interface Tenant {
  id: string;
  companyName: string;
  businessRegistration: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  subscriptionPlan: 'basic' | 'pro' | 'advance';
  maxSystems: number;
  maxPhones: number;
  isActive: boolean;
  createdAt: Date;
  settings: {
    currency: string;
    taxRate: number;
    timezone: string;
    features: string[];
  };
}

interface TenantContextType {
  currentTenant: Tenant | null;
  isMultiTenant: boolean;
  isAppOwner: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (tenantData: Omit<Tenant, 'id' | 'createdAt'>) => Promise<Tenant>;
  updateTenant: (updates: Partial<Tenant>) => Promise<void>;
  getAllTenants: () => Tenant[];
  getTenantKey: (dataType: string) => string;
  getIsolatedData: (dataType: string) => any[];
  setIsolatedData: (dataType: string, data: any[]) => Promise<void>;
  loadSalesFromSupabase: () => Promise<any[]>;
  clearTenantData: (tenantId: string) => void;
  getCompanySpecificData: (dataType: string) => any[];
  setCompanySpecificData: (dataType: string, data: any[]) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { playWelcomeMessage } = useAudio();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isMultiTenant] = useState(true);
  const [isAppOwner, setIsAppOwner] = useState(false);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);

  useEffect(() => {
    initializeTenant();
  }, []);

  const initializeTenant = async () => {
    try {
      // Check if this is app owner access
      const urlParams = new URLSearchParams(window.location.search);
      const ownerParam = urlParams.get('owner');
      const ownerKey = urlParams.get('key');

      if (ownerParam === 'true' && ownerKey === 'TIW2025') {
        setIsAppOwner(true);
        console.log('App Owner Access Granted');
        return;
      }

      // Get current logged in user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('No user logged in');
        return;
      }

      // Get user's tenant from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) throw userError;

      if (userData?.tenant_id) {
        // Load tenant from Supabase
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userData.tenant_id)
          .maybeSingle();

        if (tenantError) throw tenantError;

        if (tenantData) {
          setCurrentTenant({
            id: tenantData.id,
            companyName: tenantData.name || tenantData.business_name,
            businessRegistration: tenantData.business_name || '',
            contactEmail: tenantData.email || '',
            contactPhone: tenantData.phone || '',
            address: tenantData.address || '',
            subscriptionPlan: tenantData.subscription_tier || 'basic',
            maxSystems: tenantData.max_users || 3,
            maxPhones: tenantData.max_products || 1000,
            isActive: tenantData.is_active,
            createdAt: new Date(tenantData.created_at),
            settings: tenantData.settings || {
              currency: '₦',
              taxRate: 7.5,
              timezone: 'Africa/Lagos',
              features: ['pos', 'inventory', 'customers', 'reports']
            }
          });
          return;
        }
      }
    } catch (error) {
      console.warn('Tenant initialization failed, using defaults:', error);
      // Don't let tenant initialization failure crash the app
      setCurrentTenant({
        id: 'default',
        companyName: 'Demo Store',
        businessRegistration: 'RC123456',
        contactEmail: 'demo@store.com',
        contactPhone: '+234-xxx-xxx-xxxx',
        address: '123 Business Street, Lagos, Nigeria',
        subscriptionPlan: 'basic',
        maxSystems: 3,
        maxPhones: 1,
        isActive: true,
        createdAt: new Date(),
        settings: {
          currency: '₦',
          taxRate: 7.5,
          timezone: 'Africa/Lagos',
          features: ['pos', 'inventory', 'customers', 'reports']
        }
      });
    }
  };

  const getAllTenants = (): Tenant[] => {
    try {
      if (!isAppOwner) {
        return currentTenant ? [currentTenant] : [];
      }
      
      const tenants = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('brainbox_tenant_')) {
          try {
            const tenant = JSON.parse(localStorage.getItem(key) || '{}');
            tenant.createdAt = new Date(tenant.createdAt);
            tenants.push(tenant);
          } catch (error) {
            console.warn('Invalid tenant data:', key);
          }
        }
      }
      return tenants.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.warn('⚠️ Failed to get tenants:', error);
      return [];
    }
  };

  const clearTenantData = (tenantId: string) => {
    try {
      if (!isAppOwner) return;
      
      localStorage.removeItem(`brainbox_tenant_${tenantId}`);
      
      const dataTypes = ['products', 'customers', 'suppliers', 'sales', 'purchases', 'employees', 'categories'];
      dataTypes.forEach(type => {
        localStorage.removeItem(`brainbox_${tenantId}_${type}`);
      });
    } catch (error) {
      console.warn('⚠️ Failed to clear tenant data:', error);
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      const savedTenant = localStorage.getItem(`brainbox_tenant_${tenantId}`);
      if (savedTenant) {
        const tenant = JSON.parse(savedTenant);
        tenant.createdAt = new Date(tenant.createdAt);
        setCurrentTenant(tenant);
        localStorage.setItem('brainbox_current_tenant', tenantId);
        
        if (!isAppOwner) {
          // Play welcome message for regular users
          try {
            playWelcomeMessage();
          } catch (audioError) {
            console.warn('⚠️ Audio playback failed:', audioError);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to switch tenant:', error);
    }
  };

  const createTenant = async (tenantData: Omit<Tenant, 'id' | 'createdAt'>) => {
    try {
      const newTenant: Tenant = {
        ...tenantData,
        id: crypto.randomUUID(),
        createdAt: new Date()
      };

      // Save tenant data
      localStorage.setItem(`brainbox_tenant_${newTenant.id}`, JSON.stringify(newTenant));
      localStorage.setItem('brainbox_current_tenant', newTenant.id);
      setCurrentTenant(newTenant);

      // Initialize empty data for new tenant
      const dataTypes = ['products', 'customers', 'suppliers', 'sales', 'purchases', 'categories'];
      dataTypes.forEach(type => {
        localStorage.setItem(getTenantKey(type), JSON.stringify([]));
      });

      return newTenant;
    } catch (error) {
      console.error('⚠️ Failed to create tenant:', error);
      throw error;
    }
  };

  const updateTenant = async (updates: Partial<Tenant>) => {
    try {
      if (!currentTenant) return;

      const updatedTenant = { ...currentTenant, ...updates };
      setCurrentTenant(updatedTenant);
      localStorage.setItem(`brainbox_tenant_${currentTenant.id}`, JSON.stringify(updatedTenant));
    } catch (error) {
      console.warn('⚠️ Failed to update tenant:', error);
    }
  };

  const getTenantKey = (dataType: string): string => {
    try {
      if (!currentTenant) {
        return `brainbox_${dataType}`;
      }
      return `brainbox_company_${currentTenant.id}_${dataType}`;
    } catch (error) {
      console.warn('⚠️ Failed to get tenant key:', error);
      return `brainbox_${dataType}`;
    }
  };

  const getIsolatedData = (dataType: string): any[] => {
    try {
      const key = getTenantKey(dataType);
      const data = localStorage.getItem(key);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(`⚠️ Failed to get ${dataType} data:`, error);
      return [];
    }
  };

  const loadSalesFromSupabase = async (): Promise<any[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user');
        return [];
      }

      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            id,
            product_id,
            quantity,
            unit_price,
            discount_amount,
            tax_amount,
            subtotal
          )
        `)
        .eq('tenant_id', currentTenant?.id || 'default')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load sales from Supabase:', error);
        return [];
      }

      return salesData || [];
    } catch (error) {
      console.error('Error loading sales:', error);
      return [];
    }
  };

  const setIsolatedData = async (dataType: string, data: any[]) => {
    try {
      const key = getTenantKey(dataType);
      // Save to localStorage for offline access
      localStorage.setItem(key, JSON.stringify(data));

      // Also save to Supabase for permanent storage
      if (dataType === 'sales' && data.length > 0) {
        const lastSale = data[data.length - 1];
        await saveSaleToSupabase(lastSale);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to save ${dataType} data:`, error);
    }
  };

  const saveSaleToSupabase = async (sale: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user, sale saved locally only');
        return;
      }

      // First save the main sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          id: sale.id,
          tenant_id: currentTenant?.id || 'default',
          customer_id: sale.customerId,
          total_amount: sale.total,
          subtotal: sale.subtotal,
          tax_amount: sale.tax,
          discount_amount: sale.discount || 0,
          payment_method: sale.paymentMethod,
          payment_status: 'completed',
          notes: sale.notes || '',
          created_at: sale.timestamp,
          updated_at: sale.timestamp
        })
        .select()
        .single();

      if (saleError) {
        console.error('Failed to save sale to Supabase:', saleError);
        return;
      }

      // Then save sale items
      if (sale.items && sale.items.length > 0) {
        const saleItems = sale.items.map((item: any) => ({
          sale_id: sale.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: 0,
          tax_amount: 0,
          subtotal: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) {
          console.error('Failed to save sale items:', itemsError);
        }
      }

      console.log('✅ Sale saved to Supabase:', sale.id);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
    }
  };

  // Company-specific data access (ensures complete isolation)
  const getCompanySpecificData = (dataType: string): any[] => {
    try {
      if (!currentTenant) return [];
      
      const key = `brainbox_company_${currentTenant.id}_${dataType}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn(`⚠️ Failed to get company ${dataType} data:`, error);
      return [];
    }
  };

  const setCompanySpecificData = (dataType: string, data: any[]) => {
    try {
      if (!currentTenant) return;
      const key = `brainbox_company_${currentTenant.id}_${dataType}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`⚠️ Failed to set company ${dataType} data:`, error);
    }
  };

  const value: TenantContextType = {
    currentTenant,
    isMultiTenant,
    isAppOwner,
    switchTenant,
    createTenant,
    updateTenant,
    getAllTenants,
    getTenantKey,
    getIsolatedData,
    setIsolatedData,
    loadSalesFromSupabase,
    clearTenantData,
    getCompanySpecificData,
    setCompanySpecificData
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}