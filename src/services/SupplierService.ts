import { supabase } from '../lib/supabase';
import { Supplier } from '../types';

class SupplierService {
  private suppliers: Supplier[] = [
    {
      id: '1',
      name: 'ABC Wholesale Ltd',
      contactPerson: 'John Smith',
      email: 'john@abcwholesale.com',
      phone: '+234-801-234-5678',
      address: '123 Industrial Avenue',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      taxId: 'TIN-123456789',
      paymentTerms: 'Net 30',
      creditLimit: 500000,
      currentBalance: 125000,
      status: 'active',
      rating: 4.5,
      notes: 'Reliable supplier for electronics',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Fresh Foods Distribution',
      contactPerson: 'Mary Johnson',
      email: 'mary@freshfoods.com',
      phone: '+234-802-345-6789',
      address: '456 Market Street',
      city: 'Abuja',
      state: 'FCT',
      country: 'Nigeria',
      paymentTerms: 'Net 15',
      creditLimit: 300000,
      currentBalance: 75000,
      status: 'active',
      rating: 4.2,
      notes: 'Perishable goods supplier',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Using local suppliers data:', error);
      return this.suppliers;
    }
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Using local supplier data:', error);
      return this.suppliers.find(s => s.id === id) || null;
    }
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const newSupplier: Supplier = {
      ...supplier,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([newSupplier])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Using local storage for supplier:', error);
      this.suppliers.push(newSupplier);
      localStorage.setItem('suppliers', JSON.stringify(this.suppliers));
      return newSupplier;
    }
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const updatedSupplier = {
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updatedSupplier)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Using local storage for supplier update:', error);
      const index = this.suppliers.findIndex(s => s.id === id);
      if (index !== -1) {
        this.suppliers[index] = { ...this.suppliers[index], ...updatedSupplier };
        localStorage.setItem('suppliers', JSON.stringify(this.suppliers));
        return this.suppliers[index];
      }
      throw new Error('Supplier not found');
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.warn('Using local storage for supplier deletion:', error);
      this.suppliers = this.suppliers.filter(s => s.id !== id);
      localStorage.setItem('suppliers', JSON.stringify(this.suppliers));
    }
  }

  async getSuppliersByStatus(status: 'active' | 'inactive' | 'suspended'): Promise<Supplier[]> {
    const suppliers = await this.getAllSuppliers();
    return suppliers.filter(s => s.status === status);
  }

  async updateSupplierBalance(id: string, amount: number): Promise<void> {
    const supplier = await this.getSupplierById(id);
    if (supplier) {
      await this.updateSupplier(id, {
        currentBalance: supplier.currentBalance + amount
      });
    }
  }
}

export const supplierService = new SupplierService();