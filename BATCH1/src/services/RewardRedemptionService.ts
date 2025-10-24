import { Customer, RewardRequest, RewardRedemption, RewardItem, Sale, SaleWithRewards } from '../types';
import { CustomerMessagingService } from './CustomerMessagingService';

export class RewardRedemptionService {
  private static rewardRequests: RewardRequest[] = [];
  private static rewardRedemptions: RewardRedemption[] = [];

  // Customer requests reward from staff
  static async requestReward(
    customer: Customer,
    requestedBy: string,
    rewardType: 'cash_discount' | 'free_items' | 'percentage_off',
    rewardAmount?: number,
    freeItems?: RewardItem[],
    percentageOff?: number,
    reason: string = ''
  ): Promise<RewardRequest> {
    const rewardRequest: RewardRequest = {
      id: crypto.randomUUID(),
      customerId: customer.id,
      customerName: customer.name,
      requestedBy,
      rewardType,
      rewardAmount,
      freeItems,
      percentageOff,
      reason,
      status: 'pending',
      createdAt: new Date()
    };

    this.rewardRequests.push(rewardRequest);
    this.saveRewardRequests();

    return rewardRequest;
  }

  // Manager/Inventory Officer approves reward and sets amount
  static async approveReward(
    requestId: string,
    approvedBy: string,
    userRole: string,
    finalRewardAmount?: number,
    finalFreeItems?: RewardItem[],
    approvalNotes?: string
  ): Promise<RewardRedemption> {
    // Check authorization
    const authorizedRoles = ['global_admin', 'business_owner', 'manager', 'inventory', 'supervisor'];
    if (!authorizedRoles.includes(userRole)) {
      throw new Error('Unauthorized: Only managers or inventory officers can approve rewards');
    }

    const request = this.rewardRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Reward request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Reward request already processed');
    }

    // Update request status
    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvalNotes = approvalNotes;
    request.approvedAt = new Date();

    // Use final amounts set by manager, or original request amounts
    const rewardAmount = finalRewardAmount || request.rewardAmount || 0;
    const freeItems = finalFreeItems || request.freeItems || [];

    // Create redemption record
    const redemption: RewardRedemption = {
      id: crypto.randomUUID(),
      customerId: request.customerId,
      customerName: request.customerName,
      rewardAmount,
      rewardType: request.rewardType,
      freeItems,
      requestedBy: request.requestedBy,
      approvedBy,
      status: 'approved',
      redemptionSlip: `RWD${Date.now()}`,
      stockDeducted: false,
      notes: approvalNotes,
      createdAt: new Date()
    };

    this.rewardRedemptions.push(redemption);
    this.saveRewardRedemptions();
    this.saveRewardRequests();

