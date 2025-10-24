import React, { useState } from 'react';
import { Search, Book, MessageCircle, Video, FileText, Mail, Phone } from 'lucide-react';

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const helpCategories = [
    { id: 'all', label: 'All Topics', icon: Book },
    { id: 'getting-started', label: 'Getting Started', icon: Video },
    { id: 'pos', label: 'Point of Sale', icon: MessageCircle },
    { id: 'inventory', label: 'Inventory', icon: FileText },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: MessageCircle },
  ];

  const helpArticles = [
    {
      id: '1',
      title: 'Getting Started with BrainBox-RetailPlus V25',
      category: 'getting-started',
      description: 'Learn the basics of setting up and using your POS system',
      readTime: '5 min read',
    },
    {
      id: '2',
      title: 'Processing Sales and Payments',
      category: 'pos',
      description: 'Complete guide to handling transactions and multiple payment methods',
      readTime: '7 min read',
    },
    {
      id: '3',
      title: 'Managing Customer Loyalty Programs',
      category: 'pos',
      description: 'Set up and manage customer rewards and loyalty cards',
      readTime: '4 min read',
    },
    {
      id: '4',
      title: 'Inventory Management Best Practices',
      category: 'inventory',
      description: 'Keep track of stock levels, set reorder points, and manage suppliers',
      readTime: '6 min read',
    },
    {
      id: '5',
      title: 'Audio Alerts and Notifications',
      category: 'pos',
      description: 'Configure custom audio messages and performance alerts',
      readTime: '3 min read',
    },
    {
      id: '6',
      title: 'Working Offline and Data Sync',
      category: 'troubleshooting',
      description: 'Understanding offline mode and how data synchronization works',
      readTime: '8 min read',
    },
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="qb-page-container">
      <div className="qb-content-card">
      <div>
          <h1 className="qb-title">Help & Support</h1>
          <p className="qb-subtitle">Get help with BRAINBOX RETAILPLUS features and functionality</p>
      </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Need Personal Assistance?</h3>
              <p className="text-green-100">Our support team is here to help you succeed</p>
          </div>
          <div className="flex space-x-4">
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email Support</span>
            </button>
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Call Support</span>
            </button>
          </div>
        </div>
      </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6 mt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search help articles..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {helpCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <category.icon className="h-4 w-4" />
                <span className="text-sm">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* Help Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {filteredArticles.map((article) => (
            <div key={article.id} className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-green-900 pr-4">{article.title}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                {article.readTime}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{article.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full capitalize">
                {article.category.replace('-', ' ')}
              </span>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Read Article →
              </button>
            </div>
          </div>
        ))}
      </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6 mt-6">
          <h3 className="text-lg font-bold text-green-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Video className="h-6 w-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Video Tutorials</p>
              <p className="text-sm text-gray-500">Watch step-by-step guides</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageCircle className="h-6 w-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Live Chat</p>
              <p className="text-sm text-gray-500">Chat with support team</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-6 w-6 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">User Manual</p>
              <p className="text-sm text-gray-500">Download complete guide</p>
            </div>
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}