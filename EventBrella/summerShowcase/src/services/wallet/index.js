/**
 * Wallet Service Layer - Main Export
 * 
 * This module provides a complete wallet integration foundation.
 * 
 * Usage:
 * import { walletService, walletTokenService, walletPassService } from './services/wallet';
 */

// Services
export { WalletService, walletService } from './WalletService';
export { WalletTokenService, walletTokenService } from './WalletTokenService';
export { WalletPassService, walletPassService } from './WalletPassService';

// Providers
export { WalletProviderInterface } from './WalletProviderInterface';
export { MockWalletProvider } from './MockWalletProvider';

// Default export
export default {
  walletService,
  walletTokenService,
  walletPassService
};

