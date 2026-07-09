/**
 * POS Data Structures
 * 
 * Standardized data formats for menu items, orders, and transactions.
 * These structures are provider-agnostic and can be mapped to/from any POS system.
 * 
 * Pattern: Data Transfer Objects (DTOs)
 * Purpose: Consistent data format regardless of POS provider
 */

/**
 * Menu Item
 * Represents a single item available for purchase
 */
export class MenuItem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.category = data.category || 'Uncategorized';
    this.available = data.available !== false; // Default to true
    this.imageUrl = data.imageUrl || null;
    this.modifiers = data.modifiers || []; // Array of ModifierGroup
    this.metadata = data.metadata || {}; // POS-specific data
  }

  /**
   * Validate menu item data
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];
    
    if (!this.id) errors.push('Item ID is required');
    if (!this.name) errors.push('Item name is required');
    if (typeof this.price !== 'number' || this.price < 0) {
      errors.push('Valid price is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON format
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      available: this.available,
      imageUrl: this.imageUrl,
      modifiers: this.modifiers,
      metadata: this.metadata
    };
  }
}

/**
 * Modifier Group
 * Represents customizations for a menu item (e.g., size, extras)
 */
export class ModifierGroup {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.options = data.options || []; // Array of ModifierOption
    this.minSelections = data.minSelections || 0;
    this.maxSelections = data.maxSelections || 1;
    this.required = data.required || false;
  }
}

/**
 * Modifier Option
 * Individual option within a modifier group
 */
export class ModifierOption {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.priceAdjustment = data.priceAdjustment || 0; // +/- price
  }
}

/**
 * Menu Category
 * Groups related menu items together
 */
export class MenuCategory {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.items = data.items || []; // Array of MenuItem
    this.sortOrder = data.sortOrder || 0;
  }

  /**
   * Add item to category
   * @param {MenuItem} item - Menu item to add
   */
  addItem(item) {
    if (!(item instanceof MenuItem)) {
      throw new Error('Item must be an instance of MenuItem');
    }
    this.items.push(item);
  }

  /**
   * Get available items only
   * @returns {Array<MenuItem>} Available items
   */
  getAvailableItems() {
    return this.items.filter(item => item.available);
  }
}

/**
 * Menu
 * Complete menu structure from POS system
 */
export class Menu {
  constructor(data = {}) {
    this.id = data.id || null;
    this.vendorId = data.vendorId || null;
    this.vendorName = data.vendorName || '';
    this.categories = data.categories || []; // Array of MenuCategory
    this.lastSynced = data.lastSynced || null;
    this.version = data.version || 1;
    this.metadata = data.metadata || {};
  }

  /**
   * Find item by ID
   * @param {string} itemId - Item ID to search for
   * @returns {MenuItem|null} Found item or null
   */
  findItemById(itemId) {
    for (const category of this.categories) {
      const item = category.items.find(item => item.id === itemId);
      if (item) return item;
    }
    return null;
  }

  /**
   * Get all items (flattened)
   * @returns {Array<MenuItem>} All menu items
   */
  getAllItems() {
    return this.categories.flatMap(category => category.items);
  }

  /**
   * Get total item count
   * @returns {number} Total number of items
   */
  getTotalItemCount() {
    return this.getAllItems().length;
  }

  /**
   * Convert to JSON format
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      vendorId: this.vendorId,
      vendorName: this.vendorName,
      categories: this.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        items: cat.items.map(item => item.toJSON())
      })),
      lastSynced: this.lastSynced,
      version: this.version,
      metadata: this.metadata
    };
  }
}

/**
 * Order Item
 * Individual item within an order
 */
export class OrderItem {
  constructor(data = {}) {
    this.menuItemId = data.menuItemId || null;
    this.name = data.name || '';
    this.quantity = data.quantity || 1;
    this.unitPrice = data.unitPrice || 0;
    this.modifiers = data.modifiers || []; // Array of selected ModifierOption
    this.specialInstructions = data.specialInstructions || '';
    this.subtotal = data.subtotal || (this.quantity * this.unitPrice);
  }

  /**
   * Calculate total price including modifiers
   * @returns {number} Total price
   */
  calculateTotal() {
    const modifierTotal = this.modifiers.reduce(
      (sum, mod) => sum + (mod.priceAdjustment || 0),
      0
    );
    return (this.unitPrice + modifierTotal) * this.quantity;
  }

