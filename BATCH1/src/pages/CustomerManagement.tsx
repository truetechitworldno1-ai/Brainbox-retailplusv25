import React, { useState } from 'react';
import { Search, Plus, Edit, Gift, Star, MessageSquare, Phone, Mail, Send } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { CustomerMessagingService } from '../services/CustomerMessagingService';
import { useNotification } from '../contexts/NotificationContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Customer } from '../types';

export default function CustomerManagement() {
  const { customers, addCustomer, updateCustomer } = useData();
  const { addNotification } = useNotification();
  const { currentSubscription } = useSubscription();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    rewardPercentage: 2
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    rewardPercentage: 2
  });
  const [rewardForm, setRewardForm] = useState({
    rewardType: 'points' as 'points' | 'discount' | 'free_item',
    pointsToAdd: 0,
    discountAmount: 0,
    reason: ''
  });
  const [messageForm, setMessageForm] = useState({
    message: '',
    type: 'sms' as 'sms' | 'email'
  });

  const filteredCustomers = customers.filter(customer =>
    (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'bg-orange-100 text-orange-800';
      case 'Silver': return 'bg-gray-100 text-gray-800';
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddCustomer = () => {
    if (!formData.name.trim()) return;
    
    addCustomer({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      loyaltyCard: {
        cardNumber: `LC${Date.now()}`,
        points: 0,
        totalSpent: 0,
        rewardPercentage: 2,
        tier: 'bronze',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      totalPurchases: 0,
      lastPurchase: new Date(),
      isActive: true
    });
    
    setFormData({ name: '', email: '', phone: '', address: '' });
    setShowAddModal(false);
  };

  const handleEditCustomer = () => {
    if (!editingCustomer || !editFormData.name.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Customer name is required',
        type: 'error'
      });
      return;
    }

    updateCustomer(editingCustomer.id, {
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      address: editFormData.address
    });

    addNotification({
      title: 'Customer Updated',
      message: `${editFormData.name} has been updated successfully`,
      type: 'success'
    });

    setShowEditModal(false);
    setEditingCustomer(null);
    setEditFormData({ name: '', email: '', phone: '', address: '' });
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      rewardPercentage: customer.loyaltyCard.rewardPercentage || 2
    });
    setShowEditModal(true);
  };

  const handleReward = () => {
    if (!selectedCustomer) return;

    let updatedCustomer = { ...selectedCustomer };

    switch (rewardForm.rewardType) {
      case 'points':
        updatedCustomer.loyaltyCard.points += rewardForm.pointsToAdd;
        break;
      case 'discount':
        // Apply discount logic here
        break;
      case 'free_item':
        // Apply free item logic here
        break;
    }

    updateCustomer(selectedCustomer.id, updatedCustomer);

    addNotification({
      title: 'Reward Applied',
      message: `Reward applied to ${selectedCustomer.name}`,
      type: 'success'
    });

    setShowRewardModal(false);
    setSelectedCustomer(null);
    setRewardForm({
      rewardType: 'points',
      pointsToAdd: 0,
      discountAmount: 0,
      reason: ''
    });
  };

  const openRewardModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowRewardModal(true);
  };

  const sendTestMessage = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setMessageForm({
      message: `Hi ${customer.name}! This is a test message from BrainBox-RetailPlus V25. Your customer messaging system is working perfectly! 📱✅`,
      type: 'sms'
    });
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!selectedCustomer || !messageForm.message.trim()) return;

    try {
      if (messageForm.type === 'sms') {
        if (!selectedCustomer.phone) {
          addNotification({
            title: 'No Phone Number',
            message: 'Customer does not have a phone number',
            type: 'error'
          });
          return;
        }
        
        await CustomerMessagingService.sendSMS(selectedCustomer, messageForm.message);
        addNotification({
          title: 'SMS Sent',
          message: `Message sent to ${selectedCustomer.name} at ${selectedCustomer.phone}`,
          type: 'success'
        });
      } else {
        if (!selectedCustomer.email) {
          addNotification({
            title: 'No Email Address',
            message: 'Customer does not have an email address',
            type: 'error'
          });
          return;
        }
        
        await CustomerMessagingService.sendEmail(
          selectedCustomer, 
          'Message from BrainBox-RetailPlus V25', 
          messageForm.message
        );
        addNotification({
          title: 'Email Sent',
          message: `Email sent to ${selectedCustomer.name} at ${selectedCustomer.email}`,
          type: 'success'
        });
      }
      
      setShowMessageModal(false);
      setMessageForm({ message: '', type: 'sms' });
    } catch (error: any) {
      addNotification({
        title: 'Message Failed',
        message: error.message || 'Failed to send message',
        type: 'error'
      });
    }
  };

  return (
    <div className="qb-page-container">
      <div className="qb-content-card">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="qb-title">Customer Management</h1>
            <p className="qb-subtitle">Manage customers and loyalty programs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 touch-target"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Customer</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

        {/* Search Bar */}
        <div className="bg-green-50 rounded-xl shadow-sm border-2 border-green-200 p-4 lg:p-6 mt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-optimized"
          />
        </div>
      </div>

        {/* Customer List */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 mt-6">
        <div className="p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-bold text-green-900 mb-4">Customers ({filteredCustomers.length})</h3>
          
          <div className="space-y-3 lg:space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="border border-gray-200 rounded-lg p-3 lg:p-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 lg:h-12 w-10 lg:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm lg:text-base">{customer.name}</h4>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1 lg:space-y-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTierColor(customer.loyaltyCard.tier)}`}>
                      <Star className="h-3 w-3 mr-1" />
                      {customer.loyaltyCard.tier}
                    </div>
                    <p className="text-xs lg:text-sm font-medium text-gray-900">
                      {customer.loyaltyCard.points} Points
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: ₦{customer.totalPurchases.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 lg:mt-4 grid grid-cols-3 gap-2 lg:gap-4 pt-3 lg:pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs lg:text-sm font-medium text-gray-900">
                      ₦{customer.loyaltyCard.totalSpent.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs lg:text-sm font-medium text-gray-900">
                      {customer.loyaltyCard.rewardPercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Reward Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs lg:text-sm font-medium text-gray-900">
                      ₦{customer.loyaltyCard.totalSpent.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total Spent</p>
                  </div>
                </div>

                <div className="mt-3 lg:mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditModal(customer)}
                    className="flex items-center space-x-1 px-2 lg:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs lg:text-sm touch-target"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => sendTestMessage(customer)}
                    className="flex items-center space-x-1 px-2 lg:px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors text-xs lg:text-sm touch-target"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Message</span>
                  </button>
                  <button 
                    onClick={() => openRewardModal(customer)}
                    className="flex items-center space-x-1 px-2 lg:px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs lg:text-sm touch-target"
                  >
                    <Gift className="h-3 w-3" />
                    <span>Reward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Customer</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="customer@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+234-xxx-xxx-xxxx"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer address"
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
                  onClick={handleAddCustomer}
                  disabled={!formData.name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Customer</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="customer@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+234-xxx-xxx-xxxx"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reward Percentage (%)</label>
                  <input
                    type="number"
                    value={editFormData.rewardPercentage}
                    onChange={(e) => setEditFormData({...editFormData, rewardPercentage: parseFloat(e.target.value) || 2})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">How much % of purchase amount customer earns as points</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCustomer(null);
                    setEditFormData({ name: '', email: '', phone: '', address: '' });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCustomer}
                  disabled={!editFormData.name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Update Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reward Customer Modal */}
      {showRewardModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Give Reward to {selectedCustomer.name}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Star className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">{selectedCustomer.name}</p>
                      <p className="text-sm text-purple-700">
                        Current Points: {selectedCustomer.loyaltyCard.points}
                      </p>
                      <p className="text-sm text-purple-700">
                        Tier: {selectedCustomer.loyaltyCard.tier}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reward Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setRewardForm({...rewardForm, rewardType: 'points'})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        rewardForm.rewardType === 'points'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Star className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">Add Points</p>
                    </button>
                    <button
                      onClick={() => setRewardForm({...rewardForm, rewardType: 'discount'})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        rewardForm.rewardType === 'discount'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">Discount</p>
                    </button>
                    <button
                      onClick={() => setRewardForm({...rewardForm, rewardType: 'free_item'})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        rewardForm.rewardType === 'free_item'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Gift className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">Free Item</p>
                    </button>
                {rewardForm.rewardType === 'points' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points to Add</label>
                    <input
                      type="number"
                      value={rewardForm.pointsToAdd}
                      onChange={(e) => setRewardForm({...rewardForm, pointsToAdd: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter points to add"
                      min="1"
                    />
                  </div>
                )}
                  </div>
                {rewardForm.rewardType === 'discount' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount (₦)</label>
                    <input
                      type="number"
                      value={rewardForm.discountAmount}
                      onChange={(e) => setRewardForm({...rewardForm, discountAmount: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter discount amount"
                      min="1"
                    />
                  </div>
                )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Reward</label>
                  <textarea
                    value={rewardForm.reason}
                    onChange={(e) => setRewardForm({...rewardForm, reason: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Why is this customer getting a reward?"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRewardModal(false);
                    setSelectedCustomer(null);
                    setRewardForm({
                      rewardType: 'points',
                      pointsToAdd: 0,
                      discountAmount: 0,
                      reason: ''
                    });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReward}
                  disabled={
                    (rewardForm.rewardType === 'points' && rewardForm.pointsToAdd <= 0) ||
                    (rewardForm.rewardType === 'discount' && rewardForm.discountAmount <= 0) ||
                    !rewardForm.reason.trim()
                  }
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <Gift className="h-4 w-4" />
                  <span>Apply Reward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Send Message to {selectedCustomer.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setMessageForm({...messageForm, type: 'sms'})}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        messageForm.type === 'sms'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Phone className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">SMS</p>
                      <p className="text-xs">{selectedCustomer.phone || 'No phone'}</p>
                    </button>
                    <button
                      onClick={() => setMessageForm({...messageForm, type: 'email'})}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        messageForm.type === 'email'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Mail className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs">{selectedCustomer.email || 'No email'}</p>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your message here..."
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> Message will be sent to {selectedCustomer.name} via {messageForm.type.toUpperCase()}
                    {messageForm.type === 'sms' ? ` at ${selectedCustomer.phone}` : ` at ${selectedCustomer.email}`}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageForm({ message: '', type: 'sms' });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageForm.message.trim() || 
                    (messageForm.type === 'sms' && !selectedCustomer.phone) ||
                    (messageForm.type === 'email' && !selectedCustomer.email)
                  }
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send {messageForm.type.toUpperCase()}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}