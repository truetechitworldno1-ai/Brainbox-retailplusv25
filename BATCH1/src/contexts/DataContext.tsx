import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Employee,
  Store,
  StoreTransfer,
  TransferItem,
  SystemSettings,
  Analytics,
  Notification,
  Category,
  HeldReceipt,
  ReturnTransaction,
  CashierSession,
  IdleDisplayConfig,
  AutoReportConfig
} from '../types';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useTenant } from './TenantContext';
import { SupabaseDataService } from '../services/SupabaseDataService';

interface StockLevel {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minStock: number;
  maxStock: number;
  lastUpdated: Date;
}

interface DataContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  refreshProducts: () => void;
  
  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Sales
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  
  // Purchases
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'orderDate'>) => void;
  updatePurchase: (id: string, updates: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  
  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  
  // Salary & Expense Integration
  getEmployeeSalaryRecords: (employeeId: string) => any[];
  getEmployeeRewardActivity: (employeeId: string) => any[];
  linkEmployeeToSalary: (employeeId: string, salaryData: any) => void;
  
  // Stores & Multi-Store
  stores: Store[];
  warehouses: Store[];
  outlets: Store[];
  allLocations: Store[];
  addStore: (store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addWarehouse: (warehouse: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addOutlet: (outlet: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  
  // Store Transfers
  transfers: StoreTransfer[];
  addTransfer: (transfer: Omit<StoreTransfer, 'id'>) => void;
  updateTransfer: (id: string, updates: Partial<StoreTransfer>) => void;
  deleteTransfer: (id: string) => void;
  
  // Stock Levels
  stockLevels: StockLevel[];
  updateStockLevel: (storeId: string, productId: string, quantity: number) => void;
  getStockLevel: (storeId: string, productId: string) => StockLevel | null;
  
  // Returns
  returns: ReturnTransaction[];
  addReturn: (returnData: Omit<ReturnTransaction, 'id'>) => ReturnTransaction;
  
  // Held Receipts
  heldReceipts: HeldReceipt[];
  addHeldReceipt: (receipt: Omit<HeldReceipt, 'id'>) => void;
  removeHeldReceipt: (id: string) => void;
  
  // Cashier Sessions
  cashierSessions: CashierSession[];
  startCashierSession: (cashierId: string, openingBalance: number) => CashierSession;
  endCashierSession: (sessionId: string, closingBalance: number) => void;
  updateCashierSession: (sessionId: string, updates: Partial<CashierSession>) => void;
  
  // System Settings
  systemSettings: SystemSettings;
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;
  
  // Display Configuration
  idleDisplayConfig: IdleDisplayConfig;
  updateIdleDisplayConfig: (updates: Partial<IdleDisplayConfig>) => void;
  
  // Auto Reports
  autoReportConfig: AutoReportConfig;
  updateAutoReportConfig: (updates: Partial<AutoReportConfig>) => void;
  
  // Analytics
  analytics: Analytics;
  
  // System Status
  isOnline: boolean;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSystemSettings: SystemSettings = {
  id: '1',
  businessName: 'Demo Store',
  businessAddress: '123 Business Street, Lagos, Nigeria',
  businessPhone: '+234-xxx-xxx-xxxx',
  businessEmail: 'demo@store.com',
  businessLogo: '',
  businessRegistration: 'RC123456',
  taxId: 'TIN123456',
  receiptHeader: 'Thank you for shopping with us!',
  receiptFooter: 'Please come again!',
  returnPolicy: 'Returns accepted within 7 days with receipt',
  contactInfo: 'For support: +234-xxx-xxx-xxxx',
  currency: '₦',
  taxRate: 7.5,
  taxEnabled: true,
  discountEnabled: true,
  maxDiscountPercentage: 20,
  loyaltyEnabled: true,
  defaultRewardPercentage: 2,
  subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  subscriptionPlan: 'trial',
  paymentMethods: {
    cash: { enabled: true, label: 'Cash', description: 'Cash payment' },
    pos: { enabled: true, label: 'POS Terminal', description: 'Card payment via POS' },
    transfer: { 
      enabled: true, 
      label: 'Bank Transfer', 
      description: 'Bank transfer payment',
      banks: ['GTBank', 'Access Bank', 'First Bank', 'UBA', 'Zenith Bank', 'Fidelity Bank'],
      customBanks: []
    },
    debit: { enabled: true, label: 'Debit Card', description: 'Debit card payment' },
    credit: { enabled: true, label: 'Credit Card', description: 'Credit card payment' }
  },
  features: {
    multiBarcode: true,
    storeTransfer: true,
    audioAlerts: true,
    loyaltyProgram: true,
    offlineMode: true,
    quickbooksExport: true,
    apiIntegration: true,
    advancedReporting: true,
    workstationConfig: true,
    printerIntegration: true,
    scannerIntegration: true,
    priceChecker: true
  },
  workstations: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const defaultIdleDisplayConfig: IdleDisplayConfig = {
  enabled: false,
  type: 'custom_message',
  content: ['Welcome to our store!', 'Special offers available!'],
  rotationInterval: 10,
  showBusinessInfo: true,
  showClock: true,
  customMessage: 'Welcome to our store!',
  adminEmail: 'admin@store.com',
  adminMessage: 'For assistance, please contact staff'
};

const defaultAutoReportConfig: AutoReportConfig = {
  enabled: false,
  frequency: 'daily',
  time: '18:00',
  recipients: [],
  reportTypes: ['sales', 'summary'],
  format: 'pdf',
  customLogo: '',
  customFooter: 'Generated by BrainBox-RetailPlus V25 | © 2025 TIW'
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, queueForSync } = useOfflineSync();
  const { getTenantKey, getIsolatedData, setIsolatedData, currentTenant } = useTenant();
  
  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [warehouses, setWarehouses] = useState<Store[]>([]);
  const [outlets, setOutlets] = useState<Store[]>([]);
  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [heldReceipts, setHeldReceipts] = useState<HeldReceipt[]>([]);
  const [cashierSessions, setCashierSessions] = useState<CashierSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [idleDisplayConfig, setIdleDisplayConfig] = useState<IdleDisplayConfig>(defaultIdleDisplayConfig);
  const [autoReportConfig, setAutoReportConfig] = useState<AutoReportConfig>(defaultAutoReportConfig);

  // Computed values
  const allLocations = [...warehouses, ...outlets, ...stores];

  // Load data on mount
  useEffect(() => {
    try {
      loadAllData();
    } catch (error) {
      console.warn('⚠️ Data loading failed, using safe defaults:', error);
      initializeDefaultData();
    }
  }, []);

  const initializeDefaultData = () => {
    try {
      console.log('🔄 Initializing with safe default data...');
      
      const defaultProducts: Product[] = [
        {
          id: '1',
          name: 'Premium Coffee Beans',
          category: 'Beverages',
          brand: 'Premium Brand',
          barcodes: ['1234567890123'],
          costPrice: 2500,
          sellingPrice: 3500,
          stock: 50,
          minStock: 10,
          maxStock: 100,
          unit: 'kg',
          description: 'High quality coffee beans',
          isActive: true,
          hasVariations: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const defaultCustomers: Customer[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+234-801-234-5678',
          address: '123 Main Street, Lagos',
          loyaltyCard: {
            cardNumber: 'LC001',
            points: 150,
            totalSpent: 25000,
            rewardPercentage: 2,
            tier: 'silver',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true
          },
          totalPurchases: 5,
          lastPurchase: new Date(),
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      setProducts(defaultProducts);
      setCustomers(defaultCustomers);
      setSuppliers([]);
      setSales([]);
      setPurchases([]);
      setEmployees([]);
      
      console.log('✅ Safe default data initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize default data:', error);
      // Even if default data fails, don't crash the app
      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setSales([]);
      setPurchases([]);
      setEmployees([]);
    }
  };

  const loadAllData = () => {
    try {
      loadProducts();
      loadCategories();
      loadCustomers();
      loadSuppliers();
      loadSales();
      loadPurchases();
      loadEmployees();
      loadStores();
      loadWarehouses();
      loadOutlets();
      loadTransfers();
      loadStockLevels();
      loadReturns();
      loadHeldReceipts();
      loadCashierSessions();
      loadSystemSettings();
      loadIdleDisplayConfig();
      loadAutoReportConfig();
    } catch (error) {
      console.warn('⚠️ Some data failed to load:', error);
    }
  };

  // Load functions
  const loadProducts = async () => {
    if (!currentTenant?.id) return;
    try {
      const products = await SupabaseDataService.getProducts(currentTenant.id);
      setProducts(products);
    } catch (error) {
      console.warn('⚠️ Failed to load products from Supabase:', error);
      setProducts([]);
    }
  };

  const loadCategories = async () => {
    if (!currentTenant?.id) return;
    try {
      const categories = await SupabaseDataService.getCategories(currentTenant.id);
      setCategories(categories);
    } catch (error) {
      console.warn('⚠️ Failed to load categories from Supabase:', error);
      setCategories([]);
    }
  };

  const loadCustomers = async () => {
    if (!currentTenant?.id) return;
    try {
      const customers = await SupabaseDataService.getCustomers(currentTenant.id);
      setCustomers(customers);
    } catch (error) {
      console.warn('⚠️ Failed to load customers from Supabase:', error);
      setCustomers([]);
    }
  };

  const loadSuppliers = async () => {
    if (!currentTenant?.id) return;
    try {
      const suppliers = await SupabaseDataService.getSuppliers(currentTenant.id);
      setSuppliers(suppliers);
    } catch (error) {
      console.warn('⚠️ Failed to load suppliers from Supabase:', error);
      setSuppliers([]);
    }
  };

  const loadSales = async () => {
    if (!currentTenant?.id) return;
    try {
      const sales = await SupabaseDataService.getSales(currentTenant.id);
      setSales(sales);
    } catch (error) {
      console.warn('⚠️ Failed to load sales from Supabase:', error);
      setSales([]);
    }
  };

  const loadPurchases = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('purchases') : [];
      if (saved.length > 0) {
        const purchases = saved.map(p => ({
          ...p,
          orderDate: new Date(p.orderDate),
          expectedDelivery: p.expectedDelivery ? new Date(p.expectedDelivery) : undefined,
          receivedDate: p.receivedDate ? new Date(p.receivedDate) : undefined
        }));
        setPurchases(purchases);
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load purchases:', error);
      setPurchases([]);
    }
  };

  const loadEmployees = async () => {
    if (!currentTenant?.id) return;
    try {
      const employees = await SupabaseDataService.getEmployees(currentTenant.id);
      setEmployees(employees);
    } catch (error) {
      console.warn('⚠️ Failed to load employees from Supabase:', error);
      setEmployees([]);
    }
  };

  const loadStores = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('stores') : [];
      if (saved.length > 0) {
        const stores = saved.map(s => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }));
        setStores(stores);
      } else {
        setStores([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load stores:', error);
      setStores([]);
    }
  };

  const loadWarehouses = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('warehouses') : [];
      if (saved.length > 0) {
        const warehouses = saved.map(w => ({
          ...w,
          createdAt: new Date(w.createdAt),
          updatedAt: new Date(w.updatedAt)
        }));
        setWarehouses(warehouses);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load warehouses:', error);
      setWarehouses([]);
    }
  };

  const loadOutlets = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('outlets') : [];
      if (saved.length > 0) {
        const outlets = saved.map(o => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt)
        }));
        setOutlets(outlets);
      } else {
        setOutlets([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load outlets:', error);
      setOutlets([]);
    }
  };

  const loadTransfers = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('transfers') : [];
      if (saved.length > 0) {
        const transfers = saved.map(t => ({
          ...t,
          transferDate: new Date(t.transferDate),
          completedDate: t.completedDate ? new Date(t.completedDate) : undefined,
          estimatedDeliveryTime: t.estimatedDeliveryTime ? new Date(t.estimatedDeliveryTime) : undefined,
          actualDeliveryTime: t.actualDeliveryTime ? new Date(t.actualDeliveryTime) : undefined
        }));
        setTransfers(transfers);
      } else {
        setTransfers([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load transfers:', error);
      setTransfers([]);
    }
  };

  const loadStockLevels = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('stockLevels') : [];
      if (saved.length > 0) {
        const stockLevels = saved.map(sl => ({
          ...sl,
          lastUpdated: new Date(sl.lastUpdated)
        }));
        setStockLevels(stockLevels);
      } else {
        setStockLevels([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load stock levels:', error);
      setStockLevels([]);
    }
  };

  const loadReturns = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('returns') : [];
      if (saved.length > 0) {
        const returns = saved.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }));
        setReturns(returns);
      } else {
        setReturns([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load returns:', error);
      setReturns([]);
    }
  };

  const loadHeldReceipts = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('heldReceipts') : [];
      if (saved.length > 0) {
        const heldReceipts = saved.map(hr => ({
          ...hr,
          heldAt: new Date(hr.heldAt)
        }));
        setHeldReceipts(heldReceipts);
      } else {
        setHeldReceipts([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load held receipts:', error);
      setHeldReceipts([]);
    }
  };

  const loadCashierSessions = () => {
    try {
      const saved = getIsolatedData ? getIsolatedData('cashierSessions') : [];
      if (saved.length > 0) {
        const sessions = saved.map(cs => ({
          ...cs,
          sessionStart: new Date(cs.sessionStart),
          sessionEnd: cs.sessionEnd ? new Date(cs.sessionEnd) : undefined
        }));
        setCashierSessions(sessions);
      } else {
        setCashierSessions([]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cashier sessions:', error);
      setCashierSessions([]);
    }
  };

  const loadSystemSettings = () => {
    try {
      const saved = localStorage.getItem('brainbox_system_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setSystemSettings({
          ...defaultSystemSettings,
          ...settings,
          createdAt: new Date(settings.createdAt || new Date()),
          updatedAt: new Date(settings.updatedAt || new Date()),
          subscriptionExpiryDate: new Date(settings.subscriptionExpiryDate || Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }
    } catch (error) {
      console.warn('⚠️ Failed to load system settings:', error);
      setSystemSettings(defaultSystemSettings);
    }
  };

  const loadIdleDisplayConfig = () => {
    try {
      const saved = localStorage.getItem('brainbox_idle_display_config');
      if (saved) {
        setIdleDisplayConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('⚠️ Failed to load idle display config:', error);
      setIdleDisplayConfig(defaultIdleDisplayConfig);
    }
  };

  const loadAutoReportConfig = () => {
    try {
      const saved = localStorage.getItem('brainbox_auto_report_config');
      if (saved) {
        setAutoReportConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('⚠️ Failed to load auto report config:', error);
      setAutoReportConfig(defaultAutoReportConfig);
    }
  };

  // Product functions
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentTenant?.id) return;
    try {
      const newProduct = await SupabaseDataService.addProduct(currentTenant.id, productData);
      setProducts([...products, newProduct]);
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await SupabaseDataService.updateProduct(id, updates);
      const updatedProducts = products.map(product =>
        product.id === id ? { ...product, ...updates, updatedAt: new Date() } : product
      );
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await SupabaseDataService.deleteProduct(id);
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  // Category functions
  const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    if (!currentTenant?.id) return;
    try {
      const newCategory = await SupabaseDataService.addCategory(currentTenant.id, categoryData);
      setCategories([...categories, newCategory]);
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updatedCategories = categories.map(category =>
      category.id === id ? { ...category, ...updates } : category
    );
    setCategories(updatedCategories);
    setIsolatedData('categories', updatedCategories);
  };

  const deleteCategory = (id: string) => {
    const updatedCategories = categories.filter(category => category.id !== id);
    setCategories(updatedCategories);
    setIsolatedData('categories', updatedCategories);
  };

  // Customer functions
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!currentTenant?.id) return;
    try {
      const newCustomer = await SupabaseDataService.addCustomer(currentTenant.id, customerData);
      setCustomers([...customers, newCustomer]);
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      await SupabaseDataService.updateCustomer(id, updates);
      const updatedCustomers = customers.map(customer =>
        customer.id === id ? { ...customer, ...updates } : customer
      );
      setCustomers(updatedCustomers);
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await SupabaseDataService.deleteCustomer(id);
      const updatedCustomers = customers.filter(customer => customer.id !== id);
      setCustomers(updatedCustomers);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  };

  // Supplier functions
  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    if (!currentTenant?.id) return;
    try {
      const newSupplier = await SupabaseDataService.addSupplier(currentTenant.id, supplierData);
      setSuppliers([...suppliers, newSupplier]);
    } catch (error) {
      console.error('Failed to add supplier:', error);
      throw error;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      await SupabaseDataService.updateSupplier(id, updates);
      const updatedSuppliers = suppliers.map(supplier =>
        supplier.id === id ? { ...supplier, ...updates } : supplier
      );
      setSuppliers(updatedSuppliers);
    } catch (error) {
      console.error('Failed to update supplier:', error);
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await SupabaseDataService.deleteSupplier(id);
      const updatedSuppliers = suppliers.filter(supplier => supplier.id !== id);
      setSuppliers(updatedSuppliers);
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      throw error;
    }
  };

  // Sale functions
  const addSale = async (saleData: Omit<Sale, 'id'>) => {
    if (!currentTenant?.id) return;
    try {
      const newSale = await SupabaseDataService.addSale(currentTenant.id, saleData);
      setSales([...sales, newSale]);
    } catch (error) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  };

  const updateSale = (id: string, updates: Partial<Sale>) => {
    const updatedSales = sales.map(sale =>
      sale.id === id ? { ...sale, ...updates } : sale
    );
    setSales(updatedSales);
    setIsolatedData('sales', updatedSales);
  };

  const deleteSale = (id: string) => {
    const updatedSales = sales.filter(sale => sale.id !== id);
    setSales(updatedSales);
    setIsolatedData('sales', updatedSales);
    queueForSync('delete', 'sales', { id });
  };

  // Purchase functions
  const addPurchase = (purchaseData: Omit<Purchase, 'id' | 'orderDate'>) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: crypto.randomUUID(),
      orderDate: new Date()
    };
    const updatedPurchases = [...purchases, newPurchase];
    setPurchases(updatedPurchases);
    setIsolatedData('purchases', updatedPurchases);
  };

  const updatePurchase = (id: string, updates: Partial<Purchase>) => {
    const updatedPurchases = purchases.map(purchase =>
      purchase.id === id ? { ...purchase, ...updates } : purchase
    );
    setPurchases(updatedPurchases);
    setIsolatedData('purchases', updatedPurchases);
  };

  const deletePurchase = (id: string) => {
    const updatedPurchases = purchases.filter(purchase => purchase.id !== id);
    setPurchases(updatedPurchases);
    setIsolatedData('purchases', updatedPurchases);
  };

  // Employee functions
  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    if (!currentTenant?.id) return;
    try {
      const newEmployee = await SupabaseDataService.addEmployee(currentTenant.id, employeeData);
      setEmployees([...employees, newEmployee]);
    } catch (error) {
      console.error('Failed to add employee:', error);
      throw error;
    }
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const updatedEmployees = employees.map(employee =>
      employee.id === id ? { ...employee, ...updates } : employee
    );
    setEmployees(updatedEmployees);
    setIsolatedData('employees', updatedEmployees);
  };

  const deleteEmployee = (id: string) => {
    const updatedEmployees = employees.filter(employee => employee.id !== id);
    setEmployees(updatedEmployees);
    setIsolatedData('employees', updatedEmployees);
  };

  // Employee integration functions
  const getEmployeeSalaryRecords = (employeeId: string) => {
    const salaryRecords = getIsolatedData('salary_records');
    return salaryRecords.filter((record: any) => record.employeeId === employeeId);
  };

  const getEmployeeRewardActivity = (employeeId: string) => {
    const rewardActivity = getIsolatedData('reward_activity');
    return rewardActivity.filter((activity: any) => activity.approvedBy === employeeId);
  };

  const linkEmployeeToSalary = (employeeId: string, salaryData: any) => {
    const salaryRecords = getIsolatedData('salary_records');
    const newRecord = {
      ...salaryData,
      id: crypto.randomUUID(),
      employeeId,
      createdAt: new Date()
    };
    setIsolatedData('salary_records', [...salaryRecords, newRecord]);
  };

  // Store functions
  const addStore = (storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStore: Store = {
      ...storeData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updatedStores = [...stores, newStore];
    setStores(updatedStores);
    setIsolatedData('stores', updatedStores);
  };

  const addWarehouse = (warehouseData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newWarehouse: Store = {
      ...warehouseData,
      id: crypto.randomUUID(),
      type: 'warehouse',
      locationType: 'warehouse',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updatedWarehouses = [...warehouses, newWarehouse];
    setWarehouses(updatedWarehouses);
    setIsolatedData('warehouses', updatedWarehouses);
  };

  const addOutlet = (outletData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOutlet: Store = {
      ...outletData,
      id: crypto.randomUUID(),
      locationType: 'outlet',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updatedOutlets = [...outlets, newOutlet];
    setOutlets(updatedOutlets);
    setIsolatedData('outlets', updatedOutlets);
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    // Update in all relevant arrays
    const updatedStores = stores.map(store =>
      store.id === id ? { ...store, ...updates, updatedAt: new Date() } : store
    );
    const updatedWarehouses = warehouses.map(warehouse =>
      warehouse.id === id ? { ...warehouse, ...updates, updatedAt: new Date() } : warehouse
    );
    const updatedOutlets = outlets.map(outlet =>
      outlet.id === id ? { ...outlet, ...updates, updatedAt: new Date() } : outlet
    );
    
    setStores(updatedStores);
    setWarehouses(updatedWarehouses);
    setOutlets(updatedOutlets);
    setIsolatedData('stores', updatedStores);
    setIsolatedData('warehouses', updatedWarehouses);
    setIsolatedData('outlets', updatedOutlets);
  };

  const deleteStore = (id: string) => {
    const updatedStores = stores.filter(store => store.id !== id);
    const updatedWarehouses = warehouses.filter(warehouse => warehouse.id !== id);
    const updatedOutlets = outlets.filter(outlet => outlet.id !== id);
    
    setStores(updatedStores);
    setWarehouses(updatedWarehouses);
    setOutlets(updatedOutlets);
    setIsolatedData('stores', updatedStores);
    setIsolatedData('warehouses', updatedWarehouses);
    setIsolatedData('outlets', updatedOutlets);
  };

  // Transfer functions
  const addTransfer = (transferData: Omit<StoreTransfer, 'id'>) => {
    const newTransfer: StoreTransfer = {
      ...transferData,
      id: crypto.randomUUID()
    };
    const updatedTransfers = [...transfers, newTransfer];
    setTransfers(updatedTransfers);
    setIsolatedData('transfers', updatedTransfers);
  };

  const updateTransfer = (id: string, updates: Partial<StoreTransfer>) => {
    const updatedTransfers = transfers.map(transfer =>
      transfer.id === id ? { ...transfer, ...updates } : transfer
    );
    setTransfers(updatedTransfers);
    setIsolatedData('transfers', updatedTransfers);
  };

  const deleteTransfer = (id: string) => {
    const updatedTransfers = transfers.filter(transfer => transfer.id !== id);
    setTransfers(updatedTransfers);
    setIsolatedData('transfers', updatedTransfers);
  };

  // Stock level functions
  const updateStockLevel = (storeId: string, productId: string, quantity: number) => {
    const existingLevel = stockLevels.find(sl => sl.storeId === storeId && sl.productId === productId);
    
    if (existingLevel) {
      const updatedLevels = stockLevels.map(level =>
        level.id === existingLevel.id 
          ? { ...level, quantity, availableQuantity: quantity, lastUpdated: new Date() }
          : level
      );
      setStockLevels(updatedLevels);
      setIsolatedData('stockLevels', updatedLevels);
    } else {
      const newLevel: StockLevel = {
        id: crypto.randomUUID(),
        storeId,
        productId,
        quantity,
        availableQuantity: quantity,
        reservedQuantity: 0,
        minStock: 10,
        maxStock: 100,
        lastUpdated: new Date()
      };
      const updatedLevels = [...stockLevels, newLevel];
      setStockLevels(updatedLevels);
      setIsolatedData('stockLevels', updatedLevels);
    }
  };

  const getStockLevel = (storeId: string, productId: string): StockLevel | null => {
    return stockLevels.find(sl => sl.storeId === storeId && sl.productId === productId) || null;
  };

  // Return functions
  const addReturn = (returnData: Omit<ReturnTransaction, 'id'>): ReturnTransaction => {
    const newReturn: ReturnTransaction = {
      ...returnData,
      id: crypto.randomUUID()
    };
    const updatedReturns = [...returns, newReturn];
    setReturns(updatedReturns);
    setIsolatedData('returns', updatedReturns);
    return newReturn;
  };

  // Held receipt functions
  const addHeldReceipt = (receiptData: Omit<HeldReceipt, 'id'>) => {
    const newReceipt: HeldReceipt = {
      ...receiptData,
      id: crypto.randomUUID()
    };
    const updatedReceipts = [...heldReceipts, newReceipt];
    setHeldReceipts(updatedReceipts);
    setIsolatedData('heldReceipts', updatedReceipts);
  };

  const removeHeldReceipt = (id: string) => {
    const updatedReceipts = heldReceipts.filter(receipt => receipt.id !== id);
    setHeldReceipts(updatedReceipts);
    setIsolatedData('heldReceipts', updatedReceipts);
  };

  // Cashier session functions
  const startCashierSession = (cashierId: string, openingBalance: number): CashierSession => {
    const newSession: CashierSession = {
      id: crypto.randomUUID(),
      cashierId,
      openingBalance,
      currentBalance: openingBalance,
      totalSales: 0,
      totalReturns: 0,
      totalCash: 0,
      totalCard: 0,
      totalTransfer: 0,
      sessionStart: new Date(),
      isActive: true,
      transactions: []
    };
    const updatedSessions = [...cashierSessions, newSession];
    setCashierSessions(updatedSessions);
    setIsolatedData('cashierSessions', updatedSessions);
    return newSession;
  };

  const endCashierSession = (sessionId: string, closingBalance: number) => {
    const updatedSessions = cashierSessions.map(session =>
      session.id === sessionId 
        ? { ...session, sessionEnd: new Date(), isActive: false, currentBalance: closingBalance }
        : session
    );
    setCashierSessions(updatedSessions);
    setIsolatedData('cashierSessions', updatedSessions);
  };

  const updateCashierSession = (sessionId: string, updates: Partial<CashierSession>) => {
    const updatedSessions = cashierSessions.map(session =>
      session.id === sessionId ? { ...session, ...updates } : session
    );
    setCashierSessions(updatedSessions);
    setIsolatedData('cashierSessions', updatedSessions);
  };

  // System settings functions
  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    const updatedSettings = {
      ...systemSettings,
      ...updates,
      updatedAt: new Date()
    };
    setSystemSettings(updatedSettings);
    localStorage.setItem('brainbox_system_settings', JSON.stringify(updatedSettings));
  };

  const updateIdleDisplayConfig = (updates: Partial<IdleDisplayConfig>) => {
    const updatedConfig = { ...idleDisplayConfig, ...updates };
    setIdleDisplayConfig(updatedConfig);
    localStorage.setItem('brainbox_idle_display_config', JSON.stringify(updatedConfig));
  };

  const updateAutoReportConfig = (updates: Partial<AutoReportConfig>) => {
    const updatedConfig = { ...autoReportConfig, ...updates };
    setAutoReportConfig(updatedConfig);
    localStorage.setItem('brainbox_auto_report_config', JSON.stringify(updatedConfig));
  };

  // Notification functions
  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
  };

  // Calculate analytics
  const analytics: Analytics = {
    totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    totalSales: sales.length,
    topSellingProducts: products
      .map(product => {
        const quantitySold = sales.reduce((sum, sale) => 
          sum + sale.items.filter(item => item.productId === product.id)
            .reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );
        const revenue = sales.reduce((sum, sale) => 
          sum + sale.items.filter(item => item.productId === product.id)
            .reduce((itemSum, item) => itemSum + item.total, 0), 0
        );
        return {
          productId: product.id,
          productName: product.name,
          quantitySold,
          revenue
        };
      })
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5),
    lowPerformingProducts: products
      .map(product => {
        const quantitySold = sales.reduce((sum, sale) => 
          sum + sale.items.filter(item => item.productId === product.id)
            .reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );
        const revenue = sales.reduce((sum, sale) => 
          sum + sale.items.filter(item => item.productId === product.id)
            .reduce((itemSum, item) => itemSum + item.total, 0), 0
        );
        return {
          productId: product.id,
          productName: product.name,
          quantitySold,
          revenue
        };
      })
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 5)
  };

  const value: DataContextType = {
    // Products
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: loadProducts,
    
    // Categories
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Customers
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    
    // Suppliers
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Sales
    sales,
    addSale,
    updateSale,
    deleteSale,
    
    // Purchases
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    
    // Employees
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Stores & Multi-Store
    stores,
    warehouses,
    outlets,
    allLocations,
    addStore,
    addWarehouse,
    addOutlet,
    updateStore,
    deleteStore,
    
    // Transfers
    transfers,
    addTransfer,
    updateTransfer,
    deleteTransfer,
    
    // Stock Levels
    stockLevels,
    updateStockLevel,
    getStockLevel,
    
    // Returns
    returns,
    addReturn,
    
    // Held Receipts
    heldReceipts,
    addHeldReceipt,
    removeHeldReceipt,
    
    // Cashier Sessions
    cashierSessions,
    startCashierSession,
    endCashierSession,
    updateCashierSession,
    
    // System Settings
    systemSettings,
    updateSystemSettings,
    
    // Display Configuration
    idleDisplayConfig,
    updateIdleDisplayConfig,
    
    // Auto Reports
    autoReportConfig,
    updateAutoReportConfig,
    
    // Analytics
    analytics,
    
    // System Status
    isOnline,
    notifications,
    addNotification,
    
    // Employee Integration
    getEmployeeSalaryRecords,
    getEmployeeRewardActivity,
    linkEmployeeToSalary
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}