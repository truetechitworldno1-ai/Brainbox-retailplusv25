import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Building,
  DollarSign,
  UserCheck,
  AlertTriangle,
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Employee } from '../types';

export default function EmployeeManagement() {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee
  } = useData();
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('employees');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedPerformanceEmployee, setSelectedPerformanceEmployee] = useState<Employee | null>(null);
  
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    employmentType: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'intern',
    status: 'active' as 'active' | 'inactive' | 'on_leave' | 'terminated',
    salary: 0,
    payPeriod: 'monthly' as 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly',
    role: 'cashier' as 'admin' | 'manager' | 'cashier' | 'inventory_officer',
    permissions: [] as string[]
  });

  const tabs = [
    { id: 'employees', label: 'All Employees', icon: UserCheck },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'rewards', label: 'Reward Activity', icon: Award },
    { id: 'salaries', label: 'Salary Integration', icon: DollarSign }
  ];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddEmployee = () => {
    if (!employeeForm.name.trim() || !employeeForm.employeeId.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Employee name and ID are required',
        type: 'error'
      });
      return;
    }

    const newEmployee: Omit<Employee, 'id'> = {
      ...employeeForm,
      hireDate: new Date(),
      isActive: true,
      permissions: employeeForm.permissions
    };

    addEmployee(newEmployee);
    
    addNotification({
      title: 'Employee Added',
      message: `${employeeForm.name} has been added successfully`,
      type: 'success'
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleEditEmployee = () => {
    if (!selectedEmployee) return;

    updateEmployee(selectedEmployee.id, employeeForm);

    addNotification({
      title: 'Employee Updated',
      message: `${employeeForm.name} has been updated successfully`,
      type: 'success'
    });

    setShowEditModal(false);
    setSelectedEmployee(null);
    resetForm();
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      deleteEmployee(employee.id);
      addNotification({
        title: 'Employee Deleted',
        message: `${employee.name} has been removed`,
        type: 'success'
      });
    }
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      position: employee.position,
      department: employee.department,
      employmentType: employee.employmentType,
      status: employee.status,
      salary: employee.salary,
      payPeriod: employee.payPeriod,
      role: employee.role,
      permissions: employee.permissions
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setEmployeeForm({
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      employmentType: 'full_time',
      status: 'active',
      salary: 0,
      payPeriod: 'monthly',
      role: 'cashier',
      permissions: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'inventory_officer': return 'bg-green-100 text-green-800';
      case 'cashier': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-2 text-gray-600">Manage staff, performance, and salary integration</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
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
          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search employees..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              {/* Employee List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                        <p className="text-xs text-gray-500">ID: {employee.employeeId}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{employee.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{employee.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{employee.department}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">₦{employee.salary.toLocaleString()}/{employee.payPeriod}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                        {employee.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                        {employee.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Add your first employee to get started'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Employee Performance Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => {
                  // Get actual performance data from sales
                  const employeeSales = sales.filter(sale => sale.cashierId === employee.id);
                  const salesCount = employeeSales.length;
                  const totalRevenue = employeeSales.reduce((sum, sale) => sum + sale.total, 0);
                  const avgSale = salesCount > 0 ? totalRevenue / salesCount : 0;
                  const totalItems = employeeSales.reduce((sum, sale) => 
                    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
                  );
                  const performance = salesCount > 30 ? 'Excellent' : salesCount > 15 ? 'Good' : salesCount > 5 ? 'Average' : 'Needs Improvement';
                  
                  return (
                    <div key={employee.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sales Count:</span>
                          <span className="font-medium">{salesCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Revenue:</span>
                          <span className="font-medium">₦{Math.round(totalRevenue).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Items Processed:</span>
                          <span className="font-medium">{totalItems}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Sale:</span>
                          <span className="font-medium">₦{Math.round(avgSale).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Performance:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            performance === 'Excellent' ? 'bg-green-100 text-green-800' :
                            performance === 'Good' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {performance}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Sale:</span>
                          <span className="font-medium text-sm">
                            {employeeSales.length > 0 
                              ? employeeSales[employeeSales.length - 1].timestamp.toLocaleDateString()
                              : 'No sales yet'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setSelectedPerformanceEmployee(employee);
                            setShowPerformanceModal(true);
                          }}
                          className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          View Detailed Performance
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Reward Approval Activity</h3>
              
              <div className="space-y-4">
                {filteredEmployees.map((employee) => {
                  // Get actual reward activity data
                  const rewardActivity = getEmployeeRewardActivity(employee.id);
                  const rewardApprovals = rewardActivity.length;
                  const totalRewardValue = rewardActivity.reduce((sum: number, activity: any) => sum + (activity.amount || 0), 0);
                  
                  return (
                    <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Award className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{employee.name}</h4>
                            <p className="text-sm text-gray-600">{employee.position}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{rewardApprovals} Approvals</p>
                          <p className="text-sm text-purple-600">₦{Math.round(totalRewardValue).toLocaleString()} Value</p>
                        </div>
                      </div>
                      
                      {rewardApprovals > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center p-2 bg-green-50 rounded">
                            <p className="text-green-600">This Week</p>
                            <p className="font-bold">{Math.max(1, Math.floor(rewardApprovals * 0.3))}</p>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <p className="text-blue-600">This Month</p>
                            <p className="font-bold">{rewardApprovals}</p>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <p className="text-purple-600">Avg Value</p>
                            <p className="font-bold">₦{Math.round(totalRewardValue / Math.max(rewardApprovals, 1)).toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Salaries Tab */}
          {activeTab === 'salaries' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Salary System Integration</h3>
              
              <div className="space-y-4">
                {filteredEmployees.map((employee) => {
                  const monthlySalary = employee.salary;
                  const salaryRecords = getEmployeeSalaryRecords(employee.id);
                  const lastPayment = salaryRecords.length > 0 
                    ? new Date(salaryRecords[salaryRecords.length - 1].payDate)
                    : new Date();
                  const totalPaid = salaryRecords.reduce((sum: number, record: any) => sum + (record.netSalary || 0), 0);
                  
                  return (
                    <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{employee.name}</h4>
                            <p className="text-sm text-gray-600">{employee.position} - {employee.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₦{monthlySalary.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{employee.payPeriod}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-blue-600">Employment</p>
                          <p className="font-medium capitalize">{employee.employmentType.replace('_', ' ')}</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-green-600">Status</p>
                          <p className="font-medium capitalize">{employee.status}</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="text-purple-600">Last Payment</p>
                          <p className="font-medium">{lastPayment.toLocaleDateString()}</p>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <p className="text-orange-600">Total Paid</p>
                          <p className="font-medium">₦{Math.round(totalPaid).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex space-x-2">
                        <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium">
                          Salary History ({salaryRecords.length})
                        </button>
                        <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                          Add Salary Record
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Employee</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                  <input
                    type="text"
                    value={employeeForm.employeeId}
                    onChange={(e) => setEmployeeForm({...employeeForm, employeeId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="EMP001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+234-xxx-xxx-xxxx"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cashier, Manager, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    <option value="Operations">Operations</option>
                    <option value="Management">Management</option>
                    <option value="Sales">Sales</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Customer Service">Customer Service</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    value={employeeForm.employmentType}
                    onChange={(e) => setEmployeeForm({...employeeForm, employmentType: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({...employeeForm, role: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="inventory_officer">Inventory Officer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary (₦)</label>
                  <input
                    type="number"
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm({...employeeForm, salary: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="80000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pay Period</label>
                  <select
                    value={employeeForm.payPeriod}
                    onChange={(e) => setEmployeeForm({...employeeForm, payPeriod: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={employeeForm.address}
                    onChange={(e) => setEmployeeForm({...employeeForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Employee address"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmployee}
                  disabled={!employeeForm.name.trim() || !employeeForm.employeeId.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Add Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Employee</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={employeeForm.employeeId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={employeeForm.status}
                    onChange={(e) => setEmployeeForm({...employeeForm, status: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary (₦)</label>
                  <input
                    type="number"
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm({...employeeForm, salary: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({...employeeForm, role: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="inventory_officer">Inventory Officer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditEmployee}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Details Modal */}
      {showPerformanceModal && selectedPerformanceEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Performance Details - {selectedPerformanceEmployee.name}
              </h3>
              
              {(() => {
                const employeeSales = sales.filter(sale => sale.cashierId === selectedPerformanceEmployee.id);
                const salesCount = employeeSales.length;
                const totalRevenue = employeeSales.reduce((sum, sale) => sum + sale.total, 0);
                const totalItems = employeeSales.reduce((sum, sale) => 
                  sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
                );
                
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-900">{salesCount}</p>
                        <p className="text-sm text-blue-600">Total Sales</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-900">₦{Math.round(totalRevenue).toLocaleString()}</p>
                        <p className="text-sm text-green-600">Revenue</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-900">{totalItems}</p>
                        <p className="text-sm text-purple-600">Items Sold</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-900">₦{salesCount > 0 ? Math.round(totalRevenue / salesCount).toLocaleString() : '0'}</p>
                        <p className="text-sm text-orange-600">Avg Sale</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900">Recent Sales</h4>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {employeeSales.slice(0, 10).map((sale) => (
                          <div key={sale.id} className="p-4 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Receipt #{sale.receiptNumber}</p>
                                <p className="text-sm text-gray-600">{sale.items.length} items</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">₦{sale.total.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">{sale.timestamp.toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPerformanceModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}