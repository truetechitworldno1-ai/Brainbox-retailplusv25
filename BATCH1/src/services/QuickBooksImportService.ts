import { Product, Customer, Supplier, Sale, QuickBooksData, QuickBooksItem, QuickBooksCustomer, QuickBooksVendor, QuickBooksTransaction } from '../types';

interface QuickBooksImport {
  id: string;
  fileName: string;
  importType: 'full_database' | 'customers_only' | 'products_only' | 'transactions_only';
  recordsImported: {
    customers: number;
    products: number;
    transactions: number;
    localStorage.setItem(`brainbox_company_${tenantId}_workstations`, JSON.stringify(workstations));
    
    // Setup default employees for the company
    const defaultEmployees = [];
    for (let i = 1; i <= companyForm.setupCashiers; i++) {
      defaultEmployees.push({
        id: `emp-${i}`,
        employeeId: `EMP${i.toString().padStart(3, '0')}`,
        name: i === 1 ? 'Store Manager' : `Cashier ${i - 1}`,
        position: i === 1 ? 'Manager' : 'Cashier',
        department: 'Operations',
        employmentType: 'full_time',
        status: 'active',
        salary: i === 1 ? 150000 : 80000,
        payPeriod: 'monthly',
        hireDate: new Date(),
        isActive: true,
        permissions: i === 1 ? ['all'] : ['pos', 'customers'],
        createdAt: new Date()
      });
    }
    
    localStorage.setItem(`brainbox_company_${tenantId}_employees`, JSON.stringify(defaultEmployees));
  };
  status: 'processing' | 'completed' | 'failed';
  importedBy: string;
  importDate: Date;
  errors?: string[];
  warnings?: string[];
}

export class QuickBooksImportService {
  // Import QuickBooks POS data directly into BRAINBOX
  static async importQuickBooksData(fileContent: string): Promise<{
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    sales: Sale[];
  }> {
    try {
      let qbData: any;
      
      // Try to parse as JSON first
      try {
        qbData = JSON.parse(fileContent);
      } catch (jsonError) {
        // If JSON parsing fails, try CSV parsing
        if (fileContent.includes(',') && fileContent.includes('\n')) {
          qbData = this.parseCSVFormat(fileContent);
        } else {
          throw new Error('Invalid file format. Please provide JSON, CSV, or QBX format.');
        }
      }
      
      const products = this.convertQuickBooksItems(qbData.items || []);
      const customers = this.convertQuickBooksCustomers(qbData.customers || []);
      const suppliers = this.convertQuickBooksVendors(qbData.vendors || []);
      const sales = this.convertQuickBooksTransactions(qbData.transactions || []);

      return { products, customers, suppliers, sales };
    } catch (error) {
      throw new Error(`QuickBooks import failed: ${error instanceof Error ? error.message : 'Invalid file format'}`);
    }
  }

