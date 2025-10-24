import React, { createContext, useContext, useState, useEffect } from 'react';
import { SubscriptionPlan, Subscription, Payment, Complaint } from '../types';
import { SubscriptionService } from '../services/SubscriptionService';
import PaystackService from '../services/PaystackService';
import { ComplaintService } from '../services/ComplaintService';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface SubscriptionContextType {
  // Subscription Plans
  subscriptionPlans: SubscriptionPlan[];
  currentSubscription: Subscription | null;
  isSubscriptionValid: boolean;
  daysRemaining: number;
  
  // Plan Management (Admin)
  updatePlanPricing: (planId: string, updates: Partial<SubscriptionPlan>) => Promise<void>;
  
  // Subscription Management
  startTrial: (planType: 'basic' | 'pro' | 'advance') => Promise<void>;
  upgradeSubscription: (planType: 'basic' | 'pro' | 'advance') => Promise<void>;
  downgradeSubscription: (planType: 'basic' | 'pro' | 'advance') => Promise<void>;
  extendTrial: (additionalDays: number) => Promise<void>;
  
  // Payment Processing
  processPayment: (planType: 'basic' | 'pro' | 'advance', email: string) => Promise<void>;
  paymentHistory: Payment[];
  
  // Complaints
  submitComplaint: (complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'adminResponse' | 'status'>) => Promise<void>;
  userComplaints: Complaint[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subscription data
  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plans, subscription, payments, complaints] = await Promise.all([
        SubscriptionService.getSubscriptionPlans(),
        user ? SubscriptionService.getUserSubscription(user.id) : Promise.resolve(null),
        user ? PaystackService.getPaymentHistory(user.id) : Promise.resolve([]),
        user ? ComplaintService.getUserComplaints(user.id) : Promise.resolve([])
      ]);

      setSubscriptionPlans(plans);
      setCurrentSubscription(subscription);
      setPaymentHistory(payments);
      setUserComplaints(complaints);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
      console.error('Subscription data loading error:', err);
      
      // Load default plans as fallback
      setSubscriptionPlans(SubscriptionService.getDefaultPlans());
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await loadSubscriptionData();
  };

  const isSubscriptionValid = SubscriptionService.isSubscriptionValid(currentSubscription);
  const daysRemaining = SubscriptionService.getDaysRemaining(currentSubscription);

  const startTrial = async (planType: 'basic' | 'pro' | 'advance') => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const plan = subscriptionPlans.find(p => p.planType === planType);
      if (!plan) throw new Error('Plan not found');

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);

      const subscription = await SubscriptionService.createSubscription({
        userId: user.id,
        planType,
        status: 'trial',
        startDate: new Date(),
        endDate: trialEndDate,
        trialDaysUsed: 0,
        maxSystems: plan.maxSystems,
        maxPhones: plan.maxPhones,
        features: plan.features,
        amountPaid: 0,
        paymentReference: ''
      });

      setCurrentSubscription(subscription);
      
      addNotification({
        title: 'Trial Started',
        message: `Your ${plan.name} trial has started! Enjoy ${plan.trialDays} days of full access.`,
        type: 'success'
      });
    } catch (err: any) {
      setError('Failed to start trial');
      addNotification({
        title: 'Trial Failed',
        message: err.message || 'Failed to start trial. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeSubscription = async (planType: 'basic' | 'pro' | 'advance') => {
    if (!user) return;
    
    setIsLoading(true);
    const plan = subscriptionPlans.find(p => p.planType === planType);
    if (!plan) {
      setIsLoading(false);
      return;
    }

    try {
      const payment = await PaystackService.processSubscriptionPayment(
        user.email,
        plan.monthlyPrice,
        planType,
        user.id,
        user.name
      );
      
      // Save payment
      await PaystackService.savePayment(payment);
      
      // Create or update subscription
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      if (currentSubscription) {
        await SubscriptionService.updateSubscription(currentSubscription.id, {
          planType,
          status: 'active',
          endDate,
          maxSystems: plan.maxSystems,
          maxPhones: plan.maxPhones,
          features: plan.features,
          amountPaid: plan.monthlyPrice,
          paymentReference: payment.paystackReference
        });
      } else {
        await SubscriptionService.createSubscription({
          userId: user.id,
          planType,
          status: 'active',
          startDate: new Date(),
          endDate,
          trialDaysUsed: 0,
          maxSystems: plan.maxSystems,
          maxPhones: plan.maxPhones,
          features: plan.features,
          amountPaid: plan.monthlyPrice,
          paymentReference: payment.paystackReference
        });
      }
      
      // Refresh data
      await loadSubscriptionData();
      
      addNotification({
        title: 'Payment Successful',
        message: `Successfully upgraded to ${plan.name}!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Upgrade failed:', err);
      addNotification({
        title: 'Payment Failed',
        message: err.message || 'Payment could not be processed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downgradeSubscription = async (planType: 'basic' | 'pro' | 'advance') => {
    if (!user || !currentSubscription) return;
    
    setIsLoading(true);
    try {
      const plan = subscriptionPlans.find(p => p.planType === planType);
      if (!plan) throw new Error('Plan not found');

      // Update current subscription to new plan
      await SubscriptionService.updateSubscription(currentSubscription.id, {
        planType,
        maxSystems: plan.maxSystems,
        maxPhones: plan.maxPhones,
        features: plan.features
      });

      const updatedSubscription = {
        ...currentSubscription,
        planType,
        maxSystems: plan.maxSystems,
        maxPhones: plan.maxPhones,
        features: plan.features
      };

      setCurrentSubscription(updatedSubscription);
      
      addNotification({
        title: 'Plan Changed',
        message: `Successfully changed to ${plan.name}. Changes take effect immediately.`,
        type: 'success'
      });
    } catch (err: any) {
      setError('Failed to change plan');
      addNotification({
        title: 'Plan Change Failed',
        message: err.message || 'Failed to change plan. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async (planType: 'basic' | 'pro' | 'advance', email: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const plan = subscriptionPlans.find(p => p.planType === planType);
      if (!plan) throw new Error('Plan not found');

      // Process payment with Paystack
      const payment = await PaystackService.processSubscriptionPayment(
        email,
        plan.monthlyPrice,
        planType,
        user.id,
        user.name
      );

      // Save payment
      await PaystackService.savePayment(payment);
      
      // Refresh subscription data
      await loadSubscriptionData();
      setPaymentHistory([payment, ...paymentHistory]);

      addNotification({
        title: 'Payment Successful',
        message: `Successfully subscribed to ${plan.name}!`,
        type: 'success'
      });
    } catch (err: any) {
      addNotification({
        title: 'Payment Failed',
        message: err.message || 'Payment could not be processed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extendTrial = async (additionalDays: number) => {
    if (!currentSubscription || !user) return;
    
    setIsLoading(true);
    try {
      const newEndDate = new Date(currentSubscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + additionalDays);

      await SubscriptionService.updateSubscription(currentSubscription.id, {
        endDate: newEndDate,
        trialDaysUsed: currentSubscription.trialDaysUsed + additionalDays
      });

      setCurrentSubscription({
        ...currentSubscription,
        endDate: newEndDate,
        trialDaysUsed: currentSubscription.trialDaysUsed + additionalDays
      });

      addNotification({
        title: 'Trial Extended',
        message: `Your trial has been extended by ${additionalDays} days.`,
        type: 'success'
      });
    } catch (err: any) {
      setError('Failed to extend trial');
      addNotification({
        title: 'Extension Failed',
        message: err.message || 'Failed to extend trial. Please contact support.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlanPricing = async (planId: string, updates: Partial<SubscriptionPlan>) => {
    setIsLoading(true);
    try {
      await SubscriptionService.updateSubscriptionPlan(planId, updates);
      
      // Refresh plans
      const updatedPlans = await SubscriptionService.getSubscriptionPlans();
      setSubscriptionPlans(updatedPlans);

      addNotification({
        title: 'Plan Updated',
        message: 'Subscription plan has been updated successfully.',
        type: 'success'
      });
    } catch (err: any) {
      setError('Failed to update plan');
      addNotification({
        title: 'Update Failed',
        message: err.message || 'Failed to update subscription plan.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'adminResponse' | 'status'>) => {
    setIsLoading(true);
    try {
      const complaint = await ComplaintService.submitComplaint(complaintData);
      setUserComplaints([complaint, ...userComplaints]);

      addNotification({
        title: 'Complaint Submitted',
        message: 'Your complaint has been submitted and emailed to our support team. We will respond within 24 hours.',
        type: 'success'
      });
    } catch (err: any) {
      setError('Failed to submit complaint');
      addNotification({
        title: 'Submission Failed',
        message: err.message || 'Failed to submit complaint. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value: SubscriptionContextType = {
    subscriptionPlans,
    currentSubscription,
    isSubscriptionValid,
    daysRemaining,
    updatePlanPricing,
    startTrial,
    upgradeSubscription,
    downgradeSubscription,
    extendTrial,
    processPayment,
    paymentHistory,
    submitComplaint,
    userComplaints,
    isLoading,
    error,
    refreshData
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}