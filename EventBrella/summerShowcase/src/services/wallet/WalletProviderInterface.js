/**
 * Wallet Provider Interface
 * 
 * Abstract interface that all wallet providers must implement.
 * This allows swapping between Mock, Marqeta, or other providers.
 * 
 * Pattern: Abstract Factory Pattern (similar to POS service layer)
 */

export class WalletProviderInterface {
  constructor(config = {}) {
    if (this.constructor === WalletProviderInterface) {
      throw new Error('WalletProviderInterface is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.providerName = 'base';
  }

  /**
   * Initialize the wallet provider
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Create a new wallet for a user
   * @param {string} userId - User ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created wallet data
   */
  async createWallet(userId, options = {}) {
    throw new Error('createWallet() must be implemented by subclass');
  }

  /**
   * Get wallet balance
   * @param {string} walletId - Wallet ID
   * @returns {Promise<number>} Balance in cents
   */
  async getBalance(walletId) {
    throw new Error('getBalance() must be implemented by subclass');
  }

  /**
   * Load funds into wallet
   * @param {string} walletId - Wallet ID
   * @param {number} amountCents - Amount in cents
   * @param {Object} paymentDetails - Payment method details
   * @returns {Promise<Object>} Transaction result
   */
  async loadFunds(walletId, amountCents, paymentDetails) {
    throw new Error('loadFunds() must be implemented by subclass');
  }

  /**
   * Authorize a payment (reserve funds)
   * @param {string} walletId - Wallet ID
   * @param {number} amountCents - Amount in cents
   * @param {Object} metadata - Transaction metadata
   * @returns {Promise<Object>} Authorization result with authorization_id
   */
  async authorize(walletId, amountCents, metadata = {}) {
    throw new Error('authorize() must be implemented by subclass');
  }

  /**
   * Capture an authorized payment (complete the transaction)
   * @param {string} authorizationId - Authorization ID from authorize()
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Capture result
   */
  async capture(authorizationId, metadata = {}) {
    throw new Error('capture() must be implemented by subclass');
  }

  /**
   * Refund a captured payment
   * @param {string} captureId - Capture ID from capture()
   * @param {number} amountCents - Amount to refund (optional, full refund if not specified)
   * @param {Object} metadata - Refund metadata
   * @returns {Promise<Object>} Refund result
   */
  async refund(captureId, amountCents = null, metadata = {}) {
    throw new Error('refund() must be implemented by subclass');
  }

  /**
   * Get transaction history
   * @param {string} walletId - Wallet ID
   * @param {Object} filters - Filter options (limit, offset, type, status)
   * @returns {Promise<Array>} Array of transactions
   */
  async getTransactionHistory(walletId, filters = {}) {
    throw new Error('getTransactionHistory() must be implemented by subclass');
  }

  /**
   * Get provider name
   * @returns {string} Provider name
   */
  getProviderName() {
    return this.providerName;
  }

  /**
   * Validate connection/credentials
   * @returns {Promise<boolean>} Validation result
   */
  async validateConnection() {
    throw new Error('validateConnection() must be implemented by subclass');
  }
}

export default WalletProviderInterface;

