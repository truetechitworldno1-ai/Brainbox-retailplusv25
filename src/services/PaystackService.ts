import { Payment } from '../types';

class PaystackService {
  private publicKey: string;
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    // Use environment variables if available, otherwise use demo keys
    this.publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_demo_key';
    this.secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY || 'sk_test_demo_key';
    
    // Log configuration status
    console.log('Paystack configured:', {
      hasPublicKey: !!this.publicKey,
      hasSecretKey: !!this.secretKey,
      isDemo: this.isUsingDemoKeys(),
      environment: this.isUsingDemoKeys() ? 'demo' : 'live',
      paystackLoaded: typeof window !== 'undefined' && !!window.PaystackPop
    });
  }

  // Check if using demo keys
  private isUsingDemoKeys(): boolean {
    return this.publicKey === 'pk_test_demo_key' || !this.publicKey || this.publicKey.trim() === '';
  }

  // Validate Paystack configuration
  private validateConfiguration(): void {
    if (this.isUsingDemoKeys()) {
      throw new Error('Paystack public key not configured. Please add your Paystack keys to environment variables or .env file.');
    }

    if (typeof window === 'undefined' || !window.PaystackPop) {
      throw new Error('Paystack payment system not loaded. Please refresh the page and try again.');
    }
  }

  // Process subscription payment
  async processSubscriptionPayment(
    email: string, 
    amount: number, 
    planType: string, 
    userId: string, 
    customerName: string
  ): Promise<Payment> {
    return new Promise((resolve, reject) => {
      try {
        // Validate configuration before proceeding
        this.validateConfiguration();

        // @ts-ignore - PaystackPop is loaded from external script
        const handler = window.PaystackPop.setup({
          key: this.publicKey,
          email,
          amount: amount * 100, // Convert to kobo
          currency: 'NGN',
          ref: `${Date.now()}_${userId}_${planType}`,
          metadata: {
            plan: planType,
            userId,
            customerName,
            custom_fields: [
              {
                display_name: 'Plan',
                variable_name: 'plan',
                value: planType
              },
              {
                display_name: 'Customer Name',
                variable_name: 'customer_name',
                value: customerName
              }
            ]
          },
          callback: (response: any) => {
            const payment: Payment = {
              id: crypto.randomUUID(),
              userId,
              subscriptionId: crypto.randomUUID(),
              amount,
              currency: 'NGN',
              paymentMethod: 'paystack',
              paystackReference: response.reference,
              paystackTransactionId: response.trans,
              status: 'success',
              paymentDate: new Date(),
              createdAt: new Date()
            };
            resolve(payment);
          },
          onClose: () => {
            reject(new Error('Payment cancelled by user'));
          }
        });

        handler.openIframe();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get payment history for a user
  async getPaymentHistory(userId: string): Promise<Payment[]> {
    try {
      // In production, this would fetch from your backend/database
      // For now, return mock data or from localStorage
      const savedPayments = localStorage.getItem(`paystack_payments_${userId}`);
      if (savedPayments) {
        const payments = JSON.parse(savedPayments);
        return payments.map((payment: any) => ({
          ...payment,
          paymentDate: new Date(payment.paymentDate),
          createdAt: new Date(payment.createdAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  // Save payment to localStorage (in production, save to database)
  async savePayment(payment: Payment): Promise<void> {
    try {
      const existingPayments = await this.getPaymentHistory(payment.userId);
      const updatedPayments = [payment, ...existingPayments];
      localStorage.setItem(`paystack_payments_${payment.userId}`, JSON.stringify(updatedPayments));
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  }

  // Initialize Paystack payment
  async initializePayment(email: string, amount: number, plan: string, userId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Convert to kobo
          currency: 'NGN',
          callback_url: `${window.location.origin}/payment/callback`,
          metadata: {
            plan,
            userId,
            custom_fields: [
              {
                display_name: 'Plan',
                variable_name: 'plan',
                value: plan
              }
            ]
          }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment initialization failed');
      }

      return data;
    } catch (error) {
      console.error('Payment initialization error:', error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(reference: string) {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment verification failed');
      }

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Open Paystack checkout
  openCheckout(email: string, amount: number, plan: string, userId: string, onSuccess: (reference: string) => void, onClose: () => void) {
    try {
      console.log('Opening Paystack checkout:', { email, amount, plan, userId });
      
      // Validate configuration before proceeding
      this.validateConfiguration();
      
      console.log('✅ Paystack available, creating payment handler');
      
      // @ts-ignore - PaystackPop is loaded from external script
      const handler = window.PaystackPop.setup({
        key: this.publicKey,
        email,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        ref: `${Date.now()}_${userId}_${plan}`,
        metadata: {
          plan,
          userId,
          custom_fields: [
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: plan
            }
          ]
        },
        callback: function(response: any) {
          console.log('✅ Paystack payment successful:', response);
          onSuccess(response.reference);
        },
        onClose: function() {
          console.log('ℹ️ Paystack payment cancelled by user');
          onClose();
        }
      });

      console.log('🚀 Opening Paystack payment iframe');
      handler.openIframe();
    } catch (error) {
      console.error('Paystack checkout error:', error);
      throw error;
    }
  }

  // Get all transactions
  async getTransactions(page = 1, perPage = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/transaction?page=${page}&perPage=${perPage}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      return data;
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  }

  // Get configuration status for UI display
  getConfigurationStatus() {
    return {
      isConfigured: !this.isUsingDemoKeys(),
      publicKeyPresent: !!this.publicKey && this.publicKey !== 'pk_test_demo_key',
      scriptLoaded: typeof window !== 'undefined' && !!window.PaystackPop,
      environment: this.isUsingDemoKeys() ? 'demo' : (this.publicKey.includes('test') ? 'test' : 'live'),
      publicKeyPreview: this.publicKey ? `${this.publicKey.substring(0, 8)}...` : 'Not set'
    };
  }
}

export { PaystackService };
export default new PaystackService();