  /**
   * Convert to JSON format
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      menuItemId: this.menuItemId,
      name: this.name,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      modifiers: this.modifiers,
      specialInstructions: this.specialInstructions,
      subtotal: this.calculateTotal()
    };
  }
}

/**
 * Order
 * Complete order structure
 */
export class Order {
  constructor(data = {}) {
    this.id = data.id || null;
    this.posOrderId = data.posOrderId || null; // POS system's order ID
    this.customerId = data.customerId || null;
    this.customerName = data.customerName || '';
    this.vendorId = data.vendorId || null;
    this.vendorName = data.vendorName || '';
    this.items = data.items || []; // Array of OrderItem
    this.status = data.status || 'PENDING'; // PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
    this.subtotal = data.subtotal || 0;
    this.tax = data.tax || 0;
    this.tip = data.tip || 0;
    this.total = data.total || 0;
    this.paymentStatus = data.paymentStatus || 'PENDING';
    this.paymentMethod = data.paymentMethod || null;
    this.pickupLocation = data.pickupLocation || '';
    this.estimatedReadyTime = data.estimatedReadyTime || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  /**
   * Add item to order
   * @param {OrderItem} item - Order item to add
   */
  addItem(item) {
    if (!(item instanceof OrderItem)) {
      throw new Error('Item must be an instance of OrderItem');
    }
    this.items.push(item);
    this.recalculateTotal();
  }

  /**
   * Remove item from order
   * @param {number} index - Item index to remove
   */
  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.recalculateTotal();
    }
  }

  /**
   * Recalculate order totals
   */
  recalculateTotal() {
    this.subtotal = this.items.reduce(
      (sum, item) => sum + item.calculateTotal(),
      0
    );
    this.tax = this.subtotal * 0.08; // 8% tax (should be configurable)
    this.total = this.subtotal + this.tax + this.tip;
  }

  /**
   * Validate order
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];
    
    if (!this.customerId) errors.push('Customer ID is required');
    if (!this.vendorId) errors.push('Vendor ID is required');
    if (this.items.length === 0) errors.push('Order must contain at least one item');
    if (this.total <= 0) errors.push('Order total must be greater than zero');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON format
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      posOrderId: this.posOrderId,
      customerId: this.customerId,
      customerName: this.customerName,
      vendorId: this.vendorId,
      vendorName: this.vendorName,
      items: this.items.map(item => item.toJSON()),
      status: this.status,
      subtotal: this.subtotal,
      tax: this.tax,
      tip: this.tip,
      total: this.total,
      paymentStatus: this.paymentStatus,
      paymentMethod: this.paymentMethod,
      pickupLocation: this.pickupLocation,
      estimatedReadyTime: this.estimatedReadyTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }
}

/**
 * Order Status Types
 */
export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

/**
 * Payment Status Types
 */
export const PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

/**
 * Vendor Configuration
 * Stores POS system connection details for a vendor
 */
export class VendorConfig {
  constructor(data = {}) {
    this.vendorId = data.vendorId || null;
    this.vendorName = data.vendorName || '';
    this.posProvider = data.posProvider || 'mock'; // square, clover, toast, etc.
    this.isActive = data.isActive !== false; // Default to true
    this.acceptingOrders = data.acceptingOrders !== false;
    this.location = data.location || '';
    this.credentials = data.credentials || {}; // POS-specific credentials
    this.lastHealthCheck = data.lastHealthCheck || null;
    this.lastMenuSync = data.lastMenuSync || null;
    this.metadata = data.metadata || {};
  }

  /**
   * Check if vendor is available for orders
   * @returns {boolean} Availability status
   */
  isAvailable() {
    return this.isActive && this.acceptingOrders;
  }

  /**
   * Convert to JSON format (excluding sensitive data)
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      vendorId: this.vendorId,
      vendorName: this.vendorName,
      posProvider: this.posProvider,
      isActive: this.isActive,
      acceptingOrders: this.acceptingOrders,
      location: this.location,
      lastHealthCheck: this.lastHealthCheck,
      lastMenuSync: this.lastMenuSync,
      metadata: this.metadata
      // Note: credentials intentionally excluded for security
    };
  }
}

export default {
  MenuItem,
  ModifierGroup,
  ModifierOption,
  MenuCategory,
  Menu,
  OrderItem,
  Order,
  OrderStatus,
  PaymentStatus,
  VendorConfig
};


