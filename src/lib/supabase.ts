import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = () => {
  try {
    return supabaseUrl && 
           supabaseAnonKey && 
           supabaseUrl !== 'https://yourprojectid.supabase.co' && 
           supabaseAnonKey !== 'eyJhbGciOiJ...yourkey...IkpXVCJ9' &&
           supabaseUrl !== 'your_supabase_project_url' &&
           supabaseAnonKey !== 'your_supabase_anon_key' &&
           supabaseUrl.length > 10 &&
           supabaseAnonKey.length > 20;
  } catch (error) {
    console.warn('Supabase config validation error:', error);
    return false;
  }
};

// Create Supabase client only if configuration is valid
let supabaseClient = null;

try {
  if (hasValidSupabaseConfig()) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.log('ℹ️ Supabase not configured - App will work in offline mode');
  }
} catch (error) {
  console.warn('⚠️ Supabase client initialization failed:', error);
  supabaseClient = null;
}

export const supabase = supabaseClient;

// Initialize default admin user in Supabase Auth if connected
export const initializeSupabaseAuth = async () => {
  // Skip initialization if Supabase is not configured
  if (!supabase) {
    console.log('ℹ️ Supabase Auth skipped - Working in offline mode');
    return;
  }
  
  try {
    console.log('🔗 Testing Supabase Auth connection...');
    
    // Simple connection test
    const { data: authData } = await supabase.auth.getSession();
    console.log('✅ Supabase Auth connection verified');
  } catch (error) {
    console.warn('⚠️ Supabase Auth connection failed, continuing in offline mode:', error);
  }
};

// Export configuration status for other components
export const getSupabaseStatus = () => ({
  isConfigured: hasValidSupabaseConfig(),
  url: supabaseUrl,
  isDemo: supabaseUrl === 'https://demo.supabase.co'
});

export type Database = {
  public: {
    Tables: {
      heartbeat: {
        Row: {
          id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string | null;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string | null;
        };
      };
      inventory: {
        Row: {
          id: string;
          item_name: string;
          barcode: string | null;
          quantity: number | null;
          price: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          item_name: string;
          barcode?: string | null;
          quantity?: number | null;
          price: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          item_name?: string;
          barcode?: string | null;
          quantity?: number | null;
          price?: number;
          created_at?: string | null;
        };
      };
      employees: {
        Row: {
          id: string;
          name: string;
          role: string;
          email: string | null;
          phone: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
        };
      };
      sales: {
        Row: {
          id: string;
          customer_id: string | null;
          total_amount: number;
          payment_method: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          total_amount: number;
          payment_method?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          total_amount?: number;
          payment_method?: string | null;
          created_at?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: 'basic' | 'pro' | 'advance';
          status: 'trial' | 'active' | 'expired' | 'cancelled';
          start_date: string;
          end_date: string;
          trial_days_used: number;
          max_systems: number;
          max_phones: number;
          features: any;
          amount_paid: number;
          payment_reference: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type: 'basic' | 'pro' | 'advance';
          status?: 'trial' | 'active' | 'expired' | 'cancelled';
          start_date: string;
          end_date: string;
          trial_days_used?: number;
          max_systems: number;
          max_phones: number;
          features: any;
          amount_paid?: number;
          payment_reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: 'basic' | 'pro' | 'advance';
          status?: 'trial' | 'active' | 'expired' | 'cancelled';
          start_date?: string;
          end_date?: string;
          trial_days_used?: number;
          max_systems?: number;
          max_phones?: number;
          features?: any;
          amount_paid?: number;
          payment_reference?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          plan_type: 'basic' | 'pro' | 'advance';
          monthly_price: number;
          max_systems: number;
          max_phones: number;
          trial_days: number;
          features: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan_type: 'basic' | 'pro' | 'advance';
          monthly_price: number;
          max_systems: number;
          max_phones: number;
          trial_days: number;
          features: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan_type?: 'basic' | 'pro' | 'advance';
          monthly_price?: number;
          max_systems?: number;
          max_phones?: number;
          trial_days?: number;
          features?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          contact_email: string;
          contact_phone: string;
          complaint_type: 'technical' | 'billing' | 'feature_request' | 'general';
          subject: string;
          description: string;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          admin_response: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          contact_email: string;
          contact_phone: string;
          complaint_type: 'technical' | 'billing' | 'feature_request' | 'general';
          subject: string;
          description: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          admin_response?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          contact_email?: string;
          contact_phone?: string;
          complaint_type?: 'technical' | 'billing' | 'feature_request' | 'general';
          subject?: string;
          description?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          admin_response?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          amount: number;
          currency: string;
          payment_method: 'paystack';
          paystack_reference: string;
          paystack_transaction_id: string;
          status: 'pending' | 'success' | 'failed';
          payment_date: string;
          created_at: string;
        };
        Insert: {
        };
      };
    };
  };
};