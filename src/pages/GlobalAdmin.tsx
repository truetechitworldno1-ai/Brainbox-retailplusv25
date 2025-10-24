import React, { useState, useEffect } from 'react';
import {
  Users, Building2, TrendingUp, AlertCircle,
  Shield, Edit, Trash2, CheckCircle, XCircle,
  Search, Filter, Download, Plus, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Tenant {
  id: string;
  name: string;
  business_name: string;
  email: string;
  phone: string;
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at: string;
  max_users: number;
  max_products: number;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
}

interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  active_subscriptions: number;
}

export default function GlobalAdmin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'users'>('overview');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<TenantStats>({
    total_tenants: 0,
    active_tenants: 0,
    total_users: 0,
    active_subscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTenants(),
        loadUsers(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tenants:', error);
    } else {
      setTenants(data || []);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
    } else {
      setUsers(data || []);
    }
  };

  const loadStats = async () => {
    const { data: tenantsData } = await supabase
      .from('tenants')
      .select('is_active, subscription_status');

    const { data: usersData } = await supabase
      .from('users')
      .select('id');

    if (tenantsData && usersData) {
      setStats({
        total_tenants: tenantsData.length,
        active_tenants: tenantsData.filter(t => t.is_active).length,
        total_users: usersData.length,
        active_subscriptions: tenantsData.filter(t => t.subscription_status === 'active').length,
      });
    }
  };

  const handleUpdateTenant = async (tenant: Tenant) => {
    const { error } = await supabase
      .from('tenants')
      .update({
        name: tenant.name,
        business_name: tenant.business_name,
        email: tenant.email,
        phone: tenant.phone,
        subscription_tier: tenant.subscription_tier,
        subscription_status: tenant.subscription_status,
        max_users: tenant.max_users,
        max_products: tenant.max_products,
        is_active: tenant.is_active,
      })
      .eq('id', tenant.id);

    if (error) {
      alert('Error updating tenant: ' + error.message);
    } else {
      alert('Tenant updated successfully!');
      setShowEditModal(false);
      loadData();
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone!')) {
      return;
    }

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      alert('Error deleting tenant: ' + error.message);
    } else {
      alert('Tenant deleted successfully!');
      loadData();
    }
  };

  const handleUpdateUser = async (user: User) => {
    const { error } = await supabase
      .from('users')
      .update({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      })
      .eq('id', user.id);

    if (error) {
      alert('Error updating user: ' + error.message);
    } else {
      alert('User updated successfully!');
      setShowUserModal(false);
      loadData();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      alert('Error deleting user: ' + error.message);
    } else {
      alert('User deleted successfully!');
      loadData();
    }
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Global Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            Global Administrator Dashboard
          </h1>
          <p className="text-gray-600 mt-1">System-wide management and monitoring</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tenants</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_tenants}</p>
                </div>
                <Building2 className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tenants</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.active_tenants}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_users}</p>
                </div>
                <Users className="w-12 h-12 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.active_subscriptions}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('tenants')}
                className="p-4 border-2 border-blue-600 rounded-lg hover:bg-blue-50 text-left"
              >
                <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-semibold">Manage Tenants</h3>
                <p className="text-sm text-gray-600">View and edit all tenants</p>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="p-4 border-2 border-purple-600 rounded-lg hover:bg-purple-50 text-left"
              >
                <Users className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold">Manage Users</h3>
                <p className="text-sm text-gray-600">View and edit all users</p>
              </button>

              <button
                onClick={loadData}
                className="p-4 border-2 border-green-600 rounded-lg hover:bg-green-50 text-left"
              >
                <Download className="w-6 h-6 text-green-600 mb-2" />
                <h3 className="font-semibold">Export Data</h3>
                <p className="text-sm text-gray-600">Download reports</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">All Tenants</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{tenant.business_name}</div>
                          <div className="text-sm text-gray-500">{tenant.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{tenant.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {tenant.subscription_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tenant.is_active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">All Users</h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
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

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'tenants'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tenants ({tenants.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {showEditModal && selectedTenant && (
        <TenantEditModal
          tenant={selectedTenant}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateTenant}
        />
      )}

      {showUserModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
          onSave={handleUpdateUser}
        />
      )}
    </div>
  );
}

function TenantEditModal({ tenant, onClose, onSave }: {
  tenant: Tenant;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
}) {
  const [editedTenant, setEditedTenant] = useState(tenant);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Tenant</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Business Name</label>
            <input
              type="text"
              value={editedTenant.business_name}
              onChange={(e) => setEditedTenant({ ...editedTenant, business_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={editedTenant.name}
              onChange={(e) => setEditedTenant({ ...editedTenant, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={editedTenant.email}
              onChange={(e) => setEditedTenant({ ...editedTenant, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              value={editedTenant.phone}
              onChange={(e) => setEditedTenant({ ...editedTenant, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subscription Tier</label>
              <select
                value={editedTenant.subscription_tier}
                onChange={(e) => setEditedTenant({ ...editedTenant, subscription_tier: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={editedTenant.subscription_status}
                onChange={(e) => setEditedTenant({ ...editedTenant, subscription_status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max Users</label>
              <input
                type="number"
                value={editedTenant.max_users}
                onChange={(e) => setEditedTenant({ ...editedTenant, max_users: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Products</label>
              <input
                type="number"
                value={editedTenant.max_products}
                onChange={(e) => setEditedTenant({ ...editedTenant, max_products: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedTenant.is_active}
                onChange={(e) => setEditedTenant({ ...editedTenant, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => onSave(editedTenant)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function UserEditModal({ user, onClose, onSave }: {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}) {
  const [editedUser, setEditedUser] = useState(user);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Edit User</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={editedUser.full_name}
              onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={editedUser.email}
              onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={editedUser.role}
              onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="super_admin">Super Admin</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedUser.is_active}
                onChange={(e) => setEditedUser({ ...editedUser, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => onSave(editedUser)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
