import { supabase } from '../lib/supabase';
import { AccountingReport, Sale, Product, User } from '../types';

class AccountingService {
  private reports: AccountingReport[] = [];

  async generateProfitLossReport(startDate: string, endDate: string, userId: string): Promise<AccountingReport> {
    try {
      // Get sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .gte('createdAt', startDate)
        .lte('createdAt', endDate);

      if (salesError) throw salesError;

      // Calculate revenue and costs
      const revenue = sales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
      const cost = sales?.reduce((sum, sale) => sum + (sale.items?.reduce((itemSum: number, item: any) => itemSum + (item.cost * item.quantity), 0) || 0), 0) || 0;
      const grossProfit = revenue - cost;

      // Get expenses (this would come from an expenses table in real implementation)
      const expenses = 50000; // Mock data
      const netProfit = grossProfit - expenses;

      const reportData = {
        revenue,
        cost,
        grossProfit,
        expenses,
        netProfit,
        grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0
      };

      const report: AccountingReport = {
        id: crypto.randomUUID(),
        type: 'profit_loss',
        title: `Profit & Loss Report (${startDate} to ${endDate})`,
        dateRange: { start: startDate, end: endDate },
        data: reportData,
        generatedBy: userId,
        generatedAt: new Date().toISOString(),
        accessLevel: ['accountant', 'supervisor', 'auditor', 'manager']
      };

      return report;
    } catch (error) {
      console.warn('Using mock P&L data:', error);
      return this.generateMockProfitLossReport(startDate, endDate, userId);
    }
  }

  async generateBalanceSheetReport(date: string, userId: string): Promise<AccountingReport> {
    const reportData = {
      assets: {
        currentAssets: {
          cash: 150000,
          inventory: 500000,
          accountsReceivable: 75000,
          total: 725000
        },
        fixedAssets: {
          equipment: 200000,
          furniture: 50000,
          total: 250000
        },
        totalAssets: 975000
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: 125000,
          shortTermLoans: 50000,
          total: 175000
        },
        longTermLiabilities: {
          longTermLoans: 100000,
          total: 100000
        },
        totalLiabilities: 275000
      },
      equity: {
        ownersEquity: 700000,
        totalEquity: 700000
      }
    };

    const report: AccountingReport = {
      id: crypto.randomUUID(),
      type: 'balance_sheet',
      title: `Balance Sheet as of ${date}`,
      dateRange: { start: date, end: date },
      data: reportData,
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      accessLevel: ['accountant', 'supervisor', 'auditor', 'manager']
    };

    return report;
  }

  async generateCashFlowReport(startDate: string, endDate: string, userId: string): Promise<AccountingReport> {
    const reportData = {
      operatingActivities: {
        netIncome: 125000,
        depreciation: 10000,
        accountsReceivableChange: -15000,
        inventoryChange: -25000,
        accountsPayableChange: 20000,
        netCashFromOperations: 115000
      },
      investingActivities: {
        equipmentPurchases: -30000,
        netCashFromInvesting: -30000
      },
      financingActivities: {
        loanProceeds: 50000,
        loanRepayments: -20000,
        netCashFromFinancing: 30000
      },
      netCashFlow: 115000,
      beginningCash: 35000,
      endingCash: 150000
    };

    const report: AccountingReport = {
      id: crypto.randomUUID(),
      type: 'cash_flow',
      title: `Cash Flow Statement (${startDate} to ${endDate})`,
      dateRange: { start: startDate, end: endDate },
      data: reportData,
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      accessLevel: ['accountant', 'supervisor', 'auditor', 'manager']
    };

    return report;
  }

  async generateExpenseReport(startDate: string, endDate: string, userId: string): Promise<AccountingReport> {
    const reportData = {
      categories: [
        { name: 'Rent', amount: 25000, percentage: 50 },
        { name: 'Utilities', amount: 8000, percentage: 16 },
        { name: 'Salaries', amount: 12000, percentage: 24 },
        { name: 'Marketing', amount: 3000, percentage: 6 },
        { name: 'Other', amount: 2000, percentage: 4 }
      ],
      totalExpenses: 50000,
      averageMonthlyExpense: 16667
    };

    const report: AccountingReport = {
      id: crypto.randomUUID(),
      type: 'expense_report',
      title: `Expense Report (${startDate} to ${endDate})`,
      dateRange: { start: startDate, end: endDate },
      data: reportData,
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      accessLevel: ['accountant', 'supervisor', 'auditor', 'manager']
    };

    return report;
  }

  private generateMockProfitLossReport(startDate: string, endDate: string, userId: string): AccountingReport {
    const reportData = {
      revenue: 250000,
      cost: 150000,
      grossProfit: 100000,
      expenses: 50000,
      netProfit: 50000,
      grossMargin: 40,
      netMargin: 20
    };

    return {
      id: crypto.randomUUID(),
      type: 'profit_loss',
      title: `Profit & Loss Report (${startDate} to ${endDate})`,
      dateRange: { start: startDate, end: endDate },
      data: reportData,
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      accessLevel: ['accountant', 'supervisor', 'auditor', 'manager']
    };
  }

  canAccessReport(userRole: string, report: AccountingReport): boolean {
    return report.accessLevel.includes(userRole as any);
  }
}

export const accountingService = new AccountingService();