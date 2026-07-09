/**
 * Base POS Service Interface
 * 
 * This abstract class defines the contract that all POS service implementations must follow.
 * Any POS system (Square, Clover, Toast, etc.) will extend this class.
 * 
 * Pattern: Abstract Factory Pattern
 * Purpose: Provider-agnostic interface for POS integration
 */

export class BasePOSService {
  constructor(config = {}) {
    if (this.constructor === BasePOSService) {
      throw new Error('BasePOSService is an abstract class and cannot be instantiated directly');
    }
    
    this.config = config;
    this.isInitialized = false;
    this.providerName = 'base';
  }

  /**
   * Initialize the POS service
   * Must be called before any other operations
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Check if POS system is available and healthy
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass');
  }

  /**
   * Fetch menu from POS system
   * @returns {Promise<Object>} Menu data in standardized format
   */
  async fetchMenu() {
    throw new Error('fetchMenu() must be implemented by subclass');
  }

  /**
   * Create an order in the POS system
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} Order confirmation
   */
  async createOrder(orderData) {
    throw new Error('createOrder() must be implemented by subclass');
  }

  /**
   * Get order status from POS system
   * @param {string} orderId - POS-specific order ID
   * @returns {Promise<Object>} Order status
   */
  async getOrderStatus(orderId) {
    throw new Error('getOrderStatus() must be implemented by subclass');
  }

  /**
   * Cancel/refund an order
   * @param {string} orderId - POS-specific order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelOrder(orderId, reason) {
    throw new Error('cancelOrder() must be implemented by subclass');
  }

  /**
   * Get vendor/location information
   * @returns {Promise<Object>} Vendor details
   */
  async getVendorInfo() {
    throw new Error('getVendorInfo() must be implemented by subclass');
  }

  /**
   * Validate credentials/connection
   * @returns {Promise<boolean>} Validation result
   */
  async validateConnection() {
    throw new Error('validateConnection() must be implemented by subclass');
  }

  /**
   * Get provider name
   * @returns {string} Provider name (e.g., 'square', 'clover', 'toast')
   */
  getProviderName() {
    return this.providerName;
  }

  /**
   * Check if service is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Format amount for POS system (many use cents)
   * @param {number} dollarAmount - Amount in dollars
   * @returns {number} Amount in POS system format
   */
  formatAmount(dollarAmount) {
    // Default: convert to cents (override if POS uses different format)
    return Math.round(parseFloat(dollarAmount) * 100);
  }

  /**
   * Normalize amount from POS system to dollars
   * @param {number} posAmount - Amount in POS system format
   * @returns {number} Amount in dollars
   */
  normalizeAmount(posAmount) {
    // Default: convert from cents (override if POS uses different format)
    return parseFloat(posAmount) / 100;
  }
}

export default BasePOSService;


