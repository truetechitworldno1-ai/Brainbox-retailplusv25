class PoppyAssistant {
  private isVisible: boolean = false;
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private currentInputField: HTMLInputElement | null = null;
  private products: any[] = [];
  private onProductSelect: ((product: any) => void) | null = null;
  private lastF3Press: number = 0;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initializeVoice();
    this.setupKeyboardListener();
  }

  private initializeVoice() {
    const setVoice = () => {
      const voices = this.synth.getVoices();
      // Prefer female voice for Poppy
      this.voice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel')
      ) || voices[0] || null;
    };

    if (this.synth.getVoices().length > 0) {
      setVoice();
    } else {
      this.synth.addEventListener('voiceschanged', setVoice);
    }
  }

  private setupKeyboardListener() {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle F12 for Poppy Assistant
      if (event.key === 'F12') {
        event.preventDefault();
        event.stopPropagation();
        
        const now = Date.now();
        const timeSinceLastPress = now - this.lastF3Press;
        
        if (timeSinceLastPress < 500) { // Double press within 500ms
          // Double press - hide Poppy
          if (this.isVisible) {
            this.hide();
            this.speak("Poppy hidden! Press F12 to call me back!");
          }
        } else {
          // Single press - show Poppy
          if (!this.isVisible) {
            this.show();
          } else {
            // If already visible, just speak
            this.speak("Poppy here! Ready to help you find items!");
          }
        }
        
        this.lastF3Press = now;
        return false;
      }
    };

    // Listen for F12 key specifically
    document.addEventListener('keydown', handleKeyDown, true);
  }

  show() {
    if (this.isVisible) return; // Don't show if already visible
    this.isVisible = true;
    this.createPoppyUI();
    this.speak("Poppy here! Ready to help you find items!");
    this.findQuickEntryField();
  }

  hide() {
    if (!this.isVisible) return; // Don't hide if already hidden
    this.isVisible = false;
    this.removePoppyUI();
    this.speak("Poppy going away! Press F3 when you need help!");
    this.currentInputField = null;
  }

  private findQuickEntryField() {
    // Enhanced field detection with multiple selectors
    const selectors = [
      'input[placeholder*="Scan barcode"]',
      'input[placeholder*="Item name"]', 
      'input[placeholder*="Quick entry"]',
      'input[placeholder*="barcode"]',
      'input[placeholder*="scan"]',
      'input[placeholder*="item"]',
      'input[placeholder*="product"]',
      'input[type="text"]:not([placeholder*="search"]):not([placeholder*="Search"])'
    ];
    
    let foundField = null;
    for (const selector of selectors) {
      foundField = document.querySelector(selector) as HTMLInputElement;
      if (foundField && foundField.offsetParent !== null) { // Check if visible
        break;
      }
    }
    
    this.currentInputField = foundField;
    
    if (this.currentInputField) {
      this.updateStatus('🎯 Connected to Quick Entry! Type item names here.', '#4CAF50');
    } else {
      this.updateStatus('⚠️ Quick entry field not found. Manual search available.', '#FF9800');
    }
  }

  private createPoppyUI() {
    // Remove existing Poppy UI if any
    this.removePoppyUI();

    const poppyContainer = document.createElement('div');
    poppyContainer.id = 'poppy-assistant';
    poppyContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 0;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      animation: slideInWithBox 0.8s ease-out;
      overflow: hidden;
    `;

    poppyContainer.innerHTML = `
      <style>
        @keyframes slideInWithBox {
          0% { 
            transform: translateX(100%) translateY(-50px) scale(0.8); 
            opacity: 0; 
            filter: blur(10px);
          }
          50% { 
            transform: translateX(20px) translateY(-10px) scale(1.05); 
            opacity: 0.8; 
            filter: blur(2px);
          }
          100% { 
            transform: translateX(0) translateY(0) scale(1); 
            opacity: 1; 
            filter: blur(0);
          }
        }
        @keyframes slideOut {
          from { transform: translateX(0) scale(1); opacity: 1; }
          to { transform: translateX(100%) scale(0.8); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .poppy-avatar {
          animation: pulse 2s infinite;
        }
        .poppy-box {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 15px;
          margin: 20px;
          padding: 20px;
        }
        .poppy-input {
          width: 100%;
          padding: 12px;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 16px;
          margin-top: 10px;
        }
        .poppy-input::placeholder {
          color: rgba(255,255,255,0.7);
        }
        .poppy-input:focus {
          outline: none;
          border-color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.2);
        }
        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 8px;
          margin-top: 5px;
          max-height: 250px;
          overflow-y: auto;
          z-index: 1000;
        }
        .suggestion-item {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid rgba(0,0,0,0.1);
          color: #333;
          transition: background 0.2s ease;
        }
        .suggestion-item:hover, .suggestion-item.selected {
          background: rgba(102, 126, 234, 0.2);
          color: #333;
        }
        .suggestion-item:last-child {
          border-bottom: none;
        }
        .suggestion-name {
          font-weight: 600;
          font-size: 14px;
        }
        .suggestion-details {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 2px;
        }
        .suggestion-price {
          font-weight: bold;
          color: #2563eb;
          font-size: 13px;
          margin-top: 2px;
        }
        .poppy-controls {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }
        .poppy-btn {
          flex: 1;
          padding: 8px 12px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 8px;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .poppy-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }
      </style>
      <div class="poppy-box">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div class="poppy-avatar" style="width: 60px; height: 60px; background: linear-gradient(135deg, #ff6b6b, #feca57); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 28px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            🤖
          </div>
          <div>
            <h3 style="margin: 0; font-size: 20px; font-weight: bold;">Poppy Assistant</h3>
            <p style="margin: 0; font-size: 13px; opacity: 0.9;">Smart Shopping Helper</p>
            <p style="margin: 0; font-size: 11px; opacity: 0.7;">F3: Show • F3 x2: Hide • Auto-search enabled</p>
          </div>
        </div>
        
        <div id="poppy-status" style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px; margin-bottom: 15px; font-size: 14px; min-height: 50px; border: 1px solid rgba(255,255,255,0.3);">
          🎯 Ready! Type item names and I'll search for you!
        </div>
        
        <div style="position: relative;">
          <input 
            id="poppy-search-input" 
            class="poppy-input" 
            placeholder="Type item name (e.g., Coffee, Milk, Bread)..."
            autocomplete="off"
          />
          <div id="poppy-suggestions" class="suggestions-dropdown" style="display: none;"></div>
        </div>
        
        <div class="poppy-controls">
          <button class="poppy-btn" onclick="window.poppyAssistant.clearSearch()">
            🗑️ Clear
          </button>
          <button class="poppy-btn" onclick="window.poppyAssistant.focusQuickEntry()">
            🎯 Focus POS
          </button>
          <button class="poppy-btn" onclick="window.poppyAssistant.hide()">
            👋 Hide (F12x2)
          </button>
        </div>
        
        <div style="font-size: 11px; opacity: 0.8; text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
          💡 Type here → Auto-searches products<br/>
          🔍 Click suggestions → Adds to cart<br/>
          ⌨️ F3: Show • F3x2: Hide • Separate from Quick Entry
        </div>
      </div>
    `;

    document.body.appendChild(poppyContainer);
    
    // Setup Poppy's search input functionality
    this.setupPoppyInput();
    
    // Make Poppy globally accessible for button clicks
    (window as any).poppyAssistant = this;
    
    // Auto-focus Poppy's input
    setTimeout(() => {
      const poppyInput = document.getElementById('poppy-search-input') as HTMLInputElement;
      if (poppyInput) {
        poppyInput.focus();
      }
    }, 100);
  }

  private setupPoppyInput() {
    const poppyInput = document.getElementById('poppy-search-input') as HTMLInputElement;
    const suggestionsContainer = document.getElementById('poppy-suggestions') as HTMLDivElement;
    let selectedIndex = -1;
    let currentSuggestions: any[] = [];

    if (poppyInput && suggestionsContainer) {
      poppyInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        selectedIndex = -1;
        
        if (value.length >= 1) {
          const suggestions = this.searchProducts(value);
          currentSuggestions = suggestions;
          
          if (suggestions.length > 0) {
            this.showSuggestions(suggestions, suggestionsContainer);
            
            // Check for exact or close match
            const exactMatch = suggestions.find(p => 
              p.name.toLowerCase() === value.toLowerCase()
            );
            const closeMatch = suggestions.find(p => 
              p.name.toLowerCase().startsWith(value.toLowerCase())
            );
            
            if (exactMatch) {
              this.updateStatus(`✅ FOUND: ${exactMatch.name} - Click to add!`, '#4CAF50');
              this.speak(`Found ${exactMatch.name}`);
            } else if (closeMatch && value.length >= 3) {
              this.updateStatus(`🎯 FOUND: ${closeMatch.name} - Keep typing or click!`, '#4CAF50');
              this.speak(`Found ${closeMatch.name}`);
            } else {
              this.updateStatus(`🔍 Searching... ${suggestions.length} matches found`, '#2196F3');
            }
          } else {
            this.hideSuggestions(suggestionsContainer);
            this.updateStatus(`❌ NOT FOUND: "${value}" - No matches in system`, '#f44336');
            this.speak(`${value} not found`);
          }
        } else {
          this.hideSuggestions(suggestionsContainer);
          currentSuggestions = [];
          this.updateStatus('🎯 Ready! Type item names for instant search.', '#4CAF50');
        }
      });

      poppyInput.addEventListener('keydown', (e) => {
        if (currentSuggestions.length === 0) return;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
            this.highlightSuggestion(suggestionsContainer, selectedIndex);
            break;
          case 'ArrowUp':
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            this.highlightSuggestion(suggestionsContainer, selectedIndex);
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0 && currentSuggestions[selectedIndex]) {
              this.selectProduct(currentSuggestions[selectedIndex]);
            } else if (currentSuggestions.length === 1) {
              this.selectProduct(currentSuggestions[0]);
            }
            break;
          case 'Escape':
            this.hideSuggestions(suggestionsContainer);
            currentSuggestions = [];
            selectedIndex = -1;
            break;
        }
      });

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!poppyInput.contains(e.target as Node) && !suggestionsContainer.contains(e.target as Node)) {
          this.hideSuggestions(suggestionsContainer);
        }
      });
    }
  }

  private searchProducts(searchTerm: string): any[] {
    if (!this.products || this.products.length === 0) {
      // Try to get products from the global context
      this.products = this.getProductsFromDOM();
    }

    return this.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 8); // Limit to 8 suggestions
  }

  private showSuggestions(suggestions: any[], container: HTMLDivElement) {
    if (suggestions.length === 0) {
      this.hideSuggestions(container);
      return;
    }

    container.innerHTML = suggestions.map((product, index) => `
      <div class="suggestion-item" data-index="${index}" onclick="window.poppyAssistant.selectProductByIndex(${index})">
        <div class="suggestion-name">${product.name}</div>
        <div class="suggestion-details">${product.category} - ${product.brand} | Stock: ${product.stock}</div>
        <div class="suggestion-price">₦${product.sellingPrice.toLocaleString()}</div>
      </div>
    `).join('');

    container.style.display = 'block';
  }

  private hideSuggestions(container: HTMLDivElement) {
    container.style.display = 'none';
    container.innerHTML = '';
  }

  private highlightSuggestion(container: HTMLDivElement, index: number) {
    const items = container.querySelectorAll('.suggestion-item');
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private selectProduct(product: any) {
    // Only add to cart via callback - don't touch POS fields
    this.addProductToCart(product);
    
    // Clear Poppy's input but keep suggestions visible for more selections
    const poppyInput = document.getElementById('poppy-search-input') as HTMLInputElement;
    if (poppyInput) {
      poppyInput.value = '';
    }
    
    // Hide suggestions
    const suggestionsContainer = document.getElementById('poppy-suggestions') as HTMLDivElement;
    if (suggestionsContainer) {
      this.hideSuggestions(suggestionsContainer);
    }
    
    // Refocus Poppy's input for next item
    setTimeout(() => {
      if (poppyInput) {
        poppyInput.focus();
      }
    }, 100);
  }

  // Public method for selecting product by index (called from HTML onclick)
  selectProductByIndex(index: number) {
    const poppyInput = document.getElementById('poppy-search-input') as HTMLInputElement;
    const searchTerm = poppyInput?.value || '';
    const suggestions = this.searchProducts(searchTerm);
    
    if (suggestions[index]) {
      this.selectProduct(suggestions[index]);
    }
  }

  private getProductsFromDOM(): any[] {
    // Try to get products from React context via window object
    try {
      return (window as any).poppyProducts || [];
    } catch (error) {
      return [];
    }
  }

  private removePoppyUI() {
    const existing = document.getElementById('poppy-assistant');
    if (existing) {
      // Add exit animation
      existing.style.animation = 'slideOut 0.5s ease-in forwards';
      
      setTimeout(() => {
        if (existing.parentNode) {
          existing.remove();
        }
      }, 500);
    }
  }

  speak(text: string) {
    if (this.synth && this.voice) {
      // Cancel any ongoing speech
      this.synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.voice;
      utterance.rate = 1.2;
      utterance.pitch = 1.2; // Higher pitch for Poppy
      utterance.volume = 0.7;
      
      this.synth.speak(utterance);
    }
  }

  itemFound(itemName: string) {
    this.speak(`Found ${itemName}`);
    this.updateStatus(`✅ FOUND: ${itemName} - Available in system!`, '#4CAF50');
  }

  itemNotFound(searchTerm: string) {
    this.speak(`${searchTerm} not found`);
    this.updateStatus(`❌ NOT FOUND: ${searchTerm} - Not in system`, '#f44336');
  }

  // Public methods for button interactions
  clearSearch() {
    const poppyInput = document.getElementById('poppy-search-input') as HTMLInputElement;
    if (poppyInput) {
      poppyInput.value = '';
      poppyInput.focus();
    }
    
    // Hide suggestions
    const suggestionsContainer = document.getElementById('poppy-suggestions') as HTMLDivElement;
    if (suggestionsContainer) {
      this.hideSuggestions(suggestionsContainer);
    }
    
    this.updateStatus('🧹 Search cleared! Ready for new item.', '#2196F3');
    this.speak('Search cleared');
  }

  focusQuickEntry() {
    this.findQuickEntryField();
    if (this.currentInputField) {
      this.currentInputField.focus();
      this.updateStatus('🎯 Quick entry focused and ready!', '#9C27B0');
      this.speak('Quick entry focused');
    } else {
      this.updateStatus('❌ Quick entry field not found', '#f44336');
      this.speak('Entry field not found');
    }
  }

  // Enhanced status update with better visual feedback
  private updateStatus(message: string, color?: string) {
    const statusElement = document.getElementById('poppy-status');
    if (statusElement) {
      statusElement.innerHTML = message;
      if (color) {
        statusElement.style.background = color;
        statusElement.style.color = color === '#f44336' || color === '#FF9800' ? 'white' : 'rgba(255,255,255,0.95)';
      }
      
      // Add pulse effect for important messages
      statusElement.style.animation = 'pulse 0.5s ease-out';
      
      // Reset to default after 5 seconds
      setTimeout(() => {
        if (statusElement) {
          statusElement.innerHTML = '🎯 Ready! Type item names for instant search.';
          statusElement.style.background = 'rgba(255,255,255,0.2)';
          statusElement.style.color = 'rgba(255,255,255,0.95)';
          statusElement.style.animation = '';
        }
      }, 5000);
    }
  }

  // Method to update products list from POS component
  updateProducts(products: any[]) {
    this.products = products;
  }

  // Method to set product selection callback
  setProductSelectCallback(callback: (product: any) => void) {
    this.onProductSelect = callback;
  }

  isActive(): boolean {
    return this.isVisible;
  }

  // Only adds to cart via callback - NEVER deletes existing items
  addProductToCart(product: any) {
    if (this.onProductSelect) {
      // Ensure we only ADD to cart, never replace
      this.onProductSelect(product);
      this.speak(`Added ${product.name}`);
      this.updateStatus(`✅ ADDED: ${product.name} - Added to cart!`, '#4CAF50');
    }
  }
}

export const poppyAssistant = new PoppyAssistant();

// Make Poppy globally accessible
(window as any).poppyAssistant = poppyAssistant;