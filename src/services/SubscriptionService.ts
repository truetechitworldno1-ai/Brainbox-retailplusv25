import { supabase } from '../lib/supabase';
import { SubscriptionPlan, Subscription } from '../types';

export class SubscriptionService {
  // Get all subscription plans
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      if (error) throw error;

      return data.map(plan => ({
        id: plan.id,
        name: plan.name,
        planType: plan.plan_type,
        monthlyPrice: plan.monthly_price,
        maxSystems: plan.max_systems,
        maxPhones: plan.max_phones,
        trialDays: plan.trial_days,
        features: plan.features,
        isActive: plan.is_active,
        createdAt: new Date(plan.created_at),
        updatedAt: new Date(plan.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return this.getDefaultPlans();
    }
  }

  // Get user's current subscription
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      // For demo purposes, return a mock subscription if no Supabase connection
      if (!import.meta.env.VITE_SUPABASE_URL) {
        const savedSubscription = localStorage.getItem(`subscription_${userId}`);
        if (savedSubscription) {
          const sub = JSON.parse(savedSubscription);
          return {
            ...sub,
            startDate: new Date(sub.startDate),
            endDate: new Date(sub.endDate),
            createdAt: new Date(sub.createdAt),
            updatedAt: new Date(sub.updatedAt)
          };
        }
        return null;
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Supabase subscription query failed:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        planType: data.plan_type,
        status: data.status,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        trialDaysUsed: data.trial_days_used,
        maxSystems: data.max_systems,
        maxPhones: data.max_phones,
        features: data.features,
        amountPaid: data.amount_paid,
        paymentReference: data.payment_reference,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  // Create new subscription
  static async createSubscription(subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    try {
      // For demo purposes, save to localStorage if no Supabase connection
      if (!import.meta.env.VITE_SUPABASE_URL) {
        const newSubscription: Subscription = {
          ...subscriptionData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        localStorage.setItem(`subscription_${subscriptionData.userId}`, JSON.stringify(newSubscription));
        return newSubscription;
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: subscriptionData.userId,
          plan_type: subscriptionData.planType,
          status: subscriptionData.status,
          start_date: subscriptionData.startDate.toISOString(),
          end_date: subscriptionData.endDate.toISOString(),
          trial_days_used: subscriptionData.trialDaysUsed,
          max_systems: subscriptionData.maxSystems,
          max_phones: subscriptionData.maxPhones,
          features: subscriptionData.features,
          amount_paid: subscriptionData.amountPaid,
          payment_reference: subscriptionData.paymentReference
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        planType: data.plan_type,
        status: data.status,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        trialDaysUsed: data.trial_days_used,
        maxSystems: data.max_systems,
        maxPhones: data.max_phones,
        features: data.features,
        amountPaid: data.amount_paid,
        paymentReference: data.payment_reference,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Update subscription
  static async updateSubscription(id: string, updates: Partial<Subscription>): Promise<void> {
    try {
      // For demo purposes, update localStorage if no Supabase connection
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // Find subscription in localStorage by scanning all users
        const keys = Object.keys(localStorage).filter(key => key.startsWith('subscription_'));
        for (const key of keys) {
          const sub = JSON.parse(localStorage.getItem(key) || '{}');
          if (sub.id === id) {
            const updatedSub = { ...sub, ...updates, updatedAt: new Date() };
            localStorage.setItem(key, JSON.stringify(updatedSub));
            return;
          }
        }
        return;
      }
      
      const updateData: any = {};
      
      if (updates.status) updateData.status = updates.status;
      if (updates.planType) updateData.plan_type = updates.planType;
      if (updates.endDate) updateData.end_date = updates.endDate.toISOString();
      if (updates.trialDaysUsed !== undefined) updateData.trial_days_used = updates.trialDaysUsed;
      if (updates.maxSystems !== undefined) updateData.max_systems = updates.maxSystems;
      if (updates.maxPhones !== undefined) updateData.max_phones = updates.maxPhones;
      if (updates.features) updateData.features = updates.features;
      if (updates.amountPaid !== undefined) updateData.amount_paid = updates.amountPaid;
      if (updates.paymentReference) updateData.payment_reference = updates.paymentReference;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Check if subscription is valid
  static isSubscriptionValid(subscription: Subscription | null): boolean {
    if (!subscription) return false;
    
    const now = new Date();
    return subscription.status === 'active' || 
           (subscription.status === 'trial' && subscription.endDate > now);
  }

  // Get days remaining in subscription
  static getDaysRemaining(subscription: Subscription | null): number {
    if (!subscription) return 0;
    
    const now = new Date();
    const daysRemaining = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  }

  // Check if Basic plan is in limited mode (after 3 months)
  static isBasicPlanLimited(subscription: Subscription | null): boolean {
    if (!subscription || subscription.planType !== 'basic') return false;
    
    const now = new Date();
    const threeMonthsAfterStart = new Date(subscription.startDate);
    threeMonthsAfterStart.setMonth(threeMonthsAfterStart.getMonth() + 3);
    
    return now > threeMonthsAfterStart;
  }

  // Check if user has access to employee features
  static hasEmployeeAccess(subscription: Subscription | null, userRole?: string): boolean {
    // Global Admin can override Basic limitations
    if (userRole === 'global_admin') return true;
    
    if (!subscription) return false;
    
    // Pro and Advanced always have full access
    if (subscription.planType === 'pro' || subscription.planType === 'advance') {
      return true;
    }
    
    // Basic plan - full access for first 3 months, then limited
    if (subscription.planType === 'basic') {
      return !this.isBasicPlanLimited(subscription);
    }
    
    return false;
  }

  // Check if user has access to salary & expense features
  static hasSalaryExpenseAccess(subscription: Subscription | null, userRole?: string): boolean {
    // Global Admin can override Basic limitations
    if (userRole === 'global_admin') return true;
    
    if (!subscription) return false;
    
    // Pro and Advanced always have full access
    if (subscription.planType === 'pro' || subscription.planType === 'advance') {
      return true;
    }
    
    // Basic plan - full access for first 3 months, then limited
    if (subscription.planType === 'basic') {
      return !this.isBasicPlanLimited(subscription);
    }
    
    return false;
  }
  // Check if user can get Basic→Pro upgrade discount (within 3 months)
  static canGetUpgradeDiscount(subscription: Subscription | null): boolean {
    if (!subscription || subscription.planType !== 'basic') return false;
    
    const now = new Date();
    const threeMonthsAfterStart = new Date(subscription.startDate);
    threeMonthsAfterStart.setMonth(threeMonthsAfterStart.getMonth() + 3);
    
    return now <= threeMonthsAfterStart; // Within 3 months
  }

  // Calculate upgrade discount (9% off Pro plan)
  static calculateUpgradeDiscount(originalPrice: number): { discountedPrice: number; savings: number; discountPercentage: number } {
    const discountPercentage = 9;
    const savings = originalPrice * (discountPercentage / 100);
    const discountedPrice = originalPrice - savings;
    
    return {
      discountedPrice,
      savings,
      discountPercentage
    };
  }

  // Check if user has access to specific feature
  static hasFeatureAccess(subscription: Subscription | null, feature: string, userRole?: string): boolean {
    // Global Admin can override Basic limitations
    if (userRole === 'global_admin') return true;
    
    if (!subscription) return false;
    
    const plan = this.getDefaultPlans().find(p => p.planType === subscription.planType);
    if (!plan) return false;

    // Permanent features (available in all plans always)
    const permanentFeatures = [
      'pos',
      'printerConfiguration', 
      'cashierCounters',
      'returnItems',
      'inventory',
      'customers',
      'basicReporting',
      'phoneGreetings',
      'audioAlerts'
    ];

    if (permanentFeatures.includes(feature)) {
      return true;
    }

    // Accounting features - special logic
    const accountingFeatures = [
      'accounting',
      'expenseTracking',
      'profitLossReports',
      'cashFlowReports',
      'vatTaxReports',
      'reconciliation',
      'auditTrail',
      'accountingExport'
    ];

    if (accountingFeatures.includes(feature)) {
      // Advanced plan - always has accounting
      if (subscription.planType === 'advance') return true;
      
      // Pro plan - always has accounting
      if (subscription.planType === 'pro') return true;
      
      // Basic plan - has accounting for first 3 months only
      if (subscription.planType === 'basic') {
        return !this.isBasicPlanLimited(subscription);
      }
    }

    // Check plan features for other features
    return plan.features[feature as keyof typeof plan.features] || false;
  }

  // Admin function to update subscription plan pricing
  static async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.monthlyPrice !== undefined) updateData.monthly_price = updates.monthlyPrice;
      if (updates.maxSystems !== undefined) updateData.max_systems = updates.maxSystems;
      if (updates.maxPhones !== undefined) updateData.max_phones = updates.maxPhones;
      if (updates.trialDays !== undefined) updateData.trial_days = updates.trialDays;
      if (updates.features) updateData.features = updates.features;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('subscription_plans')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  // Default plans with your exact specifications
  static getDefaultPlans(): SubscriptionPlan[] {
    return [
      {
        id: '1',
        name: 'Basic Plan',
        planType: 'basic',
        monthlyPrice: 20000, // ₦20,000/month
        maxSystems: 3,
        maxPhones: 1,
        trialDays: 14,
        features: {
          // Permanent Features (Always Available - NEVER LIMITED)
          pos: true,
          printerConfiguration: true,
          cashierCounters: true,
          returnItems: true,
          inventory: true,
          customers: true,
          basicReporting: true,
          phoneGreetings: true,
          audioAlerts: true,
          
          // Accounting Features (Available for 3 months, then limited)
          accounting: true,
          expenseTracking: true,
          profitLossReports: true,
          cashFlowReports: true,
          vatTaxReports: true,
          reconciliation: true,
          auditTrail: true,
          accountingExport: true,
          
          // Advanced Features (Not Available)
          rewardRedemption: false,
          quickbooksImport: false,
          tabletSupport: false,
          multiStore: false,
          advancedReporting: false,
          apiAccess: false,
          prioritySupport: false,
          customization: false
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Pro Plan',
        planType: 'pro',
        monthlyPrice: 40000, // ₦40,000/month
        maxSystems: 5,
        maxPhones: 2,
        trialDays: 14,
        features: {
          // Permanent Features (Always Available)
          pos: true,
          printerConfiguration: true,
          cashierCounters: true,
          returnItems: true,
          inventory: true,
          customers: true,
          basicReporting: true,
          phoneGreetings: true,
          audioAlerts: true,
          
          // Full Accounting (Always Available - Never Limited)
          accounting: true,
          expenseTracking: true,
          profitLossReports: true,
          cashFlowReports: true,
          vatTaxReports: true,
          reconciliation: true,
          auditTrail: true,
          accountingExport: true,
          
          // Pro Features
          rewardRedemption: true,
          quickbooksImport: true,
          multiStore: true,
          advancedReporting: true,
          apiAccess: true,
          
          // Advanced Features (Not Available)
          tabletSupport: false,
          prioritySupport: false,
          customization: false
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Advanced Plan',
        planType: 'advance',
        monthlyPrice: 80000, // ₦80,000/month
        maxSystems: 8,
        maxPhones: 3,
        trialDays: 14,
        features: {
          // Permanent Features (Always Available)
          pos: true,
          printerConfiguration: true,
          cashierCounters: true,
          returnItems: true,
          inventory: true,
          customers: true,
          basicReporting: true,
          phoneGreetings: true,
          audioAlerts: true,
          
          // Full Accounting (Always Available)
          accounting: true,
          expenseTracking: true,
          profitLossReports: true,
          cashFlowReports: true,
          vatTaxReports: true,
          reconciliation: true,
          auditTrail: true,
          accountingExport: true,
          
          // All Advanced Features (Always Available)
          rewardRedemption: true,
          quickbooksImport: true,
          tabletSupport: true,
          multiStore: true,
          advancedReporting: true,
          apiAccess: true,
          prioritySupport: true,
          customization: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}