export interface APIIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'sync';
  endpoint: string;
  apiKey: string;
  permissions: string[];
  isActive: boolean;
  lastSync?: Date;
  createdAt: Date;
}

export interface SMSProvider {
  id: string;
  name: string;
  type: 'twilio' | 'nexmo' | 'africastalking' | 'termii' | 'custom';
  apiKey: string;
  apiSecret: string;
  senderId: string;
  isActive: boolean;
  isDefault: boolean;
  settings: {
    baseUrl?: string;
    endpoint?: string;
    headers?: Record<string, string>;
  };
}

export interface WhatsAppProvider {
  id: string;
  name: string;
  type: 'whatsapp_business' | 'twilio_whatsapp' | 'custom';
  apiKey: string;
  phoneNumberId: string;
  accessToken: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface EmailProvider {
  id: string;
  name: string;
  type: 'sendgrid' | 'mailgun' | 'smtp' | 'custom';
  apiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface MessageSettings {
  smsProvider: SMSProvider | null;
  whatsappProvider: WhatsAppProvider | null;
  emailProvider: EmailProvider | null;
  autoSendReceipts: boolean;
  autoSendThankYou: boolean;
  businessOwnerNotifications: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    notifyOnRewards: boolean;
    notifyOnLargeTransactions: boolean;
    largeTransactionThreshold: number;
  };
}

export interface User {
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
  isFirstLogin?: boolean;
  requirePasswordReset?: boolean;
  customPermissions?: string[];
  canBeImpersonated?: boolean;
  franchiseId?: string;
  businessId?: string;
}

export interface CashierSession {
  id: string;
  cashierId: string;
  openingBalance: number;
  currentBalance: number;
  totalSales: number;
  totalReturns: number;
  totalCash: number;
  totalCard: number;
  totalTransfer: number;
  sessionStart: Date;
  sessionEnd?: Date;
  isActive: boolean;
  transactions: string[];
}

export interface ReturnTransaction {
  id: string;
  originalSaleId: string;
  originalReceiptNumber: string;
  customerId?: string;
  items: ReturnItem[];
  totalRefund: number;
  reason: string;
  cashierId: string;
  timestamp: Date;
  refundMethod: 'cash' | 'card' | 'store_credit';
  managerApproval?: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalRefund: number;
  reason: string;
}

export interface SubscriptionAlert {
  id: string;
  type: 'expiry_warning' | 'feature_restriction' | 'payment_overdue';
  title: string;
  message: string;
  daysRemaining?: number;
  isActive: boolean;
  createdAt: Date;
  customizable: boolean;
}

export interface IdleDisplayConfig {
  enabled: boolean;
  type: 'adverts' | 'slides' | 'custom_message';
  content: string[];
  rotationInterval: number; // seconds
  showBusinessInfo: boolean;
  showClock: boolean;
  customMessage: string;
  adminEmail: string;
  adminMessage: string;
}

export interface AutoReportConfig {
  enabled: boolean;
  frequency: 'daily' | 'shift_end' | 'custom';
  time: string; // HH:MM format
  recipients: string[]; // email addresses
  reportTypes: ('sales' | 'stock' | 'cashier' | 'summary')[];
  customLogo?: string;
  customFooter?: string;
  format: 'pdf' | 'excel' | 'text';
}
export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
    ip: string;
    userAgent: string;
  };
  loginTime: Date;
  lastActivity: Date;
  isActive: boolean;
  location?: string;
}

export interface TIWSettings {
  id: string;
  tiwPassword: string;
  shortKey: string;
  canEditBuyerSettings: boolean;
  canEditClientDetails: boolean;
  lastAccess: Date;
  accessLog: TIWAccessLog[];
}

export interface TIWAccessLog {
  id: string;
  action: string;
  timestamp: Date;
  details?: string;
}
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  taxId?: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemVariation {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  attributes: Record<string, string>; // e.g., { size: 'Large', color: 'Red' }
  isActive: boolean;
  createdAt: string;
}

