import { supabase } from '../lib/supabase';

export class DeviceSyncService {
  private static syncChannel: any = null;
  private static deviceId: string = '';

  // Initialize device sync
  static initialize() {
    // Skip initialization if Supabase is not available
    if (!supabase) {
      console.log('ℹ️ Device sync disabled - Supabase not configured');
      return;
    }
    
    this.deviceId = this.getDeviceId();
    this.setupRealtimeSync();
  }

  // Get unique device ID
  private static getDeviceId(): string {
    let deviceId = localStorage.getItem('brainbox_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('brainbox_device_id', deviceId);
    }
    return deviceId;
  }

  // Setup real-time synchronization
  private static setupRealtimeSync() {
    if (!supabase) {
      console.log('ℹ️ Real-time sync disabled - Supabase not available');
      return;
    }

    // Listen for changes from other devices
    this.syncChannel = supabase
      .channel('device_sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sync_logs' }, 
        (payload) => {
          this.handleRemoteChange(payload);
        }
      )
      .subscribe();
  }

  // Handle changes from other devices
  private static handleRemoteChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Ignore changes from this device
    if (newRecord?.device_id === this.deviceId) return;

    console.log('Remote change detected:', eventType, newRecord);

    // Apply changes to local storage
    switch (newRecord?.action) {
      case 'product_update':
        this.syncProductFromRemote(newRecord.data);
        break;
      case 'customer_update':
        this.syncCustomerFromRemote(newRecord.data);
        break;
      case 'sale_create':
        this.syncSaleFromRemote(newRecord.data);
        break;
    }
  }

  // Sync product from remote device
  private static syncProductFromRemote(productData: any) {
    const savedProducts = localStorage.getItem('brainbox_products');
    if (savedProducts) {
      const products = JSON.parse(savedProducts);
      const existingIndex = products.findIndex((p: any) => p.id === productData.id);
      
      if (existingIndex >= 0) {
        products[existingIndex] = { ...products[existingIndex], ...productData };
      } else {
        products.push(productData);
      }
      
      localStorage.setItem('brainbox_products', JSON.stringify(products));
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('brainbox_data_updated', { 
        detail: { type: 'products', data: products } 
      }));
    }
  }

  // Sync customer from remote device
  private static syncCustomerFromRemote(customerData: any) {
    const savedCustomers = localStorage.getItem('brainbox_customers');
    if (savedCustomers) {
      const customers = JSON.parse(savedCustomers);
      const existingIndex = customers.findIndex((c: any) => c.id === customerData.id);
      
      if (existingIndex >= 0) {
        customers[existingIndex] = { ...customers[existingIndex], ...customerData };
      } else {
        customers.push(customerData);
      }
      
      localStorage.setItem('brainbox_customers', JSON.stringify(customers));
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('brainbox_data_updated', { 
        detail: { type: 'customers', data: customers } 
      }));
    }
  }

  // Sync sale from remote device
  private static syncSaleFromRemote(saleData: any) {
    const savedSales = localStorage.getItem('brainbox_sales');
    if (savedSales) {
      const sales = JSON.parse(savedSales);
      const existingIndex = sales.findIndex((s: any) => s.id === saleData.id);
      
      if (existingIndex >= 0) {
        sales[existingIndex] = { ...sales[existingIndex], ...saleData };
      } else {
        sales.push(saleData);
      }
      
      localStorage.setItem('brainbox_sales', JSON.stringify(sales));
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('brainbox_data_updated', { 
        detail: { type: 'sales', data: sales } 
      }));
    }
  }

  // Log action for sync to other devices
  static async logAction(action: string, data: any) {
    if (!supabase) return;

    try {
      await supabase
        .from('sync_logs')
        .insert({
          user_id: data.userId || null,
          action,
          data,
          device_id: this.deviceId,
          synced: false
        });
    } catch (error) {
      console.error('Failed to log sync action:', error);
    }
  }

  // Force sync all data
  static async forceSyncAll() {
    try {
      // Get all local data
      const products = JSON.parse(localStorage.getItem('brainbox_products') || '[]');
      const customers = JSON.parse(localStorage.getItem('brainbox_customers') || '[]');
      const sales = JSON.parse(localStorage.getItem('brainbox_sales') || '[]');

      // Sync to server
      for (const product of products) {
        await this.logAction('product_update', product);
      }

      for (const customer of customers) {
        await this.logAction('customer_update', customer);
      }

      for (const sale of sales) {
        await this.logAction('sale_create', sale);
      }

      console.log('Force sync completed');
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  }
}

// Initialize device sync only if Supabase is available
try {
  if (import.meta.env.DEV) {
    console.log('ℹ️ Device sync disabled in development mode');
  } else {
    DeviceSyncService.initialize();
  }
} catch (error) {
  console.warn('Device sync initialization failed:', error);
}