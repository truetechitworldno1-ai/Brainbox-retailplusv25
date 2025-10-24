import { APIIntegration, Product, Customer, Sale } from '../types';

export class APIIntegrationService {
  private static integrations: APIIntegration[] = [];

  // Register a new API integration
  static registerIntegration(integration: Omit<APIIntegration, 'id' | 'createdAt'>): APIIntegration {
    const newIntegration: APIIntegration = {
      ...integration,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    this.integrations.push(newIntegration);
    return newIntegration;
  }

  // Get all active integrations
  static getActiveIntegrations(): APIIntegration[] {
    return this.integrations.filter(integration => integration.isActive);
  }

  // Webhook endpoints for external systems
  static async handleWebhook(integrationId: string, data: any): Promise<any> {
    const integration = this.integrations.find(i => i.id === integrationId);
    if (!integration || !integration.isActive) {
      throw new Error('Integration not found or inactive');
    }

    // Process webhook data based on integration type
    switch (data.type) {
      case 'product_sync':
        return this.syncProducts(data.products);
      case 'customer_sync':
        return this.syncCustomers(data.customers);
      case 'sale_notification':
        return this.processSaleNotification(data.sale);
      default:
        throw new Error('Unknown webhook type');
    }
  }

  // API endpoints for external systems to access BRAINBOX data
  static async getProducts(apiKey: string): Promise<Product[]> {
    const integration = this.integrations.find(i => i.apiKey === apiKey && i.isActive);
    if (!integration || !integration.permissions.includes('read_products')) {
      throw new Error('Unauthorized');
    }

    // Return products data (would come from DataContext in real implementation)
    return [];
  }

  static async createSale(apiKey: string, saleData: any): Promise<Sale> {
    const integration = this.integrations.find(i => i.apiKey === apiKey && i.isActive);
    if (!integration || !integration.permissions.includes('create_sales')) {
      throw new Error('Unauthorized');
    }

    // Process sale creation (would integrate with DataContext)
    throw new Error('Not implemented');
  }

  // Generate API documentation for integrations
  static generateAPIDocumentation(): string {
    return `
# BRAINBOX_RETAILPLUS API Documentation

## Authentication
All API requests require an API key in the Authorization header:
\`Authorization: Bearer YOUR_API_KEY\`

## Endpoints

### Products
- GET /api/products - List all products
- POST /api/products - Create a new product
- PUT /api/products/:id - Update a product
- DELETE /api/products/:id - Delete a product

### Customers
- GET /api/customers - List all customers
- POST /api/customers - Create a new customer
- PUT /api/customers/:id - Update customer details

### Sales
- GET /api/sales - List all sales
- POST /api/sales - Create a new sale
- GET /api/sales/:id - Get sale details

### Webhooks
- POST /webhooks/:integration_id - Receive webhook notifications

## Data Formats
All data is exchanged in JSON format. See type definitions for detailed schemas.
    `;
  }

  private static async syncProducts(products: any[]): Promise<void> {
    // Sync products from external system
    console.log('Syncing products:', products);
  }

  private static async syncCustomers(customers: any[]): Promise<void> {
    // Sync customers from external system
    console.log('Syncing customers:', customers);
  }

  private static async processSaleNotification(sale: any): Promise<void> {
    // Process sale notification from external system
    console.log('Processing sale notification:', sale);
  }
}