/**
 * POS Configuration
 * 
 * Central configuration for POS integration.
 * Manages environment variables, provider settings, and connection details.
 * 
 * Pattern: Configuration Object
 * Purpose: Centralized configuration management
 */

/**
 * POS Provider Configurations
 * This object will store configuration templates for different POS systems
 */
export const POSProviderConfig = {
  mock: {
    name: 'Mock POS System',
    description: 'Mock POS service for testing and development',
    requiresAuth: false,
    supportsMenu: true,
    supportsOrders: true,
    supportsHealthCheck: true,
    environment: 'sandbox'
  },
  
  // Future POS providers will be added here when confirmed:
  // 
  // square: {
  //   name: 'Square',
  //   description: 'Square Point of Sale',
  //   requiresAuth: true,
  //   supportsMenu: true,
  //   supportsOrders: true,
  //   supportsHealthCheck: true,
  //   authType: 'oauth',
  //   apiBaseUrl: 'https://connect.squareup.com',
  //   sandboxUrl: 'https://connect.squareupsandbox.com'
  // },
  //
  // clover: {
  //   name: 'Clover',
  //   description: 'Clover Point of Sale',
  //   requiresAuth: true,
  //   supportsMenu: true,
  //   supportsOrders: true,
  //   supportsHealthCheck: true,
  //   authType: 'oauth',
  //   apiBaseUrl: 'https://api.clover.com',
  //   sandboxUrl: 'https://sandbox.dev.clover.com'
  // },
  //
  // toast: {
  //   name: 'Toast',
  //   description: 'Toast POS',
  //   requiresAuth: true,
  //   supportsMenu: true,
  //   supportsOrders: true,
  //   supportsHealthCheck: true,
  //   authType: 'api_key',
  //   apiBaseUrl: 'https://ws-api.toasttab.com'
  // }
};

/**
 * POS Configuration Manager
 */
export class POSConfig {
  constructor() {
    // Default configuration
    this.config = {
      // Active POS provider (will be set when POS system is confirmed)
      activeProvider: 'mock',
      
      // Environment (sandbox/production)
      environment: 'sandbox',
      
      // Timeout settings (milliseconds)
      connectionTimeout: 30000,
      healthCheckTimeout: 5000,
      
      // Retry settings
      maxRetries: 3,
      retryDelay: 1000,
      
      // Cache settings
      menuCacheDuration: 300000, // 5 minutes
      healthCheckCacheDuration: 60000, // 1 minute
      
      // Order settings
      defaultTaxRate: 0.08, // 8%
      autoConfirmOrders: true,
      
      // Feature flags
      enableHealthChecks: true,
      enableMenuCache: true,
      enableRetry: true,
      
      // Vendor settings
      vendors: []
    };
  }

  /**
   * Set active POS provider
   * @param {string} provider - Provider name
   */
  setActiveProvider(provider) {
    if (!(provider in POSProviderConfig)) {
      throw new Error(`Unknown POS provider: ${provider}`);
    }
    this.config.activeProvider = provider;
    console.log(`✅ Active POS provider set to: ${provider}`);
  }

  /**
   * Get active provider configuration
   * @returns {Object} Provider configuration
   */
  getActiveProviderConfig() {
    return POSProviderConfig[this.config.activeProvider];
  }

  /**
   * Add vendor configuration
   * @param {Object} vendorConfig - Vendor configuration
   */
  addVendor(vendorConfig) {
    const vendor = {
      id: vendorConfig.id,
      name: vendorConfig.name,
      provider: vendorConfig.provider || this.config.activeProvider,
      location: vendorConfig.location,
      credentials: vendorConfig.credentials || {},
      isActive: vendorConfig.isActive !== false
    };
    
    this.config.vendors.push(vendor);
    console.log(`✅ Added vendor: ${vendor.name}`);
  }

  /**
   * Get vendor by ID
   * @param {string} vendorId - Vendor ID
   * @returns {Object|null} Vendor configuration or null
   */
  getVendor(vendorId) {
    return this.config.vendors.find(v => v.id === vendorId) || null;
  }

  /**
   * Get all active vendors
   * @returns {Array<Object>} Active vendors
   */
  getActiveVendors() {
    return this.config.vendors.filter(v => v.isActive);
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  updateConfig(updates) {
    this.config = {
      ...this.config,
      ...updates
    };
    console.log('✅ Configuration updated');
  }

  /**
   * Get full configuration
   * @returns {Object} Complete configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get environment variable with fallback
   * @param {string} key - Environment variable key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Environment variable value or default
   */
  getEnvVar(key, defaultValue = null) {
    // React Native doesn't have process.env at runtime
    // You'll need to use react-native-config or similar for environment variables
    // For now, return default values
    return defaultValue;
  }

  /**
   * Validate configuration
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];
    
    if (!this.config.activeProvider) {
      errors.push('Active provider is required');
    }
    
    if (!(this.config.activeProvider in POSProviderConfig)) {
      errors.push(`Invalid provider: ${this.config.activeProvider}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.config = {
      activeProvider: 'mock',
      environment: 'sandbox',
      connectionTimeout: 30000,
      healthCheckTimeout: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      menuCacheDuration: 300000,
      healthCheckCacheDuration: 60000,
      defaultTaxRate: 0.08,
      autoConfirmOrders: true,
      enableHealthChecks: true,
      enableMenuCache: true,
      enableRetry: true,
      vendors: []
    };
    console.log('✅ Configuration reset to defaults');
  }
}

// Export singleton instance
export const posConfig = new POSConfig();

export default {
  POSProviderConfig,
  POSConfig,
  posConfig
};


