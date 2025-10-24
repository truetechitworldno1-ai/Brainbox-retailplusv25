import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, TrendingUp, TrendingDown, Scan, Filter, Save, X, RefreshCw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Product } from '../types';

export default function InventoryManagement() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, refreshProducts } = useData();
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    brand: '',
    barcodes: [''],
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStock: 10,
    maxStock: 100,
    unit: 'piece',
    description: '',
    expiryDate: '',
    supplierId: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Extended units like QuickBooks POS
  const units = [
    'piece', 'box', 'pack', 'bottle', 'can', 'bag', 'carton',
    'kg', 'gram', 'pound', 'liter', 'ml', 'gallon',
    'meter', 'cm', 'inch', 'yard', 'feet',
    'dozen', 'pair', 'set', 'roll', 'sheet', 'bundle', 'case',
    'pallet', 'crate', 'sack', 'tube', 'jar', 'tin', 'sachet',
    'strip', 'tablet', 'capsule', 'vial', 'ampule', 'unit',
    'each', 'lot', 'batch', 'length', 'width', 'height',
    'square meter', 'cubic meter', 'ounce', 'ton', 'quintal'
  ];

  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnit, setNewUnit] = useState('');

  // Load custom units on component mount
  useEffect(() => {
    const savedUnits = localStorage.getItem('brainbox_custom_units');
    if (savedUnits) {
      setCustomUnits(JSON.parse(savedUnits));
    }
  }, []);

  const addCustomUnit = () => {
    if (!newUnit.trim() || units.includes(newUnit) || customUnits.includes(newUnit)) {
      addNotification({
        title: 'Invalid Unit',
        message: 'Unit already exists or is empty',
        type: 'error'
      });
      return;
    }

    const updatedUnits = [...customUnits, newUnit.trim()];
    setCustomUnits(updatedUnits);
    localStorage.setItem('brainbox_custom_units', JSON.stringify(updatedUnits));
    
    addNotification({
      title: 'Unit Added',
      message: `${newUnit} added to units list`,
      type: 'success'
    });
    
    setNewUnit('');
    setShowAddUnitModal(false);
  };

  const allUnits = [...units, ...customUnits];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcodes.some(barcode => barcode.includes(searchTerm));
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

  const handleAddProduct = () => {
    if (!productForm.name.trim() || !productForm.barcodes[0].trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Product name and barcode are required',
        type: 'error'
      });
      return;
    }

    addProduct({
      name: productForm.name,
      category: productForm.category,
      brand: productForm.brand,
      barcodes: productForm.barcodes.filter(b => b.trim()),
      costPrice: productForm.costPrice,
      sellingPrice: productForm.sellingPrice,
      stock: productForm.stock,
      minStock: productForm.minStock,
      maxStock: productForm.maxStock,
      unit: productForm.unit,
      description: productForm.description,
      expiryDate: productForm.expiryDate ? new Date(productForm.expiryDate) : undefined,
      supplierId: productForm.supplierId,
      hasVariations: false,
      isActive: true
    });

    addNotification({
      title: 'Product Added',
      message: `${productForm.name} has been added to inventory`,
      type: 'success'
    });

    resetProductForm();
    setShowAddModal(false);
  };

  const handleEditProduct = () => {
    if (!selectedProduct) return;

    updateProduct(selectedProduct.id, {
      name: productForm.name,
      category: productForm.category,
      brand: productForm.brand,
      barcodes: productForm.barcodes.filter(b => b.trim()),
      costPrice: productForm.costPrice,
      sellingPrice: productForm.sellingPrice,
      stock: productForm.stock,
      minStock: productForm.minStock,
      maxStock: productForm.maxStock,
      unit: productForm.unit,
      description: productForm.description,
      expiryDate: productForm.expiryDate ? new Date(productForm.expiryDate) : undefined,
      supplierId: productForm.supplierId
    });

    addNotification({
      title: 'Product Updated',
      message: `${productForm.name} has been updated`,
      type: 'success'
    });

    setShowEditModal(false);
    setSelectedProduct(null);
    resetProductForm();
  };

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      deleteProduct(product.id);
      addNotification({
        title: 'Product Deleted',
        message: `${product.name} has been removed from inventory`,
        type: 'success'
      });
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      brand: product.brand,
      barcodes: product.barcodes,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      description: product.description || '',
      expiryDate: product.expiryDate ? product.expiryDate.toISOString().split('T')[0] : '',
      supplierId: product.supplierId || ''
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (product: Product) => {
    setViewingProduct(product);
    setShowDetailsModal(true);
  };

  const handleAddCategory = () => {
    if (!categoryForm.name.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Category name is required',
        type: 'error'
      });
      return;
    }

    addCategory({
      name: categoryForm.name,
      description: categoryForm.description,
      color: categoryForm.color,
      isActive: true
    });

    addNotification({
      title: 'Category Added',
      message: `${categoryForm.name} category has been created`,
      type: 'success'
    });

    setCategoryForm({ name: '', description: '', color: '#3B82F6' });
    setShowCategoryModal(false);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      category: '',
      brand: '',
      barcodes: [''],
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 10,
      maxStock: 100,
      unit: 'piece',
      description: '',
      expiryDate: '',
      supplierId: ''
    });
  };

  const addBarcodeField = () => {
    setProductForm({
      ...productForm,
      barcodes: [...productForm.barcodes, '']
    });
  };

  const updateBarcode = (index: number, value: string) => {
    const newBarcodes = [...productForm.barcodes];
    newBarcodes[index] = value;
    setProductForm({
      ...productForm,
      barcodes: newBarcodes
    });
  };

  const removeBarcode = (index: number) => {
    if (productForm.barcodes.length > 1) {
      setProductForm({
        ...productForm,
        barcodes: productForm.barcodes.filter((_, i) => i !== index)
      });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (product.stock <= product.minStock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (product.stock >= product.maxStock) return { status: 'Overstock', color: 'bg-purple-100 text-purple-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="qb-page-container">
      <div className="qb-content-card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="qb-title">Inventory Management</h1>
            <p className="qb-subtitle">QuickBooks POS style inventory with multiple barcodes</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                refreshProducts();
                addNotification({
                  title: 'Products Refreshed',
                  message: 'Product list has been refreshed',
                  type: 'success'
                });
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">₦{totalInventoryValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products, brands, or barcodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcodes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.brand}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.barcodes.slice(0, 2).map((barcode, index) => (
                            <div key={index} className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mb-1">
                              {barcode}
                            </div>
                          ))}
                          {product.barcodes.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{product.barcodes.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.stock} {product.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {product.minStock} | Max: {product.maxStock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₦{product.sellingPrice.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Cost: ₦{product.costPrice.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openDetailsModal(product)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Details"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Product</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetProductForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure
                </label>
                <div className="flex space-x-2">
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <optgroup label="Standard Units">
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </optgroup>
                    {customUnits.length > 0 && (
                      <optgroup label="Custom Units">
                        {customUnits.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <button
                    onClick={() => setShowAddUnitModal(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Add Custom Unit"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcodes *
                </label>
                {productForm.barcodes.map((barcode, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => updateBarcode(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Barcode ${index + 1}`}
                    />
                    <button
                      onClick={() => removeBarcode(index)}
                      disabled={productForm.barcodes.length === 1}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addBarcodeField}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Barcode</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (₦)
                </label>
                <input
                  type="number"
                  value={productForm.costPrice}
                  onChange={(e) => setProductForm({...productForm, costPrice: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (₦)
                </label>
                <input
                  type="number"
                  value={productForm.sellingPrice}
                  onChange={(e) => setProductForm({...productForm, sellingPrice: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  value={productForm.minStock}
                  onChange={(e) => setProductForm({...productForm, minStock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  value={productForm.maxStock}
                  onChange={(e) => setProductForm({...productForm, maxStock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={productForm.expiryDate}
                  onChange={(e) => setProductForm({...productForm, expiryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetProductForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAddProduct();
                  resetProductForm();
                }}
                disabled={!productForm.name.trim() || !productForm.barcodes[0].trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Save & New</span>
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!productForm.name.trim() || !productForm.barcodes[0].trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Custom Unit</h2>
              <button
                onClick={() => {
                  setShowAddUnitModal(false);
                  setNewUnit('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Name
              </label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., dozen, pack, bundle"
                onKeyPress={(e) => e.key === 'Enter' && addCustomUnit()}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddUnitModal(false);
                  setNewUnit('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addCustomUnit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Category</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Category description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                    className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryForm({ name: '', description: '', color: '#3B82F6' });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={!categoryForm.name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Product</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProduct(null);
                  resetProductForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Same form fields as Add Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure
                </label>
                <select
                  value={productForm.unit}
                  onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <optgroup label="Standard Units">
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </optgroup>
                  {customUnits.length > 0 && (
                    <optgroup label="Custom Units">
                      {customUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcodes *
                </label>
                {productForm.barcodes.map((barcode, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => updateBarcode(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Barcode ${index + 1}`}
                    />
                    <button
                      onClick={() => removeBarcode(index)}
                      disabled={productForm.barcodes.length === 1}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addBarcodeField}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Barcode</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (₦)
                </label>
                <input
                  type="number"
                  value={productForm.costPrice}
                  onChange={(e) => setProductForm({...productForm, costPrice: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (₦)
                </label>
                <input
                  type="number"
                  value={productForm.sellingPrice}
                  onChange={(e) => setProductForm({...productForm, sellingPrice: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  value={productForm.minStock}
                  onChange={(e) => setProductForm({...productForm, minStock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  value={productForm.maxStock}
                  onChange={(e) => setProductForm({...productForm, maxStock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={productForm.expiryDate}
                  onChange={(e) => setProductForm({...productForm, expiryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProduct(null);
                  resetProductForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProduct}
                disabled={!productForm.name.trim() || !productForm.barcodes[0].trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Update Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Product Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{viewingProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{viewingProduct.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{viewingProduct.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit:</span>
                      <span className="font-medium">{viewingProduct.unit}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pricing & Stock</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost Price:</span>
                      <span className="font-medium">₦{viewingProduct.costPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selling Price:</span>
                      <span className="font-medium">₦{viewingProduct.sellingPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Stock:</span>
                      <span className="font-medium">{viewingProduct.stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Stock:</span>
                      <span className="font-medium">{viewingProduct.minStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Stock:</span>
                      <span className="font-medium">{viewingProduct.maxStock}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Barcodes</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingProduct.barcodes.map((barcode, index) => (
                    <span key={index} className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-sm">
                      {barcode}
                    </span>
                  ))}
                </div>
              </div>

              {viewingProduct.description && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">{viewingProduct.description}</p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
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