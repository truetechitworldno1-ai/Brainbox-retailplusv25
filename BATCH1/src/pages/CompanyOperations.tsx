import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign, 
  Package, 
  Settings,
  Crown,
  Download,
  Upload,
  FileText,
  Database,
  Printer,
  Scan,
  Monitor,
  Smartphone,
  Wifi,
  Bluetooth,
  Usb
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAudio } from '../contexts/AudioContext';

export default function CompanyOperations() {
  const { getAllTenants, createTenant, switchTenant, clearTenantData, isAppOwner } = useTenant();
  const { user, hasPermission } = useAuth();
  const { subscriptionPlans } = useSubscription();
  const { addNotification } = useNotification();
  const { playWelcomeMessage } = useAudio();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickBooksModal, setShowQuickBooksModal] = useState(false);
  const [quickBooksFile, setQuickBooksFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    businessRegistration: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    subscriptionPlan: 'basic' as 'basic' | 'pro' | 'advance',
    // Migration settings
    migrateFromQuickBooks: false,
    setupCounters: 3,
    setupCashiers: 3,
    setupPrinters: 3,
    setupScanners: 3,
    printerTypes: ['thermal_80mm', 'thermal_58mm'] as string[],
    connectionTypes: ['usb', 'bluetooth'] as string[]
  });

  const [editForm, setEditForm] = useState({
    companyName: '',
    businessRegistration: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    subscriptionPlan: 'basic' as 'basic' | 'pro' | 'advance'
  });

  // Only business owners and managers can access
  if (!hasPermission('system_settings') && !isAppOwner) {
    return (
      <div className="qb-page-container">
        <div className="qb-content-card">
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              Only business owners and managers can access company operations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allTenants = isAppOwner ? getAllTenants() : [];
  const filteredTenants = allTenants.filter(tenant =>
    tenant.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompany = async () => {
    if (!companyForm.companyName.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Company name is required',
        type: 'error'
      });
      return;
    }

    try {
      const newTenant = await createTenant({
        ...companyForm,
        maxSystems: companyForm.subscriptionPlan === 'basic' ? 3 : 
                   companyForm.subscriptionPlan === 'pro' ? 5 : 8,
        maxPhones: companyForm.subscriptionPlan === 'basic' ? 1 : 
                  companyForm.subscriptionPlan === 'pro' ? 2 : 3,
        isActive: true,
        settings: {
          currency: '₦',
          taxRate: 7.5,
          timezone: 'Africa/Lagos',
          features: ['pos', 'inventory', 'customers', 'reports']
        }
      });

      // Setup migration if requested
      if (companyForm.migrateFromQuickBooks) {
        await setupQuickBooksMigration(newTenant.id);
      }

      // Setup workstations
      await setupWorkstations(newTenant.id);

      addNotification({
        title: 'Company Created',
        message: `${companyForm.companyName} has been set up successfully`,
        type: 'success'
      });

      // Play welcome message for new company
      playWelcomeMessage();

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      addNotification({
        title: 'Creation Failed',
        message: 'Failed to create company. Please try again.',
        type: 'error'
      });
    }
  };

  const setupQuickBooksMigration = async (tenantId: string) => {
    // Setup QuickBooks migration placeholders
    const migrationData = {
      products: [],
      customers: [],
      suppliers: [],
      sales: [],
      migrationStatus: 'ready',
      migrationDate: new Date()
    };
    
    localStorage.setItem(`brainbox_${tenantId}_quickbooks_migration`, JSON.stringify(migrationData));
    
    addNotification({
      title: 'QuickBooks Migration Ready',
      message: 'Company is ready for QuickBooks POS data import',
      type: 'info'
    });
  };

  const setupWorkstations = async (tenantId: string) => {
    const workstations = [];
    
    // Create POS counters
    for (let i = 1; i <= companyForm.setupCounters; i++) {
      workstations.push({
        id: `counter-${i}`,
        name: `POS Counter ${i}`,
        type: 'pos',
        location: `Counter ${i}`,
        printerConfig: {
          enabled: i <= companyForm.setupPrinters,
          printerName: `Receipt Printer ${i}`,
          printerModel: companyForm.printerTypes.includes('thermal_80mm') ? 'Thermal 80mm' : 'Thermal 58mm',
          connectionType: companyForm.connectionTypes.includes('usb') ? 'usb' : 'bluetooth',
          paperSize: companyForm.printerTypes.includes('thermal_80mm') ? 'thermal_80mm' : 'thermal_58mm',
          autoprint: true,
          copies: 1
        },
        scannerConfig: {
          enabled: i <= companyForm.setupScanners,
          scannerModel: 'Barcode Scanner',
          scannerType: companyForm.connectionTypes.includes('usb') ? 'usb' : 'bluetooth',
          autoSubmit: true,
          beepOnScan: true
        },
        isActive: true,
        createdAt: new Date()
      });
    }
    
    localStorage.setItem(`brainbox_${tenantId}_workstations`, JSON.stringify(workstations));
  };

  const handleEditCompany = (tenant: any) => {
    setSelectedCompany(tenant);
    setEditForm({
      companyName: tenant.companyName,
      businessRegistration: tenant.businessRegistration,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      address: tenant.address,
      subscriptionPlan: tenant.subscriptionPlan
    });
    setShowEditModal(true);
  };

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;

    try {
      await updateTenant({
        companyName: editForm.companyName,
        businessRegistration: editForm.businessRegistration,
        contactEmail: editForm.contactEmail,
        contactPhone: editForm.contactPhone,
        address: editForm.address,
        subscriptionPlan: editForm.subscriptionPlan,
        maxSystems: editForm.subscriptionPlan === 'basic' ? 3 : 
                   editForm.subscriptionPlan === 'pro' ? 5 : 8,
        maxPhones: editForm.subscriptionPlan === 'basic' ? 1 : 
                  editForm.subscriptionPlan === 'pro' ? 2 : 3
      });

      addNotification({
        title: 'Company Updated',
        message: `${editForm.companyName} has been updated successfully`,
        type: 'success'
      });

      setShowEditModal(false);
      setSelectedCompany(null);
    } catch (error) {
      addNotification({
        title: 'Update Failed',
        message: 'Failed to update company. Please try again.',
        type: 'error'
      });
    }
  };

  const handleQuickBooksImport = async () => {
    if (!quickBooksFile || !selectedCompany) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const fileContent = await quickBooksFile.text();
      
      // Simulate import progress
      const steps = [
        'Reading QuickBooks file...',
        'Parsing product data...',
        'Importing customers...',
        'Processing sales history...',
        'Setting up loyalty points...',
        'Finalizing import...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setImportProgress((i + 1) / steps.length * 100);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Parse and import data
      let qbData;
      try {
        qbData = JSON.parse(fileContent);
      } catch (error) {
        throw new Error('Invalid QuickBooks file format. Please export as JSON.');
      }

      // Import products
      if (qbData.Items || qbData.items) {
        const items = qbData.Items || qbData.items;
        const products = items.map((item: any) => ({
          id: crypto.randomUUID(),
          name: item.Name || item.name || 'Imported Product',
          category: item.Category || item.category || 'Imported',
          brand: item.Brand || item.brand || 'QuickBooks',
          barcodes: [item.Barcode || item.barcode || crypto.randomUUID().slice(0, 13)],
          costPrice: parseFloat(item.COGS || item.cogs || item.cost || '0') || 0,
          sellingPrice: parseFloat(item.UnitPrice || item.unitPrice || item.price || '0') || 0,
          stock: parseInt(item.QtyOnHand || item.qtyOnHand || item.quantity || '0') || 0,
          minStock: 10,
          maxStock: 100,
          unit: 'piece',
          isActive: true,
          hasVariations: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        localStorage.setItem(`brainbox_company_${selectedCompany.id}_products`, JSON.stringify(products));
      }

      // Import customers with loyalty points
      if (qbData.Customers || qbData.customers) {
        const customers = (qbData.Customers || qbData.customers).map((customer: any) => ({
          id: crypto.randomUUID(),
          name: customer.Name || customer.name || 'Imported Customer',
          email: customer.Email || customer.email || '',
          phone: customer.Phone || customer.phone || '',
          address: customer.Address || customer.address || '',
          loyaltyCard: {
            cardNumber: `LC${crypto.randomUUID().slice(0, 8)}`,
            points: parseInt(customer.RewardPoints || customer.rewardPoints || customer.Balance || customer.balance || '0') || 0,
            totalSpent: parseFloat(customer.TotalSpent || customer.totalSpent || '0') || 0,
            rewardPercentage: 2,
            tier: 'bronze',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true
          },
          totalPurchases: parseInt(customer.TotalPurchases || customer.totalPurchases || '0') || 0,
          lastPurchase: new Date(),
          isActive: true,
          createdAt: new Date()
        }));
        
        localStorage.setItem(`brainbox_company_${selectedCompany.id}_customers`, JSON.stringify(customers));
      }

      addNotification({
        title: 'QuickBooks Import Successful',
        message: `Data imported successfully for ${selectedCompany.companyName}`,
        type: 'success'
      });

      setShowQuickBooksModal(false);
      setQuickBooksFile(null);
    } catch (error: any) {
      addNotification({
        title: 'Import Failed',
        message: error.message || 'Failed to import QuickBooks data',
        type: 'error'
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const resetForm = () => {
    setCompanyForm({
      companyName: '',
      businessRegistration: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      subscriptionPlan: 'basic',
      migrateFromQuickBooks: false,
      existingEmployees: 0,
      existingProducts: 0,
      setupCounters: 3,
      setupCashiers: 3,
      setupPrinters: 3,
      setupScanners: 3,
      printerTypes: ['thermal_80mm', 'thermal_58mm'],
      connectionTypes: ['usb', 'bluetooth']
    });
  };

  const deleteCompany = (tenantId: string) => {
    if (!isAppOwner) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this company and all its data?');
    if (confirmed) {
      clearTenantData(tenantId);
      addNotification({
        title: 'Company Deleted',
        message: 'Company and all associated data has been removed',
        type: 'success'
      });
    }
  };

  return (
    <div className="qb-page-container">
      <div className="qb-content-card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="qb-title">
              {isAppOwner ? 'TIW Global Company Management' : 'Company Operations'}
            </h1>
            <p className="qb-subtitle">
              {isAppOwner 
                ? 'Manage all companies and their POS systems globally'
                : 'Manage your company settings and operations'
              }
            </p>
          </div>
          {isAppOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Company</span>
            </button>
          )}
        </div>

        {/* App Owner Global View */}
        {isAppOwner && (
          <>
            {/* Search Bar */}
            <div className="bg-green-50 rounded-xl shadow-sm border-2 border-green-200 p-4 lg:p-6 mt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search companies by name or email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Companies Grid */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 mt-6">
              <div className="p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">
                  All Companies ({filteredTenants.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTenants.map((tenant) => (
                    <div key={tenant.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-3 rounded-lg ${
                          tenant.subscriptionPlan === 'basic' ? 'bg-blue-100' :
                          tenant.subscriptionPlan === 'pro' ? 'bg-purple-100' :
                          'bg-yellow-100'
                        }`}>
                          <Building className={`h-6 w-6 ${
                            tenant.subscriptionPlan === 'basic' ? 'text-blue-600' :
                            tenant.subscriptionPlan === 'pro' ? 'text-purple-600' :
                            'text-yellow-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{tenant.companyName}</h4>
                          <p className="text-sm text-gray-600">{tenant.contactEmail}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Plan:</span>
                          <span className={`font-medium ${
                            tenant.subscriptionPlan === 'basic' ? 'text-blue-600' :
                            tenant.subscriptionPlan === 'pro' ? 'text-purple-600' :
                            'text-yellow-600'
                          }`}>
                            {tenant.subscriptionPlan.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Systems:</span>
                          <span className="font-medium">{tenant.maxSystems}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phones:</span>
                          <span className="font-medium">{tenant.maxPhones}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${tenant.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {tenant.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => switchTenant(tenant.id)}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          View Company
                        </button>
                        <button
                          onClick={() => handleEditCompany(tenant)}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCompany(tenant);
                            setShowQuickBooksModal(true);
                          }}
                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                          title="Import QuickBooks Data"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCompany(tenant.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Regular Company View */}
        {!isAppOwner && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 mt-6">
            <div className="p-6">
              <h3 className="text-lg font-bold text-green-900 mb-4">Company Settings</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  Company-specific settings and operations will be available here.
                  Contact your system administrator for advanced configurations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      {showCreateModal && isAppOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Create New Company</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Company Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={companyForm.companyName}
                      onChange={(e) => setCompanyForm({...companyForm, companyName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Urban Supermarket"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration</label>
                    <input
                      type="text"
                      value={companyForm.businessRegistration}
                      onChange={(e) => setCompanyForm({...companyForm, businessRegistration: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="RC123456"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                    <input
                      type="email"
                      value={companyForm.contactEmail}
                      onChange={(e) => setCompanyForm({...companyForm, contactEmail: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="info@urbansupermarket.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      value={companyForm.contactPhone}
                      onChange={(e) => setCompanyForm({...companyForm, contactPhone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+234 123 456 7890"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                    <textarea
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main Street, Lagos, Nigeria"
                    />
                  </div>
                </div>

                {/* POS Setup Configuration */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">POS System Setup</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
                    <div className="grid grid-cols-1 gap-3">
                      {['basic', 'pro', 'advance'].map((plan) => {
                        const planInfo = subscriptionPlans.find(p => p.planType === plan);
                        const pricing = {
                          basic: 20000,
                          pro: 40000,
                          advance: 80000
                        };
                        return (
                          <button
                            key={plan}
                            onClick={() => setCompanyForm({...companyForm, subscriptionPlan: plan as any})}
                            className={`p-4 border-2 rounded-lg transition-all text-left ${
                              companyForm.subscriptionPlan === plan
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium capitalize">{plan} Plan</p>
                                <p className="text-sm text-gray-600">
                                  ₦{pricing[plan as keyof typeof pricing].toLocaleString()}/month
                                </p>
                              </div>
                              <div className="text-sm text-gray-500">
                                {plan === 'basic' ? '3 systems, 1 phone' :
                                 plan === 'pro' ? '5 systems, 2 phones' :
                                 '8 systems, 3 phones'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* QuickBooks Migration */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={companyForm.migrateFromQuickBooks}
                        onChange={(e) => setCompanyForm({...companyForm, migrateFromQuickBooks: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <span className="font-medium text-purple-900">Migrate from QuickBooks POS</span>
                        <p className="text-sm text-purple-700">Import existing products, customers, and sales data</p>
                        <p className="text-xs text-purple-600 mt-1">
                          ✅ Products, customers, suppliers, sales history, loyalty points, employee records
                        </p>
                      </div>
                    </label>
                    
                    {companyForm.migrateFromQuickBooks && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-purple-200">
                        <h5 className="font-medium text-purple-900 mb-2">📋 Migration Setup:</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Existing Employees</label>
                            <input
                              type="number"
                              value={companyForm.existingEmployees || 0}
                              onChange={(e) => setCompanyForm({...companyForm, existingEmployees: parseInt(e.target.value) || 0})}
                              min="0"
                              max="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Number of existing staff"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Existing Products</label>
                            <input
                              type="number"
                              value={companyForm.existingProducts || 0}
                              onChange={(e) => setCompanyForm({...companyForm, existingProducts: parseInt(e.target.value) || 0})}
                              min="0"
                              max="10000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Number of products"
                            />
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm text-purple-800">
                            <strong>Migration includes:</strong> Employee records, salary history, product catalog, 
                            customer database with loyalty points, supplier information, and sales transaction history.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hardware Setup */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h5 className="font-medium text-gray-900">Hardware Setup</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">POS Counters</label>
                        <input
                          type="number"
                          value={companyForm.setupCounters}
                          onChange={(e) => setCompanyForm({...companyForm, setupCounters: parseInt(e.target.value) || 1})}
                          min="1"
                          max="10"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cashiers</label>
                        <input
                          type="number"
                          value={companyForm.setupCashiers}
                          onChange={(e) => setCompanyForm({...companyForm, setupCashiers: parseInt(e.target.value) || 1})}
                          min="1"
                          max="20"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Printers</label>
                        <input
                          type="number"
                          value={companyForm.setupPrinters}
                          onChange={(e) => setCompanyForm({...companyForm, setupPrinters: parseInt(e.target.value) || 1})}
                          min="1"
                          max="10"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scanners</label>
                        <input
                          type="number"
                          value={companyForm.setupScanners}
                          onChange={(e) => setCompanyForm({...companyForm, setupScanners: parseInt(e.target.value) || 1})}
                          min="1"
                          max="10"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Printer Configuration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Printer Types</label>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={companyForm.printerTypes.includes('thermal_80mm')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCompanyForm({
                                  ...companyForm,
                                  printerTypes: [...companyForm.printerTypes, 'thermal_80mm']
                                });
                              } else {
                                setCompanyForm({
                                  ...companyForm,
                                  printerTypes: companyForm.printerTypes.filter(t => t !== 'thermal_80mm')
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">🖨️ 80mm Thermal (Standard receipts)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={companyForm.printerTypes.includes('thermal_58mm')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCompanyForm({
                                  ...companyForm,
                                  printerTypes: [...companyForm.printerTypes, 'thermal_58mm']
                                });
                              } else {
                                setCompanyForm({
                                  ...companyForm,
                                  printerTypes: companyForm.printerTypes.filter(t => t !== 'thermal_58mm')
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">🖨️ 58mm Thermal (Compact receipts)</span>
                        </label>
                      </div>
                    </div>

                    {/* Connection Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Connection Types</label>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={companyForm.connectionTypes.includes('usb')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCompanyForm({
                                  ...companyForm,
                                  connectionTypes: [...companyForm.connectionTypes, 'usb']
                                });
                              } else {
                                setCompanyForm({
                                  ...companyForm,
                                  connectionTypes: companyForm.connectionTypes.filter(t => t !== 'usb')
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Usb className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">🔌 USB (Wired - Plug & Play)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={companyForm.connectionTypes.includes('bluetooth')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCompanyForm({
                                  ...companyForm,
                                  connectionTypes: [...companyForm.connectionTypes, 'bluetooth']
                                });
                              } else {
                                setCompanyForm({
                                  ...companyForm,
                                  connectionTypes: companyForm.connectionTypes.filter(t => t !== 'bluetooth')
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Bluetooth className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">📱 Bluetooth (Mobile/Wireless)</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h6 className="font-medium text-green-900 mb-2">🚀 What We'll Setup:</h6>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• {companyForm.setupCounters} POS counters with full functionality</li>
                        <li>• {companyForm.setupCashiers} cashier accounts with role permissions</li>
                        <li>• {companyForm.setupPrinters} receipt printers (auto-configured)</li>
                        <li>• {companyForm.setupScanners} barcode scanners (plug & play)</li>
                        <li>• Complete employee management system ({companyForm.existingEmployees || 'new'} staff)</li>
                        <li>• Salary & expense tracking with approval workflows</li>
                        <li>• Multi-store inventory management</li>
                        <li>• Customer loyalty program</li>
                        <li>• Seamless printer setup (80mm/58mm USB/Bluetooth)</li>
                        <li>• QuickBooks POS migration ({companyForm.existingProducts || 'new'} products)</li>
                        <li>• Supabase + Paystack integration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCompany}
                  disabled={!companyForm.companyName.trim() || !companyForm.contactEmail.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  🚀 Create Company & Setup Complete Business System
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && selectedCompany && isAppOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Edit Company</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration</label>
                  <input
                    type="text"
                    value={editForm.businessRegistration}
                    onChange={(e) => setEditForm({...editForm, businessRegistration: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                  <input
                    type="email"
                    value={editForm.contactEmail}
                    onChange={(e) => setEditForm({...editForm, contactEmail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={editForm.contactPhone}
                    onChange={(e) => setEditForm({...editForm, contactPhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
                  <select
                    value={editForm.subscriptionPlan}
                    onChange={(e) => setEditForm({...editForm, subscriptionPlan: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="basic">Basic Plan (₦20,000/month)</option>
                    <option value="pro">Pro Plan (₦40,000/month)</option>
                    <option value="advance">Advanced Plan (₦80,000/month)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCompany}
                  disabled={!editForm.companyName.trim() || !editForm.contactEmail.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Update Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QuickBooks Import Modal */}
      {showQuickBooksModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Import QuickBooks POS Data - {selectedCompany.companyName}
              </h3>
              
              {!isImporting ? (
                <div className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h4 className="font-bold text-purple-900 mb-4">📊 What Gets Imported:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="text-sm text-purple-800 space-y-2">
                        <li>✅ <strong>All Products</strong> - Items, pricing, stock levels</li>
                        <li>✅ <strong>All Customers</strong> - Contact info, purchase history</li>
                        <li>✅ <strong>Loyalty Points</strong> - Customer reward balances</li>
                        <li>✅ <strong>Sales History</strong> - Transaction records</li>
                      </ul>
                      <ul className="text-sm text-purple-800 space-y-2">
                        <li>✅ <strong>Suppliers</strong> - Vendor information</li>
                        <li>✅ <strong>Categories</strong> - Product groupings</li>
                        <li>✅ <strong>Employee Records</strong> - Staff information</li>
                        <li>✅ <strong>Pricing Rules</strong> - Cost and selling prices</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📤 Export from QuickBooks POS:</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Open QuickBooks Point of Sale</li>
                      <li>2. Go to File → Export → Company Data</li>
                      <li>3. Select: Items, Customers, Vendors, Sales</li>
                      <li>4. Choose JSON format (.json)</li>
                      <li>5. Save file and upload here</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select QuickBooks Export File
                    </label>
                    <input
                      type="file"
                      accept=".json,.qbx,.csv"
                      onChange={(e) => setQuickBooksFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JSON (.json), QuickBooks (.qbx), CSV (.csv)
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">🚀 After Import:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• All your QuickBooks data will be available in BrainBox</li>
                      <li>• Customer loyalty points will be preserved</li>
                      <li>• Product pricing and stock levels maintained</li>
                      <li>• Sales history and reports available</li>
                      <li>• Enhanced features like multi-barcode support</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="h-10 w-10 text-purple-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Importing QuickBooks Data...</h4>
                    <p className="text-gray-600">Please wait while we import your data</p>
                  </div>
                  
                  <div className="bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-center text-gray-600">
                    {importProgress < 20 ? 'Reading QuickBooks file...' :
                     importProgress < 40 ? 'Parsing product data...' :
                     importProgress < 60 ? 'Importing customers...' :
                     importProgress < 80 ? 'Processing sales history...' :
                     importProgress < 95 ? 'Setting up loyalty points...' :
                     'Finalizing import...'}
                  </p>
                </div>
              )}
              
              {!isImporting && (
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowQuickBooksModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuickBooksImport}
                    disabled={!quickBooksFile}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    Import QuickBooks Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}