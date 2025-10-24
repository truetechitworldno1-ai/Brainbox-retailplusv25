import { supabase } from '../lib/supabase';
import { Product, Customer, Supplier, Sale, Purchase, Employee, Category } from '../types';

export class SupabaseDataService {
  static async getProducts(tenantId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category_id,
      brand: p.brand || '',
      barcodes: p.barcodes || [p.barcode],
      costPrice: p.cost_price,
      sellingPrice: p.selling_price,
      stock: p.quantity,
      minStock: p.min_stock || 0,
      maxStock: p.max_stock || 1000,
      unit: p.unit || 'pcs',
      description: p.description || '',
      isActive: p.is_active,
      hasVariations: false,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
      expiryDate: p.expiry_date ? new Date(p.expiry_date) : undefined,
      vatRate: p.vat_rate,
      taxRate: p.tax_rate
    }));
  }

  static async addProduct(tenantId: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        name: product.name,
        category_id: product.category,
        brand: product.brand,
        barcode: product.barcodes[0],
        barcodes: product.barcodes,
        cost_price: product.costPrice,
        selling_price: product.sellingPrice,
        quantity: product.stock,
        min_stock: product.minStock,
        max_stock: product.maxStock,
        unit: product.unit,
        description: product.description,
        is_active: product.isActive,
        expiry_date: product.expiryDate,
        vat_rate: product.vatRate,
        tax_rate: product.taxRate
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      category: data.category_id,
      brand: data.brand || '',
      barcodes: data.barcodes || [data.barcode],
      costPrice: data.cost_price,
      sellingPrice: data.selling_price,
      stock: data.quantity,
      minStock: data.min_stock || 0,
      maxStock: data.max_stock || 1000,
      unit: data.unit || 'pcs',
      description: data.description || '',
      isActive: data.is_active,
      hasVariations: false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.category) updateData.category_id = updates.category;
    if (updates.brand) updateData.brand = updates.brand;
    if (updates.barcodes) {
      updateData.barcode = updates.barcodes[0];
      updateData.barcodes = updates.barcodes;
    }
    if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
    if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
    if (updates.stock !== undefined) updateData.quantity = updates.stock;
    if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
    if (updates.maxStock !== undefined) updateData.max_stock = updates.maxStock;
    if (updates.unit) updateData.unit = updates.unit;
    if (updates.description) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.expiryDate) updateData.expiry_date = updates.expiryDate;
    if (updates.vatRate !== undefined) updateData.vat_rate = updates.vatRate;
    if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  static async getCustomers(tenantId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      loyaltyCard: {
        cardNumber: c.loyalty_card_number || '',
        points: c.loyalty_points || 0,
        totalSpent: c.total_spent || 0,
        rewardPercentage: 2,
        tier: 'silver',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      totalPurchases: 0,
      lastPurchase: new Date(c.last_purchase || new Date()),
      isActive: c.is_active,
      createdAt: new Date(c.created_at)
    }));
  }

  static async addCustomer(tenantId: string, customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        loyalty_card_number: customer.loyaltyCard?.cardNumber,
        loyalty_points: customer.loyaltyCard?.points || 0,
        total_spent: customer.loyaltyCard?.totalSpent || 0,
        is_active: customer.isActive
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      loyaltyCard: {
        cardNumber: data.loyalty_card_number || '',
        points: data.loyalty_points || 0,
        totalSpent: data.total_spent || 0,
        rewardPercentage: 2,
        tier: 'silver',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      totalPurchases: 0,
      lastPurchase: new Date(),
      isActive: data.is_active,
      createdAt: new Date(data.created_at)
    };
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.address) updateData.address = updates.address;
    if (updates.loyaltyCard) {
      if (updates.loyaltyCard.cardNumber) updateData.loyalty_card_number = updates.loyaltyCard.cardNumber;
      if (updates.loyaltyCard.points !== undefined) updateData.loyalty_points = updates.loyaltyCard.points;
      if (updates.loyaltyCard.totalSpent !== undefined) updateData.total_spent = updates.loyaltyCard.totalSpent;
    }
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  static async getSuppliers(tenantId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map(s => ({
      id: s.id,
      name: s.name,
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      taxId: s.tax_id || '',
      paymentTerms: s.payment_terms || 'Net 30',
      isActive: s.is_active,
      createdAt: new Date(s.created_at)
    }));
  }

  static async addSupplier(tenantId: string, supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        tenant_id: tenantId,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        tax_id: supplier.taxId,
        payment_terms: supplier.paymentTerms,
        is_active: supplier.isActive
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      taxId: data.tax_id || '',
      paymentTerms: data.payment_terms || 'Net 30',
      isActive: data.is_active,
      createdAt: new Date(data.created_at)
    };
  }

  static async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.address) updateData.address = updates.address;
    if (updates.taxId) updateData.tax_id = updates.taxId;
    if (updates.paymentTerms) updateData.payment_terms = updates.paymentTerms;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  static async getSales(tenantId: string, limit = 1000): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(s => ({
      id: s.id,
      customerId: s.customer_id || '',
      cashierId: s.cashier_id,
      items: (s.sale_items || []).map((item: any) => ({
        productId: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.total_amount,
        barcode: item.barcode || ''
      })),
      subtotal: s.subtotal,
      tax: s.tax_amount,
      discount: s.discount_amount || 0,
      total: s.total_amount,
      paymentMethod: s.payment_method,
      paymentDetails: s.payment_details || {},
      timestamp: new Date(s.created_at),
      receiptNumber: s.receipt_number || `RCP-${s.id.substring(0, 8)}`
    }));
  }

  static async addSale(tenantId: string, sale: Omit<Sale, 'id'>): Promise<Sale> {
    const { data, error } = await supabase
      .from('sales')
      .insert({
        tenant_id: tenantId,
        customer_id: sale.customerId || null,
        cashier_id: sale.cashierId,
        subtotal: sale.subtotal,
        tax_amount: sale.tax,
        discount_amount: sale.discount,
        total_amount: sale.total,
        payment_method: sale.paymentMethod,
        payment_details: sale.paymentDetails,
        receipt_number: sale.receiptNumber
      })
      .select()
      .single();

    if (error) throw error;

    for (const item of sale.items) {
      await supabase
        .from('sale_items')
        .insert({
          sale_id: data.id,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_amount: item.total,
          barcode: item.barcode
        });

      await supabase.rpc('decrement_product_quantity', {
        p_product_id: item.productId,
        p_quantity: item.quantity
      });
    }

    return {
      id: data.id,
      customerId: data.customer_id || '',
      cashierId: data.cashier_id,
      items: sale.items,
      subtotal: data.subtotal,
      tax: data.tax_amount,
      discount: data.discount_amount || 0,
      total: data.total_amount,
      paymentMethod: data.payment_method,
      paymentDetails: data.payment_details || {},
      timestamp: new Date(data.created_at),
      receiptNumber: data.receipt_number || `RCP-${data.id.substring(0, 8)}`
    };
  }

  static async getEmployees(tenantId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map(e => ({
      id: e.id,
      name: e.name,
      email: e.email || '',
      phone: e.phone || '',
      role: e.role || 'cashier',
      hireDate: new Date(e.hire_date || e.created_at),
      salary: e.salary || 0,
      commission: e.commission_rate || 0,
      isActive: e.is_active,
      permissions: e.permissions || []
    }));
  }

  static async addEmployee(tenantId: string, employee: Omit<Employee, 'id'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        tenant_id: tenantId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        hire_date: employee.hireDate,
        salary: employee.salary,
        commission_rate: employee.commission,
        is_active: employee.isActive,
        permissions: employee.permissions
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      role: data.role || 'cashier',
      hireDate: new Date(data.hire_date || data.created_at),
      salary: data.salary || 0,
      commission: data.commission_rate || 0,
      isActive: data.is_active,
      permissions: data.permissions || []
    };
  }

  static async getCategories(tenantId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || '',
      color: c.color || '#3B82F6',
      isActive: c.is_active,
      createdAt: new Date(c.created_at)
    }));
  }

  static async addCategory(tenantId: string, category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        tenant_id: tenantId,
        name: category.name,
        description: category.description,
        color: category.color,
        is_active: category.isActive
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      color: data.color || '#3B82F6',
      isActive: data.is_active,
      createdAt: new Date(data.created_at)
    };
  }
}