export interface AccountingReport {
  id: string;
  type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'trial_balance' | 'expense_report';
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  data: any;
  generatedBy: string;
  generatedAt: string;
  accessLevel: ('accountant' | 'supervisor' | 'auditor' | 'manager')[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  barcodes: string[];
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  supplierId?: string;
  hasVariations: boolean;
  variations?: ItemVariation[];
  unit: string;
  description?: string;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  allowMultipleBarcode?: boolean;
  isTaxable?: boolean;
  taxRate?: number;
  taxAmount?: number;
  priceWithTax?: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyCard: {
    cardNumber: string;
    points: number;
    totalSpent: number;
    rewardPercentage: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    expiryDate: Date;
    isActive: boolean;
  };
  totalPurchases: number;
  lastPurchase: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  totalItemsReceived: number;
  totalAmountReceived: number;
  totalAmountPaid: number;
  balance: number;
  isActive: boolean;
  createdAt: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  barcode: string;
  isTaxable?: boolean;
  taxRate?: number;
  taxAmount?: number;
  subtotal?: number;
}

export interface PaymentDetail {
  method: 'cash' | 'pos' | 'transfer' | 'debit' | 'credit';
  amount: number;
  reference?: string;
  bank?: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  taxAmount?: number;
  discount: number;
  discountAmount?: number;
  total: number;
  paymentMethod: 'cash' | 'pos' | 'transfer' | 'debit' | 'credit' | 'split';
  paymentDetails: PaymentDetail[];
  cashierId: string;
  timestamp: Date;
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  isHeld: boolean;
  holdReason?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  salary: number;
  payPeriod: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
  hireDate: Date;
  isActive: boolean;
  permissions: string[];
  role: 'admin' | 'manager' | 'cashier' | 'inventory_officer';
}

export interface Store {
  id: string;
  name: string;
  code: string;
  type: 'headquarters' | 'outlet' | 'warehouse' | 'store';
  locationType: 'warehouse' | 'outlet' | 'store';
  parentId?: string; // For stores inside HQ/outlets
  outletId?: string; // For stores, references the outlet they belong to
  warehouseId?: string; // Primary warehouse for this location
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  email: string;
  manager: string;
  assistantManager?: string;
  capacity?: number; // Storage capacity
  currentStock?: number; // Current stock level
  operatingHours?: {
    open: string;
    close: string;
    timezone: string;
  };
  features?: {
    coldStorage: boolean;
    hazmatStorage: boolean;
    loadingDocks: number;
    securityLevel: 'basic' | 'medium' | 'high';
    automatedSorting: boolean;
    inventoryTracking: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreTransfer {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  transferType: 'warehouse_to_hq' | 'warehouse_to_outlet' | 'hq_to_outlet' | 'outlet_to_hq' | 'store_to_store' | 'emergency_transfer';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  transportMethod?: 'truck' | 'van' | 'motorcycle' | 'pickup';
  driverInfo?: {
    name: string;
    phone: string;
    vehicleNumber: string;
  };
  items: TransferItem[];
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  transferDate: Date;
  completedDate?: Date;
  trackingNumber?: string;
  cost?: number;
  notes?: string;
}

export interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
  requestedQuantity: number;
  approvedQuantity?: number;
  receivedQuantity?: number;
  unitCost: number;
  totalCost: number;
  barcode: string;
  expiryDate?: Date;
  batchNumber?: string;
  condition: 'new' | 'good' | 'damaged' | 'expired';
  notes?: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal?: number;
  tax?: number;
  totalAmount: number;
  status: 'pending' | 'received' | 'partial' | 'cancelled' | 'returned';
  orderDate: Date;
  expectedDelivery?: Date;
  receivedDate?: Date;
  receivedBy?: string;
  returnReason?: string;
  originalPurchaseId?: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
  actualCost?: number;
  returnedQuantity?: number;
  returnReason?: string;
}

export interface ReturnOrder {
  id: string;
  purchaseId: string;
  supplierId: string;
  supplierName: string;
  items: ReturnItem[];
  totalRefund: number;
  reason: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  returnDate: Date;
  processedBy?: string;
  notes?: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalRefund: number;
  reason: string;
}

export interface Analytics {
  totalRevenue: number;
  totalSales: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  lowPerformingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
}

export interface SystemSettings {
  id: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessLogo?: string;
  businessRegistration?: string;
  taxId?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  returnPolicy?: string;
  contactInfo?: string;
  currency: string;
  taxRate: number;
  taxEnabled: boolean;
  discountEnabled: boolean;
  maxDiscountPercentage: number;
  loyaltyEnabled: boolean;
  defaultRewardPercentage: number;
  subscriptionExpiryDate: Date;
  subscriptionPlan: 'trial' | 'basic' | 'professional' | 'enterprise';
  paymentMethods: {
    cash: { enabled: boolean; label: string; description: string; };
    pos: { enabled: boolean; label: string; description: string; };
    transfer: { 
      enabled: boolean; 
      label: string; 
      description: string;
      banks: string[];
      customBanks: string[];
    };
    debit: { enabled: boolean; label: string; description: string; };
    credit: { enabled: boolean; label: string; description: string; };
  };
  features: {
    multiBarcode: boolean;
    storeTransfer: boolean;
    audioAlerts: boolean;
    loyaltyProgram: boolean;
    offlineMode: boolean;
    quickbooksExport: boolean;
    apiIntegration: boolean;
    advancedReporting: boolean;
    workstationConfig: boolean;
    printerIntegration: boolean;
    scannerIntegration: boolean;
    priceChecker: boolean;
  };
  workstations: WorkstationConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkstationConfig {
  id: string;
  name: string;
  type: 'pos' | 'price_checker' | 'inventory' | 'admin';
  location: string;
  ipAddress?: string;
  macAddress?: string;
  printerConfig?: {
    enabled: boolean;
    printerName: string;
    printerModel: string;
    connectionType: 'usb' | 'network' | 'bluetooth';
    ipAddress?: string;
    paperSize: 'thermal_58mm' | 'thermal_80mm' | 'a4';
    autoprint: boolean;
    copies: number;
    headerText?: string;
    footerText?: string;
  };
  scannerConfig?: {
    enabled: boolean;
    scannerModel: string;
    scannerType: 'usb' | 'bluetooth' | 'wireless';
    connectionPort?: string;
    autoSubmit: boolean;
    beepOnScan: boolean;
    scanPrefix?: string;
    scanSuffix?: string;
  };
  displayConfig?: {
    customerDisplay: boolean;
    customerDisplayModel?: string;
    dualMonitor: boolean;
    fontSize: 'small' | 'medium' | 'large';
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  cashDrawerConfig?: {
    enabled: boolean;
    model: string;
    connectionType: 'usb' | 'network' | 'serial';
    openOnSale: boolean;
    openCommand?: string;
  };
  scaleConfig?: {
    enabled: boolean;
    model: string;
    connectionType: 'usb' | 'serial';
    unit: 'kg' | 'lb';
    precision: number;
  };
  isActive: boolean;
  createdAt: Date;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'thermal' | 'inkjet' | 'laser' | 'dot_matrix';
  brand: 'epson' | 'star' | 'citizen' | 'bixolon' | 'zebra' | 'hp' | 'canon' | 'brother' | 'custom';
  model: string;
  connectionType: 'usb' | 'ethernet' | 'wifi' | 'bluetooth' | 'serial' | 'parallel';
  
  // Connection Settings
  ipAddress?: string;
  port?: number;
  macAddress?: string;
  serialPort?: string;
  baudRate?: number;
  wifiSSID?: string;
  wifiPassword?: string;
  bluetoothAddress?: string;
  
  // Paper & Print Settings
  paperSize: 'thermal_58mm' | 'thermal_80mm' | 'thermal_112mm' | 'a4' | 'a5' | 'letter' | 'custom';
  paperWidth?: number;
  paperHeight?: number;
  printDensity: 'light' | 'medium' | 'dark';
  printSpeed: 'slow' | 'medium' | 'fast';
  cutType: 'full' | 'partial' | 'none';
  
  // Business Information for Receipts
  businessInfo: {
    companyName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    website?: string;
    taxId?: string;
    registrationNumber?: string;
    logo?: string;
  };
  
  // Receipt Layout
  receiptLayout: {
    headerText?: string;
    footerText?: string;
    showLogo: boolean;
    showBusinessInfo: boolean;
    showTaxInfo: boolean;
    showDateTime: boolean;
    showCashier: boolean;
    showCustomerInfo: boolean;
    showLoyaltyInfo: boolean;
    itemNameWidth: number;
    priceAlignment: 'left' | 'right';
    fontSize: 'small' | 'medium' | 'large';
    lineSpacing: 'compact' | 'normal' | 'wide';
  };
  
  // Print Behavior
  printSettings: {
    autoprint: boolean;
    copies: number;
    printCustomerCopy: boolean;
    printMerchantCopy: boolean;
    openDrawerAfterPrint: boolean;
    buzzerOnPrint: boolean;
    printTestPageOnSetup: boolean;
  };
  
  // Network Discovery Settings
  networkSettings?: {
    autoDiscovery: boolean;
    scanRange: string;
    customPorts: number[];
    sharedPrinterName?: string;
    workgroupName?: string;
  };
  
  // Advanced Settings
  advancedSettings?: {
    commandSet: 'esc_pos' | 'pcl' | 'postscript' | 'custom';
    customCommands?: {
      initialize: string;
      cut: string;
      openDrawer: string;
      buzzer: string;
    };
    encoding: 'utf8' | 'ascii' | 'cp437' | 'cp850';
    lineEnding: 'lf' | 'crlf' | 'cr';
  };
  
  isActive: boolean;
  isDefault: boolean;
  lastTestPrint?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
}
export interface HeldReceipt {
  id: string;
  receiptNumber: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  cashierId: string;
  holdReason: string;
  heldAt: Date;
  loyaltyPointsEarned: number;
}

export interface SubscriptionAlert {
  id: string;
  type: 'expiry_warning' | 'feature_limit' | 'payment_due';
  title: string;
  message: string;
  daysRemaining?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ExpiryAlert {
  id: string;
  productId: string;
  productName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  alertLevel: 'warning' | 'critical' | 'expired';
}

export interface RewardCalculation {
  pointsEarned: number;
  rewardPercentage: number;
  totalAmount: number;
  message: string;
}

export interface ImportExportData {
  products?: Product[];
  customers?: Customer[];
  suppliers?: Supplier[];
  sales?: Sale[];
  quickbooksData?: QuickBooksData;
  format: 'quickbooks' | 'csv' | 'json';
  timestamp: Date;
}

export interface QuickBooksData {
  items: QuickBooksItem[];
  customers: QuickBooksCustomer[];
  vendors: QuickBooksVendor[];
  transactions: QuickBooksTransaction[];
}

export interface QuickBooksItem {
  Name: string;
  Description?: string;
  UnitPrice: number;
  QtyOnHand: number;
  COGS: number;
  ItemType: string;
  Category?: string;
  Barcode?: string;
  IsActive: boolean;
}

export interface QuickBooksCustomer {
  Name: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  CustomerType?: string;
  Balance?: number;
}

export interface QuickBooksVendor {
  Name: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  Balance?: number;
  PaymentTerms?: string;
}

export interface QuickBooksTransaction {
  TxnDate: string;
  RefNumber: string;
  CustomerRef?: string;
  TotalAmount: number;
  PaymentMethod: string;
  LineItems: QuickBooksLineItem[];
}

export interface QuickBooksLineItem {
  ItemRef: string;
  Qty: number;
  Rate: number;
  Amount: number;
}

export interface CustomerMessage {
  id: string;
  customerId: string;
  saleId: string;
  type: 'sms' | 'email';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  createdAt: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'receipt' | 'promotion' | 'loyalty' | 'reminder';
  subject?: string;
  message: string;
  variables: string[];
  isActive: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  planType: 'basic' | 'pro' | 'advance';
  monthlyPrice: number;
  maxSystems: number;
  maxPhones: number;
  trialDays: number;
  features: {
    // Permanent Features (Always Available in All Plans)
    pos: boolean;
    printerConfiguration: boolean;
    cashierCounters: boolean;
    returnItems: boolean;
    inventory: boolean;
    customers: boolean;
    basicReporting: boolean;
    phoneGreetings: boolean;
    audioAlerts: boolean;
    
    // Accounting Features (Basic: 3 months then limited, Pro/Advanced: Always available)
    accounting: boolean;
    expenseTracking: boolean;
    profitLossReports: boolean;
    cashFlowReports: boolean;
    vatTaxReports: boolean;
    reconciliation: boolean;
    auditTrail: boolean;
    accountingExport: boolean;
    
    // Advanced Features (Pro: Some, Advanced: All)
    rewardRedemption: boolean;
    quickbooksImport: boolean;
    tabletSupport: boolean;
    multiStore: boolean;
    advancedReporting: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customization: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardRedemption {
  id: string;
  customerId: string;
  customerName: string;
  rewardAmount: number; // Direct reward amount in currency
  rewardType: 'cash_discount' | 'free_items' | 'percentage_off';
  freeItems?: RewardItem[]; // Items given for free
  requestedBy: string; // Staff member who initiated
  approvedBy?: string; // Manager/Inventory Officer approval
  status: 'pending' | 'approved' | 'applied' | 'completed' | 'rejected';
  redemptionSlip: string; // Generated slip number
  appliedToSale?: string; // Sale ID where reward was applied
  stockDeducted: boolean; // Whether stock was deducted
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface RewardItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId?: string;
  storeName?: string;
  baseSalary: number;
  allowances: SalaryAllowance[];
  deductions: SalaryDeduction[];
  bonuses: SalaryBonus[];
  overtimeHours: number;
  overtimeRate: number;
  grossSalary: number;
  netSalary: number;
  payPeriod: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
  payDate: Date;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approvedBy?: string;
  paidBy?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'mobile_money';
  paymentReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryAllowance {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
  isRecurring: boolean;
  description?: string;
}

export interface SalaryDeduction {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
  isRecurring: boolean;
  isMandatory: boolean;
  description?: string;
}

export interface SalaryBonus {
  id: string;
  name: string;
  amount: number;
  type: 'performance' | 'holiday' | 'commission' | 'one_time';
  description?: string;
  approvedBy: string;
}

export interface ExpenseRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  storeId?: string;
  storeName?: string;
  description: string;
  amount: number;
  expenseDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'mobile_money';
  paymentReference?: string;
  vendorId?: string;
  vendorName?: string;
  receiptNumber?: string;
  receiptImage?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDueDate?: Date;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approvedBy?: string;
  paidBy?: string;
  tags: string[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  subcategories: string[];
  budgetLimit?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  description: string;
  baseSalary: number;
  allowances: SalaryAllowance[];
  deductions: SalaryDeduction[];
  payPeriod: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
  isActive: boolean;
  createdAt: Date;
}

export interface ExpenseBudget {
  id: string;
  categoryId: string;
  categoryName: string;
  storeId?: string;
  storeName?: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  alertThreshold: number; // Percentage (e.g., 80 for 80%)
  isActive: boolean;
  createdAt: Date;
}

export interface PayrollSummary {
  storeId?: string;
  storeName?: string;
  totalEmployees: number;
  totalBaseSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalBonuses: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  period: string;
}

export interface ExpenseSummary {
  storeId?: string;
  storeName?: string;
  totalExpenses: number;
  expensesByCategory: { categoryName: string; amount: number; percentage: number }[];
  budgetUtilization: number;
  period: string;
}

export interface FinancialReport {
  id: string;
  type: 'payroll' | 'expenses' | 'combined' | 'profit_loss' | 'cash_flow';
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  storeId?: string;
  storeName?: string;
  data: any;
  generatedBy: string;
  generatedAt: Date;
  format: 'pdf' | 'excel' | 'csv';
}

export interface SalaryExpenseSettings {
  id: string;
  companyId: string;
  
  // Salary Settings
  defaultPayPeriod: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
  overtimeEnabled: boolean;
  overtimeMultiplier: number; // e.g., 1.5 for time and a half
  bonusApprovalRequired: boolean;
  salaryApprovalThreshold: number; // Amount requiring approval
  
  // Expense Settings
  expenseApprovalRequired: boolean;
  expenseApprovalThreshold: number;
  receiptRequired: boolean;
  receiptRequiredThreshold: number;
  
  // Customization Settings
  allowCustomCategories: boolean;
  allowCustomAllowances: boolean;
  allowCustomDeductions: boolean;
  maxExpenseCategories: number;
  maxSalaryTemplates: number;
  
  // Multi-Store Settings
  enableStoreWiseTracking: boolean;
  requireStoreAssignment: boolean;
  allowCrossStoreTransfers: boolean;
  
  // Reporting Settings
  autoGeneratePayroll: boolean;
  payrollReportDay: number; // Day of month
  expenseReportFrequency: 'weekly' | 'monthly' | 'quarterly';
  
  // Notification Settings
  notifyOnLargeSalary: boolean;
  largeSalaryThreshold: number;
  notifyOnLargeExpense: boolean;
  largeExpenseThreshold: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardRequest {
  id: string;
  customerId: string;
  customerName: string;
  requestedBy: string;
  rewardType: 'cash_discount' | 'free_items' | 'percentage_off';
  rewardAmount?: number;
  freeItems?: RewardItem[];
  percentageOff?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalNotes?: string;
  createdAt: Date;
  approvedAt?: Date;
}

export interface SaleWithRewards extends Sale {
  rewardApplied?: {
    rewardId: string;
    rewardType: 'cash_discount' | 'free_items' | 'percentage_off';
    rewardAmount: number;
    freeItems: RewardItem[];
    paidItems: SaleItem[];
  };
}
export interface QuickBooksImport {
  id: string;
  fileName: string;
  importType: 'full_database' | 'customers_only' | 'products_only' | 'transactions_only';
  recordsImported: {
    customers: number;
    products: number;
    transactions: number;
    rewardBalances: number;
  };
  status: 'processing' | 'completed' | 'failed';
  importedBy: string;
  importDate: Date;
  errors?: string[];
  warnings?: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planType: 'basic' | 'pro' | 'advance';
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  trialDaysUsed: number;
  maxSystems: number;
  maxPhones: number;
  features: any;
  amountPaid: number;
  paymentReference: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Complaint {
  id: string;
  userId: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  complaintType: 'technical' | 'billing' | 'feature_request' | 'general';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethod: 'paystack';
  paystackReference: string;
  paystackTransactionId?: string;
  status: 'pending' | 'success' | 'failed';
  paymentDate: Date;
  createdAt: Date;
}

export interface RolePermissions {
  role: string;
  permissions: {
    dashboard: boolean;
    pos: boolean;
    customers: boolean;
    inventory: boolean;
    purchases: boolean;
    employees: boolean;
    financial: boolean;
    store_transfer: boolean;
    settings: boolean;
    help: boolean;
    apply_discount: boolean;
    void_sale: boolean;
    refund: boolean;
    hold_receipt: boolean;
    price_override: boolean;
    view_reports: boolean;
    export_data: boolean;
    manage_users: boolean;
    system_settings: boolean;
  };
}

export interface VATReport {
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalSales: number;
  taxableSales: number;
  nonTaxableSales: number;
  totalVAT: number;
  salesByTaxRate: Array<{
    taxRate: number;
    salesAmount: number;
    vatAmount: number;
    transactionCount: number;
  }>;
  dailyBreakdown?: Array<{
    date: Date;
    totalSales: number;
    vatCollected: number;
  }>;
}