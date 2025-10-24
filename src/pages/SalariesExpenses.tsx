import React, { useState } from 'react';
import { 
  DollarSign, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Building, 
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Search,
  Download
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export default function SalariesExpenses() {
  const { employees } = useData();
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState('salaries');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSalaryModal, setShowAddSalaryModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  
  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    baseSalary: 0,
    overtimeHours: 0,
    overtimeRate: 1500,
    payPeriod: 'monthly' as 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly',
    paymentMethod: 'bank_transfer' as 'cash' | 'bank_transfer' | 'check' | 'mobile_money',
    notes: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    categoryName: '',
    description: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'mobile_money',
    vendorName: '',
    receiptNumber: '',
    notes: ''
  });

  const tabs = [
    { id: 'salaries', label: 'Salary Management', icon: DollarSign },
    { id: 'expenses', label: 'Business Expenses', icon: CreditCard },
    { id: 'reports', label: 'Financial Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Building }
  ];

  // Mock salary records for demonstration
  const salaryRecords = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'System Administrator',
      baseSalary: 150000,
      grossSalary: 165000,
      netSalary: 140000,
      payDate: new Date(),
      status: 'paid',
      paymentMethod: 'bank_transfer'
    }
  ];

  // Mock expense records for demonstration
  const expenseRecords = [
    {
      id: '1',
      categoryName: 'Utilities',
      description: 'Monthly electricity bill',
      amount: 25000,
      expenseDate: new Date(),
      paymentMethod: 'bank_transfer',
      status: 'paid',
      createdBy: user?.name || 'System'
    },
    {
      id: '2',
      categoryName: 'Rent',
      description: 'Office rent payment',
      amount: 150000,
      expenseDate: new Date(),
      paymentMethod: 'bank_transfer',
      status: 'paid',
      createdBy: user?.name || 'System'
    }
  ];

  const handleAddSalary = () => {
    if (!salaryForm.employeeId || salaryForm.baseSalary <= 0) {
      addNotification({
        title: 'Validation Error',
        message: 'Please select employee and enter valid salary amount',
        type: 'error'
      });
      return;
    }

    addNotification({
      title: 'Salary Record Created',
      message: `Salary record for ${employees.find(e => e.id === salaryForm.employeeId)?.name} created successfully`,
      type: 'success'
    });

    setShowAddSalaryModal(false);
    resetSalaryForm();
  };

  const handleAddExpense = () => {
    if (!expenseForm.description.trim() || expenseForm.amount <= 0) {
      addNotification({
        title: 'Validation Error',
        message: 'Please enter description and valid amount',
        type: 'error'
      });
      return;
    }

    addNotification({
      title: 'Expense Added',
      message: `Expense of ₦${expenseForm.amount.toLocaleString()} added successfully`,
      type: 'success'
    });

    setShowAddExpenseModal(false);
    resetExpenseForm();
  };

  const resetSalaryForm = () => {
    setSalaryForm({
      employeeId: '',
      baseSalary: 0,
      overtimeHours: 0,
      overtimeRate: 1500,
      payPeriod: 'monthly',
      paymentMethod: 'bank_transfer',
      notes: ''
    });
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      categoryName: '',
      description: '',
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      vendorName: '',
      receiptNumber: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salaries & Expenses</h1>
          <p className="mt-2 text-gray-600">Manage employee salaries and business expenses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddSalaryModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Salary</span>
          </button>
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Salaries Tab */}
          {activeTab === 'salaries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Employee Salaries</h3>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                    <Download className="h-4 w-4 inline mr-1" />
                    Export
                  </button>
                </div>
              </div>

              {/* Salary Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total Employees</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{employees.length}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Total Salaries</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    ₦{employees.reduce((sum, emp) => sum + emp.salary, 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Paid This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{salaryRecords.filter(s => s.status === 'paid').length}</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 mt-1">{salaryRecords.filter(s => s.status === 'pending').length}</p>
                </div>
              </div>

              {/* Salary Records Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Salary Records</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Employee</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Base Salary</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Gross Salary</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Net Salary</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Pay Date</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryRecords.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{record.employeeName}</td>
                          <td className="py-3 px-4 text-right text-gray-900">₦{record.baseSalary.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-900">₦{record.grossSalary.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">₦{record.netSalary.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600">{record.payDate.toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center space-x-1">
                              <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                <Edit className="h-3 w-3" />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Business Expenses</h3>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                    <Download className="h-4 w-4 inline mr-1" />
                    Export
                  </button>
                </div>
              </div>

              {/* Expense Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Total Expenses</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    ₦{expenseRecords.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{expenseRecords.length}</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">0</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Average</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    ₦{Math.round(expenseRecords.reduce((sum, exp) => sum + exp.amount, 0) / Math.max(expenseRecords.length, 1)).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Expense Records Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Expense Records</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Method</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseRecords.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900">{record.expenseDate.toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-gray-900">{record.categoryName}</td>
                          <td className="py-3 px-4 text-gray-600">{record.description}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">₦{record.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600 capitalize">{record.paymentMethod.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center space-x-1">
                              <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                <Edit className="h-3 w-3" />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Financial Reports</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Payroll Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Employees:</span>
                      <span className="font-medium">{employees.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Payroll:</span>
                      <span className="font-medium">₦{employees.reduce((sum, emp) => sum + emp.salary, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Salary:</span>
                      <span className="font-medium">₦{Math.round(employees.reduce((sum, emp) => sum + emp.salary, 0) / Math.max(employees.length, 1)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Expense Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Expenses:</span>
                      <span className="font-medium">₦{expenseRecords.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Month:</span>
                      <span className="font-medium">{expenseRecords.length} transactions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-medium">₦{Math.round(expenseRecords.reduce((sum, exp) => sum + exp.amount, 0) / Math.max(expenseRecords.length, 1)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Salary & Expense Settings</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Default Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Pay Period</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="monthly">Monthly</option>
                      <option value="bi_weekly">Bi-Weekly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overtime Rate (₦/hour)</label>
                    <input
                      type="number"
                      defaultValue={1500}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Salary Modal */}
      {showAddSalaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Salary Record</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee *</label>
                  <select
                    value={salaryForm.employeeId}
                    onChange={(e) => setSalaryForm({...salaryForm, employeeId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Salary (₦) *</label>
                    <input
                      type="number"
                      value={salaryForm.baseSalary}
                      onChange={(e) => setSalaryForm({...salaryForm, baseSalary: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="80000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pay Period</label>
                    <select
                      value={salaryForm.payPeriod}
                      onChange={(e) => setSalaryForm({...salaryForm, payPeriod: e.target.value as any})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi_weekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={salaryForm.paymentMethod}
                    onChange={(e) => setSalaryForm({...salaryForm, paymentMethod: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={salaryForm.notes}
                    onChange={(e) => setSalaryForm({...salaryForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddSalaryModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSalary}
                  disabled={!salaryForm.employeeId || salaryForm.baseSalary <= 0}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Add Salary Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Business Expense</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      value={expenseForm.categoryName}
                      onChange={(e) => setExpenseForm({...expenseForm, categoryName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Supplies">Office Supplies</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Travel">Travel</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₦) *</label>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="25000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of expense"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expense Date</label>
                    <input
                      type="date"
                      value={expenseForm.expenseDate}
                      onChange={(e) => setExpenseForm({...expenseForm, expenseDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      value={expenseForm.paymentMethod}
                      onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value as any})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="check">Check</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about this expense..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={!expenseForm.description.trim() || expenseForm.amount <= 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}