  // Parse CSV format QuickBooks export
  private static parseCSVFormat(csvContent: string): any {
    const lines = csvContent.split('\n');
    const result: any = { items: [], customers: [], vendors: [], transactions: [] };
    
    let currentSection = '';
    let headers: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Detect section headers
      if (trimmedLine.toUpperCase().includes('ITEM') || trimmedLine.toUpperCase().includes('PRODUCT')) {
        currentSection = 'items';
        continue;
      } else if (trimmedLine.toUpperCase().includes('CUSTOMER')) {
        currentSection = 'customers';
        continue;
      } else if (trimmedLine.toUpperCase().includes('VENDOR') || trimmedLine.toUpperCase().includes('SUPPLIER')) {
        currentSection = 'vendors';
        continue;
      } else if (trimmedLine.toUpperCase().includes('TRANSACTION') || trimmedLine.toUpperCase().includes('SALE')) {
        currentSection = 'transactions';
        continue;
      }
      
      // Parse CSV data
      const values = this.parseCSVLine(trimmedLine);
      
      if (values.length > 1) {
        if (headers.length === 0) {
          headers = values;
        } else {
          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = values[index] || '';
          });
          
          if (currentSection && result[currentSection]) {
            result[currentSection].push(record);
          }
        }
      }
    }
    
    return result;
  }

  // Parse CSV line handling quoted values
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Enhanced import with full customer database and reward balances
  static async importFullQuickBooksDatabase(fileContent: string): Promise<QuickBooksImport> {
    try {
      let qbData: any;
      
      try {
        qbData = JSON.parse(fileContent);
      } catch (jsonError) {
        if (fileContent.includes(',') && fileContent.includes('\n')) {
          qbData = this.parseCSVFormat(fileContent);
        } else {
          throw new Error('Invalid file format');
        }
      }
      
      const importRecord: QuickBooksImport = {
        id: crypto.randomUUID(),
        fileName: 'quickbooks_export.qbx',
        importType: 'full_database',
        recordsImported: {
          customers: 0,
          products: 0,
          transactions: 0,
          suppliers: 0
        },
        status: 'processing',
        importedBy: 'system',
        importDate: new Date(),
        errors: [],
        warnings: []
      };

      // Import products with full details
      if (qbData.items || qbData.Items) {
        const products = this.convertQuickBooksItems(qbData.items || qbData.Items);
        localStorage.setItem('imported_products', JSON.stringify(products));
        importRecord.recordsImported.products = products.length;
      }

      // Import customers with reward balances
      if (qbData.customers || qbData.Customers) {
        const customers = this.convertQuickBooksCustomersWithRewards(qbData.customers || qbData.Customers);
        localStorage.setItem('imported_customers', JSON.stringify(customers));
        importRecord.recordsImported.customers = customers.length;
      }

      // Import suppliers
      if (qbData.vendors || qbData.Vendors) {
        const suppliers = this.convertQuickBooksVendors(qbData.vendors || qbData.Vendors);
        localStorage.setItem('imported_suppliers', JSON.stringify(suppliers));
        importRecord.recordsImported.suppliers = suppliers.length;
      }

      // Import transaction history
      if (qbData.transactions || qbData.Transactions) {
        const transactions = this.convertQuickBooksTransactions(qbData.transactions || qbData.Transactions);
        localStorage.setItem('imported_transactions', JSON.stringify(transactions));
        importRecord.recordsImported.transactions = transactions.length;
      }

      importRecord.status = 'completed';
      this.saveImportRecord(importRecord);

      return importRecord;
    } catch (error) {
      throw new Error(`QuickBooks import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert QuickBooks items to BRAINBOX products
  private static convertQuickBooksItems(qbItems: QuickBooksItem[]): Product[] {
    return qbItems.map(item => ({
      id: crypto.randomUUID(),
      name: item.Name || item.name || 'Imported Product',
      description: item.Description || item.description || '',
      category: item.Category || item.category || 'Imported',
      brand: 'QuickBooks Import',
      barcodes: item.Barcode || item.barcode ? [item.Barcode || item.barcode] : [crypto.randomUUID().slice(0, 13)],
      costPrice: parseFloat(item.COGS || item.cogs || item.cost || '0') || 0,
      sellingPrice: parseFloat(item.UnitPrice || item.unitPrice || item.price || '0') || 0,
      stock: parseInt(item.QtyOnHand || item.qtyOnHand || item.quantity || '0') || 0,
      minStock: Math.max(1, Math.floor((parseInt(item.QtyOnHand || item.quantity || '0') || 0) * 0.2)),
      maxStock: Math.max(parseInt(item.QtyOnHand || item.quantity || '0') || 0, 100),
      unit: 'piece',
      hasVariations: false,
      isActive: (item.IsActive || item.isActive) !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  // Convert QuickBooks customers to BRAINBOX customers
  private static convertQuickBooksCustomers(qbCustomers: QuickBooksCustomer[]): Customer[] {
    return qbCustomers.map(customer => ({
      id: crypto.randomUUID(),
      name: customer.Name || customer.name || 'Imported Customer',
      email: customer.Email || customer.email || '',
      phone: customer.Phone || customer.phone || '',
      address: customer.Address || customer.address || '',
      loyaltyCard: {
        cardNumber: `LC${crypto.randomUUID().slice(0, 8)}`,
        points: Math.floor(parseFloat(customer.Balance || customer.balance || '0') || 0),
        totalSpent: 0,
        rewardPercentage: 2,
        tier: this.determineTier(parseFloat(customer.Balance || customer.balance || '0') || 0),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      totalPurchases: 0,
      lastPurchase: new Date(),
      isActive: true,
      createdAt: new Date()
    }));
  }

  // Convert QuickBooks customers with reward balances
  private static convertQuickBooksCustomersWithRewards(qbCustomers: any[]): Customer[] {
    return qbCustomers.map(customer => ({
      id: crypto.randomUUID(),
      name: customer.Name || customer.name || 'Imported Customer',
      email: customer.Email || customer.email || '',
      phone: customer.Phone || customer.phone || '',
      address: customer.Address || customer.address || '',
      loyaltyCard: {
        cardNumber: customer.LoyaltyCardNumber || customer.loyaltyCardNumber || `LC${crypto.randomUUID().slice(0, 8)}`,
        points: parseInt(customer.RewardPoints || customer.rewardPoints || customer.Balance || customer.balance || '0') || 0,
        totalSpent: parseFloat(customer.TotalSpent || customer.totalSpent || '0') || 0,
        rewardPercentage: parseFloat(customer.RewardPercentage || customer.rewardPercentage || '2') || 2,
        tier: this.determineTier(parseFloat(customer.TotalSpent || customer.totalSpent || '0') || 0),
        expiryDate: customer.RewardExpiryDate ? new Date(customer.RewardExpiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: (customer.IsActive || customer.isActive) !== false
      },
      totalPurchases: parseInt(customer.TotalPurchases || customer.totalPurchases || '0') || 0,
      lastPurchase: customer.LastPurchase ? new Date(customer.LastPurchase) : new Date(),
      isActive: (customer.IsActive || customer.isActive) !== false,
      createdAt: customer.CreatedDate ? new Date(customer.CreatedDate) : new Date()
    }));
  }

  // Convert QuickBooks vendors to BRAINBOX suppliers
  private static convertQuickBooksVendors(qbVendors: QuickBooksVendor[]): Supplier[] {
    return qbVendors.map(vendor => ({
      id: crypto.randomUUID(),
      name: vendor.Name || vendor.name || 'Imported Supplier',
      contact: 'Imported Contact',
      email: vendor.Email || vendor.email || '',
      phone: vendor.Phone || vendor.phone || '',
      address: vendor.Address || vendor.address || '',
      paymentTerms: vendor.PaymentTerms || vendor.paymentTerms || 'Net 30 days',
      totalItemsReceived: 0,
      totalAmountReceived: 0,
      totalAmountPaid: 0,
      balance: parseFloat(vendor.Balance || vendor.balance || '0') || 0,
      isActive: true,
      createdAt: new Date()
    }));
  }

  // Convert QuickBooks transactions to BRAINBOX sales
  private static convertQuickBooksTransactions(qbTransactions: QuickBooksTransaction[]): Sale[] {
    return qbTransactions.map(transaction => ({
      id: crypto.randomUUID(),
      receiptNumber: transaction.RefNumber || transaction.refNumber || `QB${Date.now()}`,
      customerId: transaction.CustomerRef || transaction.customerRef,
      items: (transaction.LineItems || transaction.lineItems || []).map((lineItem: any) => ({
        productId: lineItem.ItemRef || lineItem.itemRef || crypto.randomUUID(),
        productName: lineItem.ItemName || lineItem.itemName || lineItem.ItemRef || 'Imported Item',
        quantity: parseInt(lineItem.Qty || lineItem.qty || lineItem.quantity || '1') || 1,
        unitPrice: parseFloat(lineItem.Rate || lineItem.rate || lineItem.price || '0') || 0,
        total: parseFloat(lineItem.Amount || lineItem.amount || lineItem.total || '0') || 0,
        barcode: 'QB_IMPORT'
      })),
      subtotal: parseFloat(transaction.TotalAmount || transaction.totalAmount || transaction.total || '0') || 0,
      tax: 0, // Would need to calculate from QB data
      discount: 0,
      total: parseFloat(transaction.TotalAmount || transaction.totalAmount || transaction.total || '0') || 0,
      paymentMethod: this.mapPaymentMethod(transaction.PaymentMethod || transaction.paymentMethod || 'cash'),
      paymentDetails: [{
        method: this.mapPaymentMethod(transaction.PaymentMethod || transaction.paymentMethod || 'cash'),
        amount: parseFloat(transaction.TotalAmount || transaction.totalAmount || transaction.total || '0') || 0
      }],
      cashierId: '1', // Default to admin
      timestamp: transaction.TxnDate || transaction.txnDate ? new Date(transaction.TxnDate || transaction.txnDate) : new Date(),
      loyaltyPointsEarned: 0,
      loyaltyPointsUsed: 0,
      isHeld: false,
    }));
  }

  // Save import record
  private static saveImportRecord(importRecord: QuickBooksImport): void {
    const existingImports = JSON.parse(localStorage.getItem('quickbooks_imports') || '[]');
    existingImports.unshift(importRecord);
    
    // Keep only last 50 import records
    if (existingImports.length > 50) {
      existingImports.splice(50);
    }
    
    localStorage.setItem('quickbooks_imports', JSON.stringify(existingImports));
  }

  // Get import history
  static getImportHistory(): QuickBooksImport[] {
    const imports = JSON.parse(localStorage.getItem('quickbooks_imports') || '[]');
    return imports.map((imp: any) => ({
      ...imp,
      importDate: new Date(imp.importDate)
    }));
  }

  private static determineTier(balance: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (balance >= 100000) return 'platinum';
    if (balance >= 50000) return 'gold';
    if (balance >= 20000) return 'silver';
    return 'bronze';
  }

  private static mapPaymentMethod(qbMethod: string): 'cash' | 'pos' | 'transfer' | 'debit' | 'credit' {
    const method = qbMethod.toLowerCase();
    if (method.includes('cash')) return 'cash';
    if (method.includes('card') || method.includes('credit')) return 'credit';
    if (method.includes('debit')) return 'debit';
    if (method.includes('transfer') || method.includes('bank')) return 'transfer';
    return 'pos'; // Default
  }

  // Generate QuickBooks compatible export
  static exportToQuickBooks(products: Product[], customers: Customer[], suppliers: Supplier[], sales: Sale[]): string {
    const qbData: QuickBooksData = {
      items: products.map(product => ({
        Name: product.name,
        Description: product.description,
        UnitPrice: product.sellingPrice,
        QtyOnHand: product.stock,
        COGS: product.costPrice,
        ItemType: "Inventory",
        Category: product.category,
        Barcode: product.barcodes[0],
        IsActive: product.isActive
      })),
      customers: customers.map(customer => ({
        Name: customer.name,
        Email: customer.email,
        Phone: customer.phone,
        Address: customer.address,
        CustomerType: customer.loyaltyCard.tier,
        Balance: customer.loyaltyCard.points
      })),
      vendors: suppliers.map(supplier => ({
        Name: supplier.name,
        Email: supplier.email,
        Phone: supplier.phone,
        Address: supplier.address,
        Balance: supplier.balance,
        PaymentTerms: supplier.paymentTerms
      })),
      transactions: sales.map(sale => ({
        TxnDate: sale.timestamp.toISOString(),
        RefNumber: sale.receiptNumber,
        CustomerRef: sale.customerId,
        TotalAmount: sale.total,
        PaymentMethod: sale.paymentMethod,
        LineItems: sale.items.map(item => ({
          ItemRef: item.productId,
          Qty: item.quantity,
          Rate: item.unitPrice,
          Amount: item.total
        }))
      }))
    };

    return JSON.stringify(qbData, null, 2);
  }
}