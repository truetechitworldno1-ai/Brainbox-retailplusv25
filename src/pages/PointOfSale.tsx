import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  User, 
  CreditCard, 
  Trash2, 
  Package,
  Calculator,
  Receipt,
  Gift,
  Star,
  Volume2,
  Scan,
  Users,
  DollarSign,
  Brain
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useNotification } from '../contexts/NotificationContext';
import { SaleItem, PaymentDetail, Customer } from '../types';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import ReceiptPreview from '../components/ReceiptPreview';
import { CustomerMessagingService } from '../services/CustomerMessagingService';
import { poppyAssistant } from '../services/PoppyAssistant';

export default function PointOfSale() {
  const { 
    products, 
    customers, 
    addSale, 
    updateProduct, 
    updateCustomer, 
    systemSettings,
    heldReceipts,
    addHeldReceipt,
    removeHeldReceipt
  } = useData();
  const { user, hasPermission } = useAuth();
  const { 
    playCustomerGreeting, 
    playCustomerThankYou, 
    playAutomaticSaleMessage,
    playEsteemedCustomerMessage,
    playPatronageThankYou,
    playRewardMessage
  } = useAudio();
  const { addNotification } = useNotification();

  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showHeldReceiptsModal, setShowHeldReceiptsModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [barcode, setBarcode] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [holdReason, setHoldReason] = useState('');
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBarcodeSelector, setShowBarcodeSelector] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [multipleProducts, setMultipleProducts] = useState<any[]>([]);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    rewardPercentage: 2
  });

  // Initialize Poppy Assistant with products
  useEffect(() => {
    poppyAssistant.updateProducts(products);
    poppyAssistant.setProductSelectCallback((product) => {
      addToCart(product.id, product.barcodes[0] || '');
    });
  }, [products]);

  // Auto-search and suggestions for barcode input
  useEffect(() => {
    if (barcode.length >= 2) {
      const matchingProducts = products.filter(product =>
        product.name.toLowerCase().includes(barcode.toLowerCase()) ||
        product.barcodes.some(b => b.includes(barcode)) ||
        product.brand.toLowerCase().includes(barcode.toLowerCase()) ||
        product.category.toLowerCase().includes(barcode.toLowerCase())
      ).slice(0, 8);
      
      setSuggestions(matchingProducts);
      setShowSuggestions(matchingProducts.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [barcode, products]);

  const addToCart = (productId: string, scannedBarcode: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      addNotification({
        title: 'Product Not Found',
        message: 'Product not found in inventory',
        type: 'error'
      });
      return;
    }

    if (product.stock <= 0) {
      addNotification({
        title: 'Out of Stock',
        message: `${product.name} is out of stock`,
        type: 'error'
      });
      return;
    }

    const existingItem = cartItems.find(item => item.productId === productId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        addNotification({
          title: 'Insufficient Stock',
          message: `Only ${product.stock} units available`,
          type: 'error'
        });
        return;
      }
      
      setCartItems(cartItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      const newItem: SaleItem = {
        productId,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        total: product.sellingPrice,
        barcode: scannedBarcode || product.barcodes[0] || ''
      };
      setCartItems([...cartItems, newItem]);
    }

    setBarcode('');
    setShowSuggestions(false);
  };

  const handleAddNewCustomer = () => {
    if (!newCustomerForm.name.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Customer name is required',
        type: 'error'
      });
      return;
    }

    const newCustomer = {
      name: newCustomerForm.name,
      email: newCustomerForm.email,
      phone: newCustomerForm.phone,
      address: newCustomerForm.address,
      loyaltyCard: {
        cardNumber: `LC${Date.now()}`,
        points: 0,
        totalSpent: 0,
        rewardPercentage: newCustomerForm.rewardPercentage || 2,
        tier: 'bronze' as const,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      totalPurchases: 0,
      lastPurchase: new Date(),
      isActive: true
    };

    addCustomer(newCustomer);
    
    // Auto-select the new customer immediately
    const customerWithId = { ...newCustomer, id: crypto.randomUUID(), createdAt: new Date() };
    setSelectedCustomer(customerWithId);
    
    addNotification({
      title: 'Customer Added',
      message: `${newCustomerForm.name} has been added and selected`,
      type: 'success'
    });

    // Reset form and close modal
    setNewCustomerForm({ name: '', email: '', phone: '', address: '', rewardPercentage: 2 });
    setShowAddCustomerModal(false);
  };

  const handleSaveAndNewCustomer = () => {
    if (!newCustomerForm.name.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Customer name is required',
        type: 'error'
      });
      return;
    }

    const newCustomer = {
      name: newCustomerForm.name,
      email: newCustomerForm.email,
      phone: newCustomerForm.phone,
      address: newCustomerForm.address,
      loyaltyCard: {
        cardNumber: `LC${Date.now()}`,
        points: 0,
        totalSpent: 0,
        rewardPercentage: newCustomerForm.rewardPercentage || 2,
        tier: 'bronze' as const,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      totalPurchases: 0,
      lastPurchase: new Date(),
      isActive: true
    };

    addCustomer(newCustomer);
    addNotification({
      title: 'Customer Saved',
      message: `${newCustomerForm.name} saved. Add another customer.`,
      type: 'success'
    });

    // Reset form but keep modal open
    setNewCustomerForm({ name: '', email: '', phone: '', address: '', rewardPercentage: 2 });
    
    // Focus back to name field for next customer
    setTimeout(() => {
      const nameInput = document.querySelector('input[placeholder="Enter customer name"]') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
      }
    }, 100);
  };
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter((_, i) => i !== index));
      return;
    }

    const item = cartItems[index];
    const product = products.find(p => p.id === item.productId);
    
    if (product && newQuantity > product.stock) {
      addNotification({
        title: 'Insufficient Stock',
        message: `Only ${product.stock} units available`,
        type: 'error'
      });
      return;
    }

    setCartItems(cartItems.map((item, i) =>
      i === index
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    ));
  };

  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  };

  const getTax = () => {
    return systemSettings.taxEnabled ? (getSubtotal() * systemSettings.taxRate) / 100 : 0;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() - discount;
  };

  const calculateLoyaltyPoints = (amount: number, customer?: Customer) => {
    if (!customer || !systemSettings.loyaltyEnabled) return 0;
    // Correct calculation: 2% of purchase amount
    const points = Math.floor(amount * (customer.loyaltyCard.rewardPercentage / 100));
    console.log(`Loyalty calculation: ₦${amount} × ${customer.loyaltyCard.rewardPercentage}% = ${points} points`);
    return points;
  };

  const handlePaymentComplete = async (paymentDetails: PaymentDetail[]) => {
    if (cartItems.length === 0) return;

    const subtotal = getSubtotal();
    const tax = getTax();
    const total = getTotal();
    const loyaltyPointsEarned = selectedCustomer ? calculateLoyaltyPoints(total, selectedCustomer) : 0;

    const sale = {
      receiptNumber: `R${Date.now()}`,
      customerId: selectedCustomer?.id,
      items: cartItems,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod: paymentDetails.length === 1 ? paymentDetails[0].method : 'split',
      paymentDetails,
      cashierId: user?.id || '1',
      timestamp: new Date(),
      loyaltyPointsEarned,
      loyaltyPointsUsed: loyaltyPointsToUse,
      isHeld: false
    };

    // Add sale
    addSale(sale);

    // Update product stock - ALWAYS deduct stock for all sales
    cartItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        updateProduct(item.productId, {
          stock: product.stock - item.quantity
        });
      }
    });

    // Update customer loyalty points
    if (selectedCustomer) {
      // Calculate net points: earned minus used
      const netPoints = loyaltyPointsEarned - loyaltyPointsToUse;

      updateCustomer(selectedCustomer.id, {
        loyaltyCard: {
          ...selectedCustomer.loyaltyCard,
          points: selectedCustomer.loyaltyCard.points + netPoints,
          totalSpent: selectedCustomer.loyaltyCard.totalSpent + total
        },
        totalPurchases: selectedCustomer.totalPurchases + 1,
        lastPurchase: new Date()
      });

      // Play reward message if points earned
      if (loyaltyPointsEarned > 0) {
        playRewardMessage(loyaltyPointsEarned, selectedCustomer.loyaltyCard.rewardPercentage, total);
      }
    }

    // Send instant SMS after transaction
    if (selectedCustomer && selectedCustomer.phone) {
      try {
        // Single combined message with all details
        const combinedMessage = `Hi ${selectedCustomer.name}! Your purchase of ₦${sale.total.toLocaleString()} is complete. ${loyaltyPointsEarned > 0 ? `You earned ${loyaltyPointsEarned} points! ` : ''}Thank you for shopping with ${systemSettings.businessName}! 🛍️`;
        
        await CustomerMessagingService.sendSMS(selectedCustomer, combinedMessage, sale.id);
        
        // Single notification for both SMS and email
        addNotification({
          title: '📱📧 Messages Sent!',
          message: `SMS & Email sent to ${selectedCustomer.name}`,
          type: 'success'
        });
      } catch (error) {
        console.warn('Customer messaging failed:', error);
      }
    }

    // Play audio messages
    playAutomaticSaleMessage();
    if (selectedCustomer) {
      playEsteemedCustomerMessage();
      setTimeout(() => playPatronageThankYou(), 1000);
    }

    setLastSale(sale);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    
    // Reset cart
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setLoyaltyPointsToUse(0);

    addNotification({
      title: 'Sale Completed',
      message: `Sale of ₦${total.toLocaleString()} completed successfully`,
      type: 'success'
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    // Find all products with this barcode
    const matchingProducts = products.filter(p => 
      p.barcodes.some(b => b === barcode) || p.name.toLowerCase().includes(barcode.toLowerCase())
    );

    if (matchingProducts.length === 1) {
      // Single product found - add directly
      addToCart(matchingProducts[0].id, barcode);
    } else if (matchingProducts.length > 1) {
      // Multiple products with same barcode - show selector
      setMultipleProducts(matchingProducts);
      setScannedBarcode(barcode);
      setShowBarcodeSelector(true);
    } else {
      addNotification({
        title: 'Product Not Found',
        message: `No product found with barcode: ${barcode}`,
        type: 'error'
      });
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearch('');
    
    // Play greeting for customer
    playCustomerGreeting();
    
    addNotification({
      title: 'Customer Selected',
      message: `${customer.name} selected - ${customer.loyaltyCard.points} points available`,
      type: 'success'
    });
  };

  const selectProductFromBarcode = (product: any) => {
    addToCart(product.id, scannedBarcode);
    setShowBarcodeSelector(false);
    setMultipleProducts([]);
    setScannedBarcode('');
  };

  const holdReceipt = () => {
    if (cartItems.length === 0) {
      addNotification({
        title: 'Empty Cart',
        message: 'Cannot hold empty receipt',
        type: 'error'
      });
      return;
    }

    if (!holdReason.trim()) {
      addNotification({
        title: 'Hold Reason Required',
        message: 'Please provide a reason for holding the receipt',
        type: 'error'
      });
      return;
    }

    const heldReceipt = {
      receiptNumber: `H${Date.now()}`,
      customerId: selectedCustomer?.id,
      items: cartItems,
      subtotal: getSubtotal(),
      tax: getTax(),
      discount,
      total: getTotal(),
      cashierId: user?.id || '1',
      holdReason,
      heldAt: new Date(),
      loyaltyPointsEarned: selectedCustomer ? calculateLoyaltyPoints(getTotal(), selectedCustomer) : 0
    };

    addHeldReceipt(heldReceipt);

    addNotification({
      title: 'Receipt Held',
      message: `Receipt ${heldReceipt.receiptNumber} held successfully`,
      type: 'success'
    });

    // Reset cart
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setHoldReason('');
    setLoyaltyPointsToUse(0);
  };

  const retrieveHeldReceipt = (receipt: any) => {
    setCartItems(receipt.items);
    setSelectedCustomer(receipt.customerId ? customers.find(c => c.id === receipt.customerId) : null);
    setDiscount(receipt.discount);
    
    removeHeldReceipt(receipt.id);
    setShowHeldReceiptsModal(false);

    addNotification({
      title: 'Receipt Retrieved',
      message: `Receipt ${receipt.receiptNumber} retrieved successfully`,
      type: 'success'
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone?.includes(customerSearch) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="qb-page-container">
      <div className="qb-content-card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="qb-title">Point of Sales</h1>
            <p className="qb-subtitle">Process sales with barcode scanning and Poppy assistant</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHeldReceiptsModal(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
            >
              <Package className="h-4 w-4" />
              <span>Held ({heldReceipts.length})</span>
            </button>
            <button
              onClick={() => {
                if (poppyAssistant.isActive()) {
                  poppyAssistant.hide();
                } else {
                  poppyAssistant.show();
                }
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Brain className="h-4 w-4" />
              <span>Poppy (F12)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Product Search and Cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Barcode Scanner with Auto-Pop Suggestions */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan Barcode or Type Product Name (Auto-Search)
                  </label>
                  <div className="relative">
                    <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="Scan barcode or type product name..."
                      autoFocus
                    />
                    
                    {/* Auto-Pop Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {suggestions.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => addToCart(product.id, product.barcodes[0] || '')}
                            className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-600">{product.category} - {product.brand}</p>
                                <p className="text-sm text-blue-600">₦{product.sellingPrice.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {product.barcodes.map((bc, idx) => (
                                    <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                      {bc}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add to Cart
                </button>
              </form>
            </div>

            {/* Quick Product Grid */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Products</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.slice(0, 12).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product.id, product.barcodes[0] || '')}
                    disabled={product.stock <= 0}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">₦{product.sellingPrice.toLocaleString()}</p>
                    <p className="text-xs text-blue-600">Stock: {product.stock}</p>
                    {product.barcodes.length > 1 && (
                      <p className="text-xs text-purple-600">{product.barcodes.length} barcodes</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shopping Cart ({cartItems.length})</h3>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Cart is empty. Scan products to add them.</p>
                  <p className="text-sm text-blue-600 mt-2">💡 Press F12 for Poppy Assistant</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">₦{item.unitPrice.toLocaleString()} each</p>
                        <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₦{item.total.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer and Payment Panel */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Customer</h3>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Select</span>
                </button>
              </div>
              
              {selectedCustomer ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 font-medium">Loyalty Points</span>
                      <span className="font-bold text-purple-900">{selectedCustomer.loyaltyCard.points}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-purple-600 text-sm">Will Earn</span>
                      <span className="font-medium text-purple-800">+{calculateLoyaltyPoints(getTotal(), selectedCustomer)} points</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Remove Customer
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No customer selected</p>
                  <p className="text-gray-400 text-xs">Walk-in customer</p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₦{getSubtotal().toLocaleString()}</span>
                </div>
                
                {systemSettings.taxEnabled && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({systemSettings.taxRate}%):</span>
                    <span className="font-medium">₦{getTax().toLocaleString()}</span>
                  </div>
                )}
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-₦{discount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>₦{getTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={cartItems.length === 0}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Process Payment</span>
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for holding receipt:');
                      if (reason) {
                        setHoldReason(reason);
                        holdReceipt();
                      }
                    }}
                    disabled={cartItems.length === 0}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    Hold Receipt
                  </button>
                  
                  <button
                    onClick={() => {
                      setCartItems([]);
                      setSelectedCustomer(null);
                      setDiscount(0);
                    }}
                    disabled={cartItems.length === 0}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment</h3>
              <PaymentMethodSelector
                total={getTotal()}
                onPaymentComplete={handlePaymentComplete}
                onCancel={() => setShowPaymentModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Select Customer</h3>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by name, phone, or email..."
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{customer.loyaltyCard.points}</span>
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{customer.loyaltyCard.tier}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCustomerModal(false);
                    setShowAddCustomerModal(true);
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Customer</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Continue as Walk-in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Customer</h3>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3b82f6 #e5e7eb' }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter customer name"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+234-xxx-xxx-xxxx"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="customer@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reward Percentage (%)</label>
                  <input
                    type="number"
                    value={newCustomerForm.rewardPercentage}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, rewardPercentage: parseFloat(e.target.value) || 2})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 2% (Customer earns 2% of purchase as points)</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Loyalty Card:</strong> Will be automatically created with {newCustomerForm.rewardPercentage}% reward rate
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setNewCustomerForm({ name: '', email: '', phone: '', address: '', rewardPercentage: 2 });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAndNewCustomer}
                  disabled={!newCustomerForm.name.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Save & New
                </button>
                <button
                  onClick={handleAddNewCustomer}
                  disabled={!newCustomerForm.name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Barcode Product Selector Modal */}
      {showBarcodeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Multiple Products Found for Barcode: {scannedBarcode}
              </h3>
              
              <p className="text-gray-600 mb-4">
                Multiple products share this barcode. Please select the correct item:
              </p>

              <div className="space-y-3">
                {multipleProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => selectProductFromBarcode(product)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category} - {product.brand}</p>
                        <p className="text-sm text-blue-600">₦{product.sellingPrice.toLocaleString()}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.barcodes.map((bc: string, idx: number) => (
                            <span key={idx} className={`bg-gray-100 px-2 py-1 rounded text-xs font-mono ${
                              bc === scannedBarcode ? 'bg-blue-100 text-blue-800 font-bold' : ''
                            }`}>
                              {bc}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                        <p className="text-sm text-gray-500">Unit: {product.unit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBarcodeSelector(false);
                    setMultipleProducts([]);
                    setScannedBarcode('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptModal && lastSale && (
        <ReceiptPreview
          sale={lastSale}
          customer={selectedCustomer}
          onClose={() => setShowReceiptModal(false)}
          onPrint={() => {
            addNotification({
              title: 'Receipt Printed',
              message: 'Receipt sent to printer',
              type: 'success'
            });
          }}
        />
      )}

      {/* Held Receipts Modal */}
      {showHeldReceiptsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Held Receipts</h3>
              
              {heldReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No held receipts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {heldReceipts.map((receipt) => (
                    <div key={receipt.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Receipt #{receipt.receiptNumber}</p>
                          <p className="text-sm text-gray-600">{receipt.items.length} items - ₦{receipt.total.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Held: {receipt.heldAt.toLocaleString()}</p>
                          <p className="text-sm text-blue-600">Reason: {receipt.holdReason}</p>
                        </div>
                        <button
                          onClick={() => retrieveHeldReceipt(receipt)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Retrieve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowHeldReceiptsModal(false)}
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