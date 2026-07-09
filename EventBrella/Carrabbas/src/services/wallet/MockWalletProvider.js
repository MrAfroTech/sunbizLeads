/**
 * Mock Wallet Provider
 * 
 * Mock implementation of WalletProviderInterface for testing and development.
 * Simulates wallet operations without real payment processing.
 * 
 * Pattern: Mock Provider (similar to MockPOSService)
 */

import { WalletProviderInterface } from './WalletProviderInterface';

export class MockWalletProvider extends WalletProviderInterface {
  constructor(config = {}) {
    super(config);
    this.providerName = 'mock';
    this.isInitialized = false;
  }

  async initialize() {
    console.log('🔧 Initializing Mock Wallet Provider...');
    await this.simulateDelay(300);
    this.isInitialized = true;
    console.log('✅ Mock Wallet Provider initialized');
    return true;
  }

  async createWallet(userId, options = {}) {
    await this.simulateDelay(500);
    
    return {
      success: true,
      walletId: `wallet_${userId}_${Date.now()}`,
      userId,
      balanceCents: 0,
      status: 'active',
      provider: 'mock',
      createdAt: new Date().toISOString()
    };
  }

  async getBalance(walletId) {
    await this.simulateDelay(200);
    
    // Mock balance - in real implementation, this would query database
    return {
      success: true,
      walletId,
      balanceCents: 50000, // $500.00 in cents
      currency: 'USD'
    };
  }

  async loadFunds(walletId, amountCents, paymentDetails) {
    await this.simulateDelay(1500);
    
    // Simulate payment processing
    const isSuccess = Math.random() > 0.05; // 95% success rate
    
    if (!isSuccess) {
      throw new Error('Payment processing failed');
    }
    
    return {
      success: true,
      walletId,
      amountCents,
      transactionId: `txn_load_${Date.now()}`,
      newBalanceCents: 50000 + amountCents, // Mock new balance
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  }

  async authorize(walletId, amountCents, metadata = {}) {
    await this.simulateDelay(800);
    
    // Check if sufficient balance (mock check)
    const balance = await this.getBalance(walletId);
    if (balance.balanceCents < amountCents) {
      throw new Error('Insufficient funds');
    }
    
    const authorizationId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      authorizationId,
      walletId,
      amountCents,
      status: 'authorized',
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(), // 15 minutes
      timestamp: new Date().toISOString()
    };
  }

  async capture(authorizationId, metadata = {}) {
    await this.simulateDelay(600);
    
    return {
      success: true,
      captureId: `capt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorizationId,
      status: 'captured',
      timestamp: new Date().toISOString()
    };
  }

  async refund(captureId, amountCents = null, metadata = {}) {
    await this.simulateDelay(700);
    
    return {
      success: true,
      refundId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      captureId,
      amountCents: amountCents || null, // Full refund if not specified
      status: 'refunded',
      timestamp: new Date().toISOString()
    };
  }

  async getTransactionHistory(walletId, filters = {}) {
    await this.simulateDelay(400);
    
    // Mock transaction history
    const transactions = [
      {
        id: `txn_${Date.now() - 86400000}`,
        type: 'load',
        amountCents: 10000,
        status: 'completed',
        description: 'Added funds',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: `txn_${Date.now() - 172800000}`,
        type: 'payment',
        amountCents: -2500,
        status: 'completed',
        description: 'Food purchase',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    
    // Apply filters
    let filtered = transactions;
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return {
      success: true,
      transactions: filtered,
      total: filtered.length
    };
  }

  async validateConnection() {
    await this.simulateDelay(200);
    return {
      success: true,
      provider: 'mock',
      connected: true
    };
  }

  // Helper method to simulate API delays
  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default MockWalletProvider;

