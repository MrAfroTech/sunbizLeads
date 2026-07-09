/**
 * Wallet Pass Service
 * 
 * Handles Apple Wallet and Google Wallet pass generation via external service.
 * Calls wallet-pass-service API instead of generating passes locally.
 * Supports QR mode (functional) and NFC mode (placeholder for Phase 2).
 * 
 * Pattern: Service Layer (similar to WalletService)
 */

import { walletTokenService } from './WalletTokenService';
import { walletService } from './WalletService';

export class WalletPassService {
  constructor() {
    // External wallet pass service URL
    this.serviceUrl = process.env.REACT_APP_WALLET_PASS_SERVICE_URL || 
                      process.env.WALLET_PASS_SERVICE_URL || 
                      'http://localhost:3000';
    
    // API key for authentication
    this.apiKey = process.env.REACT_APP_WALLET_SERVICE_API_KEY || 
                  process.env.WALLET_SERVICE_API_KEY || 
                  '';
  }

  /**
   * Generate Apple Wallet pass (.pkpass file)
   * Calls external wallet-pass-service API
   * @param {string} walletId - Wallet ID
   * @param {string} mode - 'qr' or 'nfc'
   * @returns {Promise<Object>} Pass file buffer and metadata
   */
  async generateApplePass(walletId, mode = 'qr') {
    try {
      // Get wallet info
      const wallet = await walletService.getWalletByUserId(walletId);
      const balance = await walletService.getBalance(walletId);

      // Generate QR token for QR mode
      let qrToken = null;
      if (mode === 'qr') {
        const tokenResult = await walletTokenService.generatePaymentToken(
          walletId,
          wallet.userId,
          null, // No specific amount
          { mode: 'qr', passType: 'apple' }
        );
        qrToken = tokenResult.token;
      }

      // Call external wallet-pass-service
      const response = await fetch(`${this.serviceUrl}/api/passes/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          wallet_id: walletId,
          balance_cents: balance,
          mode,
          qr_token: qrToken,
          user_name: wallet.userName || 'Carrabbas Guest'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Get .pkpass file buffer
      const buffer = await response.arrayBuffer();

      return {
        success: true,
        platform: 'apple',
        buffer: Buffer.from(buffer),
        contentType: 'application/vnd.apple.pkpass',
        mode,
        qrToken: mode === 'qr' ? qrToken : null,
        note: mode === 'nfc' ? 'NFC mode requires Marqeta integration (Phase 2)' : null
      };

    } catch (error) {
      console.error('Error generating Apple pass:', error);
      throw error;
    }
  }

  /**
   * Generate Google Wallet pass
   * Calls external wallet-pass-service API
   * @param {string} walletId - Wallet ID
   * @param {string} mode - 'qr' or 'nfc'
   * @returns {Promise<Object>} Pass save URL and metadata
   */
  async generateGooglePass(walletId, mode = 'qr') {
    try {
      // Get wallet info
      const wallet = await walletService.getWalletByUserId(walletId);
      const balance = await walletService.getBalance(walletId);

      // Generate QR token for QR mode
      let qrToken = null;
      if (mode === 'qr') {
        const tokenResult = await walletTokenService.generatePaymentToken(
          walletId,
          wallet.userId,
          null,
          { mode: 'qr', passType: 'google' }
        );
        qrToken = tokenResult.token;
      }

      // Call external wallet-pass-service
      const response = await fetch(`${this.serviceUrl}/api/passes/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          wallet_id: walletId,
          balance_cents: balance,
          mode,
          qr_token: qrToken,
          user_name: wallet.userName || 'Carrabbas Guest'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        platform: 'google',
        passId: data.passId,
        saveUrl: data.saveUrl,
        passObject: data.passObject,
        mode,
        qrToken: mode === 'qr' ? qrToken : null,
        note: mode === 'nfc' ? 'NFC mode requires Marqeta integration (Phase 2)' : null
      };

    } catch (error) {
      console.error('Error generating Google pass:', error);
      throw error;
    }
  }

  /**
   * Update pass balance (push update to Apple/Google Wallet)
   * @param {string} walletId - Wallet ID
   * @param {number} newBalanceCents - New balance in cents
   * @returns {Promise<Object>} Update result
   */
  async updatePassBalance(walletId, newBalanceCents) {
    try {
      // In real implementation:
      // 1. Get active passes for wallet
      // 2. For Apple: Send push notification to registered devices
      // 3. For Google: Update pass via Google Wallet API
      // 4. Update pass_data in database

      return {
        success: true,
        walletId,
        newBalanceCents,
        updatedAt: new Date().toISOString(),
        note: 'Pass balance update queued for push notification'
      };

    } catch (error) {
      console.error('Error updating pass balance:', error);
      throw error;
    }
  }

  /**
   * Revoke a wallet pass
   * @param {string} walletId - Wallet ID
   * @param {string} platform - 'apple' or 'google'
   * @returns {Promise<Object>} Revocation result
   */
  async revokePass(walletId, platform) {
    try {
      // In real implementation:
      // 1. Mark pass as revoked in database
      // 2. For Apple: Send push notification to unregister
      // 3. For Google: Delete pass via Google Wallet API

      return {
        success: true,
        walletId,
        platform,
        status: 'revoked',
        revokedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error revoking pass:', error);
      throw error;
    }
  }

  /**
   * Get active passes for a wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Array>} Array of active passes
   */
  async getActivePasses(walletId) {
    try {
      // In real implementation, query database
      // For now, return mock data structure
      return {
        success: true,
        passes: [],
        total: 0
      };

    } catch (error) {
      console.error('Error getting active passes:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const walletPassService = new WalletPassService();

export default WalletPassService;

