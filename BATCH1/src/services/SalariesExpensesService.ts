import { SalaryRecord, ExpenseRecord, ExpenseCategory, SalaryTemplate, ExpenseBudget, PayrollSummary, ExpenseSummary, FinancialReport } from '../types';

export class SalariesExpensesService {
  // Salary Management
  static async createSalaryRecord(salaryData: Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalaryRecord> {
    const newSalary: SalaryRecord = {
      ...salaryData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingSalaries = this.getSalaryRecords();
    const updatedSalaries = [...existingSalaries, newSalary];
    localStorage.setItem('brainbox_salary_records', JSON.stringify(updatedSalaries));

    return newSalary;
  }

  static getSalaryRecords(): SalaryRecord[] {
    const saved = localStorage.getItem('brainbox_salary_records');
    if (saved) {
      return JSON.parse(saved).map((s: any) => ({
        ...s,
        payDate: new Date(s.payDate),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt)
      }));
    }
    return [];
  }

  static updateSalaryRecord(id: string, updates: Partial<SalaryRecord>): void {
    const salaries = this.getSalaryRecords();
    const updatedSalaries = salaries.map(salary =>
      salary.id === id ? { ...salary, ...updates, updatedAt: new Date() } : salary
    );
    localStorage.setItem('brainbox_salary_records', JSON.stringify(updatedSalaries));
  }

  static deleteSalaryRecord(id: string): void {
    const salaries = this.getSalaryRecords();
    const updatedSalaries = salaries.filter(salary => salary.id !== id);
    localStorage.setItem('brainbox_salary_records', JSON.stringify(updatedSalaries));
  }

  // Expense Management
  static async createExpenseRecord(expenseData: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExpenseRecord> {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingExpenses = this.getExpenseRecords();
    const updatedExpenses = [...existingExpenses, newExpense];
    localStorage.setItem('brainbox_expense_records', JSON.stringify(updatedExpenses));

    return newExpense;
  }

  static getExpenseRecords(): ExpenseRecord[] {
    const saved = localStorage.getItem('brainbox_expense_records');
    if (saved) {
      return JSON.parse(saved).map((e: any) => ({
        ...e,
        expenseDate: new Date(e.expenseDate),
        nextDueDate: e.nextDueDate ? new Date(e.nextDueDate) : undefined,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt)
      }));
    }
    return [];
  }

  static updateExpenseRecord(id: string, updates: Partial<ExpenseRecord>): void {
    const expenses = this.getExpenseRecords();
    const updatedExpenses = expenses.map(expense =>
      expense.id === id ? { ...expense, ...updates, updatedAt: new Date() } : expense
    );
    localStorage.setItem('brainbox_expense_records', JSON.stringify(updatedExpenses));
  }

  static deleteExpenseRecord(id: string): void {
    const expenses = this.getExpenseRecords();
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('brainbox_expense_records', JSON.stringify(updatedExpenses));
  }

  // Category Management
  static getExpenseCategories(): ExpenseCategory[] {
    const saved = localStorage.getItem('brainbox_expense_categories');
    if (saved) {
      return JSON.parse(saved).map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt)
      }));
    }
    return [];
  }

  static addExpenseCategory(category: Omit<ExpenseCategory, 'id' | 'createdAt'>): ExpenseCategory {
    const newCategory: ExpenseCategory = {
      ...category,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };

    const categories = this.getExpenseCategories();
    const updatedCategories = [...categories, newCategory];
    localStorage.setItem('brainbox_expense_categories', JSON.stringify(updatedCategories));

    return newCategory;
  }

  // Payroll Summary
  static generatePayrollSummary(storeId?: string, period?: string): PayrollSummary {
    const salaries = this.getSalaryRecords();
    const filteredSalaries = storeId ? salaries.filter(s => s.storeId === storeId) : salaries;

    return {
      storeId,
      storeName: storeId ? 'Store Name' : undefined,
      totalEmployees: new Set(filteredSalaries.map(s => s.employeeId)).size,
      totalBaseSalary: filteredSalaries.reduce((sum, s) => sum + s.baseSalary, 0),
      totalAllowances: filteredSalaries.reduce((sum, s) => sum + s.allowances.reduce((a, b) => a + b.amount, 0), 0),
      totalDeductions: filteredSalaries.reduce((sum, s) => sum + s.deductions.reduce((a, b) => a + b.amount, 0), 0),
      totalBonuses: filteredSalaries.reduce((sum, s) => sum + s.bonuses.reduce((a, b) => a + b.amount, 0), 0),
      totalGrossSalary: filteredSalaries.reduce((sum, s) => sum + s.grossSalary, 0),
      totalNetSalary: filteredSalaries.reduce((sum, s) => sum + s.netSalary, 0),
      period: period || 'Current Period'
    };
  }

  // Expense Summary
  static generateExpenseSummary(storeId?: string, period?: string): ExpenseSummary {
    const expenses = this.getExpenseRecords();
    const categories = this.getExpenseCategories();
    const filteredExpenses = storeId ? expenses.filter(e => e.storeId === storeId) : expenses;

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesByCategory = categories.map(category => {
      const categoryExpenses = filteredExpenses.filter(e => e.categoryId === category.id);
      const amount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        categoryName: category.name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      };
    });

    return {
      storeId,
      storeName: storeId ? 'Store Name' : undefined,
      totalExpenses,
      expensesByCategory,
      budgetUtilization: 0, // Would calculate based on budgets
      period: period || 'Current Period'
    };
  }

  // Financial Reports
  static generateFinancialReport(
    type: 'payroll' | 'expenses' | 'combined',
    startDate: Date,
    endDate: Date,
    storeId?: string,
    generatedBy: string = 'system'
  ): FinancialReport {
    const salaries = this.getSalaryRecords().filter(s => 
      s.payDate >= startDate && s.payDate <= endDate &&
      (!storeId || s.storeId === storeId)
    );

    const expenses = this.getExpenseRecords().filter(e => 
      e.expenseDate >= startDate && e.expenseDate <= endDate &&
      (!storeId || e.storeId === storeId)
    );

    let data: any = {};

    switch (type) {
      case 'payroll':
        data = this.generatePayrollSummary(storeId, `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
        break;
      case 'expenses':
        data = this.generateExpenseSummary(storeId, `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
        break;
      case 'combined':
        data = {
          payroll: this.generatePayrollSummary(storeId),
          expenses: this.generateExpenseSummary(storeId),
          totalCosts: salaries.reduce((sum, s) => sum + s.netSalary, 0) + expenses.reduce((sum, e) => sum + e.amount, 0)
        };
        break;
    }

    return {
      id: crypto.randomUUID(),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
      period: { start: startDate, end: endDate },
      storeId,
      storeName: storeId ? 'Store Name' : undefined,
      data,
      generatedBy,
      generatedAt: new Date(),
      format: 'pdf'
    };
  }

  // Budget Management
  static createExpenseBudget(budgetData: Omit<ExpenseBudget, 'id' | 'createdAt'>): ExpenseBudget {
    const newBudget: ExpenseBudget = {
      ...budgetData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };

    const budgets = this.getExpenseBudgets();
    const updatedBudgets = [...budgets, newBudget];
    localStorage.setItem('brainbox_expense_budgets', JSON.stringify(updatedBudgets));

    return newBudget;
  }

  static getExpenseBudgets(): ExpenseBudget[] {
    const saved = localStorage.getItem('brainbox_expense_budgets');
    if (saved) {
      return JSON.parse(saved).map((b: any) => ({
        ...b,
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        createdAt: new Date(b.createdAt)
      }));
    }
    return [];
  }

  // Export Functions
  static exportSalariesExpensesToExcel(
    salaries: SalaryRecord[],
    expenses: ExpenseRecord[],
    period: string,
    storeFilter: string
  ): string {
    let csvContent = `BRAINBOX RETAILPLUS - COMPREHENSIVE FINANCIAL REPORT\n`;
    csvContent += `${'='.repeat(60)}\n`;
    csvContent += `Period: ${period}\n`;
    csvContent += `Store Filter: ${storeFilter}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Payroll Section
    csvContent += `PAYROLL SUMMARY\n`;
    csvContent += `===============\n`;
    csvContent += `Employee Name,Store,Base Salary,Allowances,Deductions,Bonuses,Overtime,Gross Salary,Net Salary,Pay Date,Status\n`;
    salaries.forEach(salary => {
      const allowancesTotal = salary.allowances.reduce((sum, a) => sum + a.amount, 0);
      const deductionsTotal = salary.deductions.reduce((sum, d) => sum + d.amount, 0);
      const bonusesTotal = salary.bonuses.reduce((sum, b) => sum + b.amount, 0);
      const overtimeTotal = salary.overtimeHours * salary.overtimeRate;
      
      csvContent += `"${salary.employeeName}","${salary.storeName || 'Company Wide'}",${salary.baseSalary},${allowancesTotal},${deductionsTotal},${bonusesTotal},${overtimeTotal},${salary.grossSalary},${salary.netSalary},"${salary.payDate.toLocaleDateString()}","${salary.status}"\n`;
    });

    csvContent += `\nEXPENSE SUMMARY\n`;
    csvContent += `===============\n`;
    csvContent += `Date,Category,Subcategory,Description,Amount,Store,Payment Method,Receipt,Status,Created By\n`;
    expenses.forEach(expense => {
      csvContent += `"${expense.expenseDate.toLocaleDateString()}","${expense.categoryName}","${expense.subcategory || 'N/A'}","${expense.description}",${expense.amount},"${expense.storeName || 'Company Wide'}","${expense.paymentMethod}","${expense.receiptNumber || 'N/A'}","${expense.status}","${expense.createdBy}"\n`;
    });

    // Totals
    const totalSalaries = salaries.reduce((sum, s) => sum + s.netSalary, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grandTotal = totalSalaries + totalExpenses;

    csvContent += `\nFINANCIAL TOTALS\n`;
    csvContent += `================\n`;
    csvContent += `Total Staff Costs,${totalSalaries}\n`;
    csvContent += `Total Business Expenses,${totalExpenses}\n`;
    csvContent += `Grand Total Costs,${grandTotal}\n\n`;

    csvContent += `Report generated by BrainBox-RetailPlus V25\n`;
    csvContent += `© 2025 Technology Innovation Worldwide (TIW)\n`;

    return csvContent;
  }

  // Accounting Integration
  static getAccountingData(startDate: Date, endDate: Date, storeId?: string): {
    totalSalaryCosts: number;
    totalExpenses: number;
    expensesByCategory: { category: string; amount: number }[];
    salaryBreakdown: { employee: string; amount: number }[];
  } {
    const salaries = this.getSalaryRecords().filter(s => 
      s.payDate >= startDate && s.payDate <= endDate &&
      (!storeId || s.storeId === storeId)
    );

    const expenses = this.getExpenseRecords().filter(e => 
      e.expenseDate >= startDate && e.expenseDate <= endDate &&
      (!storeId || e.storeId === storeId)
    );

    const categories = this.getExpenseCategories();

    return {
      totalSalaryCosts: salaries.reduce((sum, s) => sum + s.netSalary, 0),
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      expensesByCategory: categories.map(category => ({
        category: category.name,
        amount: expenses.filter(e => e.categoryId === category.id).reduce((sum, e) => sum + e.amount, 0)
      })),
      salaryBreakdown: salaries.map(salary => ({
        employee: salary.employeeName,
        amount: salary.netSalary
      }))
    };
  }

  // Multi-Store Analytics
  static getMultiStoreAnalytics(storeIds: string[]): {
    storeComparison: { storeId: string; storeName: string; totalSalaries: number; totalExpenses: number; totalCosts: number }[];
    companyTotals: { totalSalaries: number; totalExpenses: number; totalCosts: number };
  } {
    const salaries = this.getSalaryRecords();
    const expenses = this.getExpenseRecords();

    const storeComparison = storeIds.map(storeId => {
      const storeSalaries = salaries.filter(s => s.storeId === storeId);
      const storeExpenses = expenses.filter(e => e.storeId === storeId);
      
      const totalSalaries = storeSalaries.reduce((sum, s) => sum + s.netSalary, 0);
      const totalExpenses = storeExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      return {
        storeId,
        storeName: storeSalaries[0]?.storeName || storeExpenses[0]?.storeName || 'Unknown Store',
        totalSalaries,
        totalExpenses,
        totalCosts: totalSalaries + totalExpenses
      };
    });

    const companyTotals = {
      totalSalaries: salaries.reduce((sum, s) => sum + s.netSalary, 0),
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalCosts: salaries.reduce((sum, s) => sum + s.netSalary, 0) + expenses.reduce((sum, e) => sum + e.amount, 0)
    };

    return { storeComparison, companyTotals };
  }

  // Recurring Expenses Management
  static processRecurringExpenses(): ExpenseRecord[] {
    const expenses = this.getExpenseRecords();
    const recurringExpenses = expenses.filter(e => e.isRecurring && e.nextDueDate && e.nextDueDate <= new Date());
    const newExpenses: ExpenseRecord[] = [];

    recurringExpenses.forEach(expense => {
      const newExpense: ExpenseRecord = {
        ...expense,
        id: crypto.randomUUID(),
        expenseDate: new Date(),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Calculate next due date
      const nextDue = new Date(expense.nextDueDate!);
      switch (expense.recurringFrequency) {
        case 'weekly':
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case 'monthly':
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case 'quarterly':
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case 'yearly':
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
      }
      newExpense.nextDueDate = nextDue;

      newExpenses.push(newExpense);
    });

    if (newExpenses.length > 0) {
      const allExpenses = [...expenses, ...newExpenses];
      localStorage.setItem('brainbox_expense_records', JSON.stringify(allExpenses));
    }

    return newExpenses;
  }

  // Budget Tracking
  static checkBudgetAlerts(categoryId: string, storeId?: string): {
    isOverBudget: boolean;
    utilizationPercentage: number;
    remainingBudget: number;
  } {
    const budgets = this.getExpenseBudgets();
    const expenses = this.getExpenseRecords();

    const budget = budgets.find(b => 
      b.categoryId === categoryId && 
      (!storeId || b.storeId === storeId) &&
      b.isActive
    );

    if (!budget) {
      return { isOverBudget: false, utilizationPercentage: 0, remainingBudget: 0 };
    }

    const categoryExpenses = expenses.filter(e => 
      e.categoryId === categoryId &&
      (!storeId || e.storeId === storeId) &&
      e.expenseDate >= budget.startDate &&
      e.expenseDate <= budget.endDate
    );

    const spentAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const utilizationPercentage = (spentAmount / budget.budgetAmount) * 100;
    const remainingBudget = budget.budgetAmount - spentAmount;

    return {
      isOverBudget: spentAmount > budget.budgetAmount,
      utilizationPercentage,
      remainingBudget
    };
  }

  // Advanced Analytics
  static getAdvancedAnalytics(startDate: Date, endDate: Date): {
    salaryTrends: { month: string; amount: number }[];
    expenseTrends: { month: string; amount: number }[];
    costPerEmployee: number;
    expenseGrowthRate: number;
    salaryGrowthRate: number;
    topExpenseCategories: { category: string; amount: number; percentage: number }[];
  } {
    const salaries = this.getSalaryRecords().filter(s => s.payDate >= startDate && s.payDate <= endDate);
    const expenses = this.getExpenseRecords().filter(e => e.expenseDate >= startDate && e.expenseDate <= endDate);
    const categories = this.getExpenseCategories();

    // Calculate trends (simplified)
    const salaryTrends = this.calculateMonthlyTrends(salaries, 'payDate', 'netSalary');
    const expenseTrends = this.calculateMonthlyTrends(expenses, 'expenseDate', 'amount');

    const totalSalaries = salaries.reduce((sum, s) => sum + s.netSalary, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const uniqueEmployees = new Set(salaries.map(s => s.employeeId)).size;

    const topExpenseCategories = categories.map(category => {
      const categoryExpenses = expenses.filter(e => e.categoryId === category.id);
      const amount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        category: category.name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      };
    }).sort((a, b) => b.amount - a.amount).slice(0, 5);

    return {
      salaryTrends,
      expenseTrends,
      costPerEmployee: uniqueEmployees > 0 ? totalSalaries / uniqueEmployees : 0,
      expenseGrowthRate: 0, // Would calculate based on historical data
      salaryGrowthRate: 0, // Would calculate based on historical data
      topExpenseCategories
    };
  }

  private static calculateMonthlyTrends(records: any[], dateField: string, amountField: string): { month: string; amount: number }[] {
    const monthlyData = new Map<string, number>();

    records.forEach(record => {
      const date = new Date(record[dateField]);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const currentAmount = monthlyData.get(monthKey) || 0;
      monthlyData.set(monthKey, currentAmount + record[amountField]);
    });

    return Array.from(monthlyData.entries()).map(([month, amount]) => ({
      month,
      amount
    })).sort((a, b) => a.month.localeCompare(b.month));
  }
}