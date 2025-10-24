import { Product, Customer, Supplier, Sale, ImportExportData } from '../types';

export class ImportExportService {
  // Import from QuickBooks format
  static async importFromQuickBooks(fileContent: string): Promise<ImportExportData> {
    try {
      const qbData = JSON.parse(fileContent);
      
      const products: Product[] = qbData.Items?.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        name: item.Name,
        description: item.Description || '',
        category: item.Category || 'General',
        brand: '',
        barcodes: [item.Barcode || ''],
        costPrice: item.COGS || 0,
        sellingPrice: item.UnitPrice || 0,
        stock: item.QtyOnHand || 0,
        minStock: 10,
        maxStock: item.QtyOnHand * 2 || 100,
        unit: 'piece',
        supplierId: '1',
        isActive: item.IsActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      })) || [];

      const customers: Customer[] = qbData.Customers?.map((customer: any) => ({
        id: Date.now().toString() + Math.random(),
        name: customer.Name,
        email: customer.Email || '',
        phone: customer.Phone || '',
        address: customer.Address || '',
        loyaltyCard: {
          cardNumber: `LC${Date.now()}`,
          points: customer.Balance || 0,
          totalSpent: 0,
          rewardPercentage: 2,
          tier: 'bronze',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        totalPurchases: 0,
        lastPurchase: new Date(),
        isActive: true,
        createdAt: new Date()
      })) || [];

      return {
        products,
        customers,
        format: 'quickbooks',
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error('Invalid QuickBooks format');
    }
  }

  // Export data to various formats
  static exportToQuickBooks(data: ImportExportData): string {
    const qbData = {
      CompanyInfo: {
        CompanyName: "BRAINBOX_RETAILPLUS",
        ExportDate: new Date().toISOString(),
        Version: "1.0"
      },
      Items: data.products?.map(product => ({
        Name: product.name,
        Description: product.description,
        UnitPrice: product.sellingPrice,
        QtyOnHand: product.stock,
        COGS: product.costPrice,
        ItemType: "Inventory",
        Category: product.category,
        Barcode: product.barcodes[0],
        IsActive: product.isActive
      })) || [],
      Customers: data.customers?.map(customer => ({
        Name: customer.name,
        Email: customer.email,
        Phone: customer.phone,
        Address: customer.address,
        CustomerType: customer.loyaltyCard.tier,
        Balance: customer.loyaltyCard.points
      })) || [],
      Vendors: data.suppliers?.map(supplier => ({
        Name: supplier.name,
        Email: supplier.email,
        Phone: supplier.phone,
        Address: supplier.address,
        Balance: supplier.balance,
        PaymentTerms: supplier.paymentTerms
      })) || [],
      Sales: data.sales?.map(sale => ({
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
      })) || []
    };
    
    return JSON.stringify(qbData, null, 2);
  }

  static exportToCSV(data: ImportExportData): string {
    let csv = '';
    
    if (data.products) {
      csv += 'PRODUCTS\n';
      csv += 'Name,Description,Category,Brand,Cost Price,Selling Price,Stock,Min Stock,Barcode,Active\n';
      data.products.forEach(product => {
        csv += `"${product.name}","${product.description}","${product.category}","${product.brand}",${product.costPrice},${product.sellingPrice},${product.stock},${product.minStock},"${product.barcodes[0]}",${product.isActive}\n`;
      });
      csv += '\n';
    }
    
    if (data.customers) {
      csv += 'CUSTOMERS\n';
      csv += 'Name,Email,Phone,Address,Loyalty Points,Total Spent,Tier\n';
      data.customers.forEach(customer => {
        csv += `"${customer.name}","${customer.email}","${customer.phone}","${customer.address}",${customer.loyaltyCard.points},${customer.loyaltyCard.totalSpent},"${customer.loyaltyCard.tier}"\n`;
      });
    }
    
    return csv;
  }

  static exportToJSON(data: ImportExportData): string {
    return JSON.stringify(data, null, 2);
  }

  static async importFromCSV(fileContent: string): Promise<ImportExportData> {
    const lines = fileContent.split('\n');
    const products: Product[] = [];
    
    // Simple CSV parsing for products
    if (lines[0] === 'PRODUCTS' || lines[0].includes('Name')) {
      const headerIndex = lines.findIndex(line => line.includes('Name,Description'));
      if (headerIndex >= 0) {
        for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.replace(/"/g, ''));
          if (values.length >= 9) {
            products.push({
              id: crypto.randomUUID(),
              name: values[0],
              description: values[1],
              category: values[2],
              brand: values[3],
              costPrice: parseFloat(values[4]) || 0,
              sellingPrice: parseFloat(values[5]) || 0,
              stock: parseInt(values[6]) || 0,
              minStock: parseInt(values[7]) || 10,
              barcodes: [values[8]],
              supplier: '',
              images: [],
              isActive: values[9] !== 'false',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
    }

    return {
      products,
      format: 'csv',
      timestamp: new Date()
    };
  }
}