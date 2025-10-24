import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Star, AlertCircle } from 'lucide-react';
import { supplierService } from '../services/SupplierService';
import { Supplier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

const SupplierManagement: React.FC = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    taxId: '',
    paymentTerms: 'Net 30',
    creditLimit: 0,
    status: 'active' as const,
    rating: 5,
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAllSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, {
          ...formData,
          currentBalance: editingSupplier.currentBalance
        });
      } else {
        await supplierService.createSupplier({
          ...formData,
          currentBalance: 0
        });
      }
      
      await loadSuppliers();
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      country: supplier.country,
      taxId: supplier.taxId || '',
      paymentTerms: supplier.paymentTerms,
      creditLimit: supplier.creditLimit,
      status: supplier.status,
      rating: supplier.rating,
      notes: supplier.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierService.deleteSupplier(id);
        await loadSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'Nigeria',
      taxId: '',
      paymentTerms: 'Net 30',
      creditLimit: 0,
      status: 'active',
      rating: 5,
      notes: ''
    });
    setEditingSupplier(null);
    setShowForm(false);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.name && supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const canAccessFullFeatures = subscription?.plan === 'pro' || subscription?.plan === 'advance';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {!canAccessFullFeatures && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-yellow-800 font-medium">Limited Access</p>
            <p className="text-yellow-700 text-sm">
              Basic plan only shows supplier details. Upgrade to Pro or Advance for full supplier management features.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                <p className="text-sm text-gray-600">{supplier.contactPerson}</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < supplier.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                {supplier.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {supplier.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {supplier.city}, {supplier.state}
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Credit Limit:</span>
                    <span className="font-medium">₦{supplier.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className={`font-medium ${
                      supplier.currentBalance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ₦{supplier.currentBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Terms:</span>
                    <span className="font-medium">{supplier.paymentTerms}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    supplier.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : supplier.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Limit (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    await handleSubmit(e as any);
                    // Keep modal open and reset form for adding another supplier
                    if (!editingSupplier) {
                      setFormData({
                        name: '',
                        contactPerson: '',
                        email: '',
                        phone: '',
                        address: '',
                        city: '',
                        state: '',
                        country: 'Nigeria',
                        taxId: '',
                        paymentTerms: 'Net 30',
                        creditLimit: 0,
                        status: 'active',
                        rating: 5,
                        notes: ''
                      });
                    }
                  }}
                  disabled={!formData.name || !formData.contactPerson || !formData.email || !formData.phone}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add & New</span>
                </button>
                <button
                  type="submit"
                  disabled={!formData.name || !formData.contactPerson || !formData.email || !formData.phone}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSupplier ? 'Update' : 'Save'} Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;