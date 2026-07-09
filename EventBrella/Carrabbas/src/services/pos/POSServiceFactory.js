/**
 * POS Service Factory
 * 
 * Creates appropriate POS service instances based on provider type.
 * This is the main entry point for POS operations.
 * 
 * Pattern: Factory Pattern
 * Purpose: Create POS service instances without coupling to specific implementations
 */

import { BasePOSService } from './BasePOSService';

/**
 * Mock POS Service for testing/development
 * This can be used until a real POS system is connected
 */
class MockPOSService extends BasePOSService {
  constructor(config = {}) {
    super(config);
    this.providerName = 'mock';
  }

  async initialize() {
    console.log('🔧 Initializing Mock POS Service...');
    await this.simulateDelay(500);
    this.isInitialized = true;
    return true;
  }

  async healthCheck() {
    return {
      healthy: true,
      provider: this.providerName,
      responseTime: 100,
      timestamp: new Date().toISOString()
    };
  }

  async fetchMenu() {
    await this.simulateDelay(800);
    return {
      success: true,
      menu: {
        categories: [
          {
            id: 'cat_1',
            name: 'Food',
            items: [
              {
                id: 'item_1',
                name: 'Hot Dog',
                description: 'Classic stadium hot dog',
                price: 8.50,
                available: true,
                imageUrl: null
              },
              {
                id: 'item_2',
                name: 'Nachos',
                description: 'Loaded nachos with cheese',
                price: 12.00,
                available: true,
                imageUrl: null
              }
            ]
          },
          {
            id: 'cat_2',
            name: 'Beverages',
            items: [
              {
                id: 'item_3',
                name: 'Soft Drink',
                description: 'Choice of soda',
                price: 5.50,
                available: true,
                imageUrl: null
              },
              {
                id: 'item_4',
                name: 'Beer',
                description: 'Domestic draft beer',
                price: 11.00,
                available: true,
                imageUrl: null
              }
            ]
          }
        ],
        lastSynced: new Date().toISOString()
      }
    };
  }

  async createOrder(orderData) {
    await this.simulateDelay(1200);
    return {
      success: true,
      orderId: `MOCK-${Date.now()}`,
      status: 'PENDING',
      total: orderData.total,
      estimatedReadyTime: new Date(Date.now() + 15 * 60000).toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  async getOrderStatus(orderId) {
    await this.simulateDelay(300);
    return {
      success: true,
      orderId,
      status: 'PREPARING',
      updatedAt: new Date().toISOString()
    };
  }

  async cancelOrder(orderId, reason) {
    await this.simulateDelay(600);
    return {
      success: true,
      orderId,
      status: 'CANCELLED',
      reason,
      refundStatus: 'PENDING',
      timestamp: new Date().toISOString()
    };
  }

  async getVendorInfo() {
    return {
      success: true,
      vendor: {
        id: 'mock_vendor_1',
        name: 'Mock Concessions',
        location: 'KIA Center - Section 101',
        isOpen: true,
        acceptingOrders: true
      }
    };
  }

  async validateConnection() {
    await this.simulateDelay(200);
    return true;
  }

  // Helper method to simulate API delays
  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * POS Service Factory
 * Main factory class for creating POS service instances
 */
export class POSServiceFactory {
  static providers = {
    mock: MockPOSService,
    // Future POS providers will be registered here:
    // square: SquarePOSService,
    // clover: CloverPOSService,
    // toast: ToastPOSService,
    // touchbistro: TouchBistroPOSService,
    // ncr_aloha: NCRALohaPOSService,
  };

  /**
   * Register a new POS provider
   * @param {string} providerName - Provider identifier (e.g., 'square', 'clover')
   * @param {Class} ServiceClass - POS service class extending BasePOSService
   */
  static registerProvider(providerName, ServiceClass) {
    if (!(ServiceClass.prototype instanceof BasePOSService)) {
      throw new Error('Service class must extend BasePOSService');
    }
    this.providers[providerName] = ServiceClass;
    console.log(`✅ Registered POS provider: ${providerName}`);
  }

  /**
   * Create a POS service instance
   * @param {string} providerName - Provider identifier
   * @param {Object} config - Provider-specific configuration
   * @returns {BasePOSService} POS service instance
   */
  static createService(providerName, config = {}) {
    const ServiceClass = this.providers[providerName];
    
    if (!ServiceClass) {
      console.warn(`⚠️ POS provider '${providerName}' not found. Falling back to mock service.`);
      return new MockPOSService(config);
    }

    console.log(`🏭 Creating ${providerName} POS service`);
    return new ServiceClass(config);
  }

  /**
   * Get list of supported providers
   * @returns {Array<string>} List of provider names
   */
  static getSupportedProviders() {
    return Object.keys(this.providers);
  }

  /**
   * Check if a provider is available
   * @param {string} providerName - Provider identifier
   * @returns {boolean} True if provider is registered
   */
  static isProviderSupported(providerName) {
    return providerName in this.providers;
  }

  /**
   * Create and initialize a POS service
   * @param {string} providerName - Provider identifier
   * @param {Object} config - Provider-specific configuration
   * @returns {Promise<BasePOSService>} Initialized POS service instance
   */
  static async createAndInitialize(providerName, config = {}) {
    const service = this.createService(providerName, config);
    
    try {
      await service.initialize();
      console.log(`✅ ${providerName} POS service initialized successfully`);
      return service;
    } catch (error) {
      console.error(`❌ Failed to initialize ${providerName} POS service:`, error);
      throw error;
    }
  }
}

export default POSServiceFactory;