    return redemption;
  }

  // Apply reward at cashier before scanning items
  static async applyRewardToSale(
    redemptionSlip: string,
    saleItems: any[],
    updateProductStock: (productId: string, newStock: number) => void
  ): Promise<{ freeItems: RewardItem[]; paidItems: any[]; totalDiscount: number }> {
    const redemption = this.rewardRedemptions.find(r => r.redemptionSlip === redemptionSlip);
    if (!redemption) {
      throw new Error('Invalid redemption slip');
    }

    if (redemption.status !== 'approved') {
      throw new Error('Reward not approved or already used');
    }

    let freeItems: RewardItem[] = [];
    let paidItems = [...saleItems];
    let totalDiscount = 0;

    switch (redemption.rewardType) {
      case 'free_items':
        // Apply free items and deduct from stock
        freeItems = redemption.freeItems || [];
        
        // Deduct stock for free items
        freeItems.forEach(item => {
          // Find current stock and deduct
          const currentProduct = paidItems.find(p => p.productId === item.productId);
          if (currentProduct) {
            updateProductStock(item.productId, currentProduct.stock - item.quantity);
          }
        });
        
        totalDiscount = freeItems.reduce((sum, item) => sum + item.totalValue, 0);
        break;

      case 'cash_discount':
        totalDiscount = redemption.rewardAmount;
        break;

      case 'percentage_off':
        const subtotal = paidItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        totalDiscount = subtotal * ((redemption.rewardAmount || 0) / 100);
        break;
    }

    // Mark redemption as applied
    redemption.status = 'applied';
    redemption.stockDeducted = true;
    this.saveRewardRedemptions();

    return { freeItems, paidItems, totalDiscount };
  }

  // Complete reward after sale is finalized
  static async completeReward(redemptionSlip: string, saleId: string): Promise<void> {
    const redemption = this.rewardRedemptions.find(r => r.redemptionSlip === redemptionSlip);
    if (!redemption) return;

    redemption.status = 'completed';
    redemption.appliedToSale = saleId;
    redemption.completedAt = new Date();
    this.saveRewardRedemptions();

    // Notify business owner
    await this.notifyBusinessOwner(redemption);
  }

  // Get pending reward requests for approval
  static getPendingRewardRequests(): RewardRequest[] {
    return this.rewardRequests.filter(r => r.status === 'pending');
  }

  // Get approved rewards ready for cashier
  static getApprovedRewards(): RewardRedemption[] {
    return this.rewardRedemptions.filter(r => r.status === 'approved');
  }

  // Get reward by slip number
  static getRewardBySlip(redemptionSlip: string): RewardRedemption | null {
    return this.rewardRedemptions.find(r => r.redemptionSlip === redemptionSlip) || null;
  }

  // Generate reward reports
  static generateRewardReport(startDate: Date, endDate: Date): {
    totalRewards: number;
    totalValue: number;
    byType: Record<string, { count: number; value: number }>;
    byApprover: Record<string, { count: number; value: number }>;
    stockImpact: { productId: string; productName: string; quantityGiven: number; value: number }[];
  } {
    const filteredRewards = this.rewardRedemptions.filter(r => 
      r.createdAt >= startDate && r.createdAt <= endDate && r.status === 'completed'
    );

    const report = {
      totalRewards: filteredRewards.length,
      totalValue: filteredRewards.reduce((sum, r) => sum + r.rewardAmount, 0),
      byType: {} as Record<string, { count: number; value: number }>,
      byApprover: {} as Record<string, { count: number; value: number }>,
      stockImpact: [] as { productId: string; productName: string; quantityGiven: number; value: number }[]
    };

    // Analyze by type
    filteredRewards.forEach(reward => {
      const type = reward.rewardType;
      if (!report.byType[type]) {
        report.byType[type] = { count: 0, value: 0 };
      }
      report.byType[type].count += 1;
      report.byType[type].value += reward.rewardAmount;

      // Analyze by approver
      const approver = reward.approvedBy || 'Unknown';
      if (!report.byApprover[approver]) {
        report.byApprover[approver] = { count: 0, value: 0 };
      }
      report.byApprover[approver].count += 1;
      report.byApprover[approver].value += reward.rewardAmount;

      // Stock impact for free items
      if (reward.freeItems) {
        reward.freeItems.forEach(item => {
          const existing = report.stockImpact.find(si => si.productId === item.productId);
          if (existing) {
            existing.quantityGiven += item.quantity;
            existing.value += item.totalValue;
          } else {
            report.stockImpact.push({
              productId: item.productId,
              productName: item.productName,
              quantityGiven: item.quantity,
              value: item.totalValue
            });
          }
        });
      }
    });

    return report;
  }

  // Notify business owner of reward activity
  private static async notifyBusinessOwner(redemption: RewardRedemption): Promise<void> {
    try {
      const message = `🎁 REWARD APPLIED\n\nCustomer: ${redemption.customerName}\nType: ${redemption.rewardType.replace('_', ' ').toUpperCase()}\nValue: ₦${redemption.rewardAmount.toLocaleString()}\nSlip: ${redemption.redemptionSlip}\nApproved by: ${redemption.approvedBy}\nTime: ${new Date().toLocaleString()}\n\nBrainBox-RetailPlus V25`;

      // Send notifications via multiple channels
      console.log('📧 Email notification sent to business owner:', message);
      console.log('📱 WhatsApp notification sent to business owner:', message);
      console.log('📲 SMS notification sent to business owner:', message);
      
      // In production, integrate with actual messaging services
      // await emailService.send(businessOwnerEmail, 'Reward Applied', message);
      // await whatsappService.send(businessOwnerPhone, message);
      // await smsService.send(businessOwnerPhone, message);
      
    } catch (error) {
      console.error('Failed to notify business owner:', error);
    }
  }

  // Check if user can approve rewards
  static canApproveRewards(userRole: string): boolean {
    const authorizedRoles = ['global_admin', 'business_owner', 'manager', 'inventory', 'supervisor'];
    return authorizedRoles.includes(userRole);
  }

  // Save methods
  private static saveRewardRequests(): void {
    localStorage.setItem('reward_requests', JSON.stringify(this.rewardRequests));
  }

  private static saveRewardRedemptions(): void {
    localStorage.setItem('reward_redemptions', JSON.stringify(this.rewardRedemptions));
  }

  // Load methods
  static loadRewardData(): void {
    const savedRequests = localStorage.getItem('reward_requests');
    if (savedRequests) {
      this.rewardRequests = JSON.parse(savedRequests).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        approvedAt: r.approvedAt ? new Date(r.approvedAt) : undefined
      }));
    }

    const savedRedemptions = localStorage.getItem('reward_redemptions');
    if (savedRedemptions) {
      this.rewardRedemptions = JSON.parse(savedRedemptions).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        completedAt: r.completedAt ? new Date(r.completedAt) : undefined
      }));
    }
  }
}

// Initialize service
RewardRedemptionService.loadRewardData();