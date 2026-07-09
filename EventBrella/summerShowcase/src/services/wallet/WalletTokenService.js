/**
 * Wallet Token Service
 * 
 * Handles QR token generation and validation for POS scanning.
 * Uses JWT for secure token generation.
 * 
 * Pattern: Token Service (similar to ticket QR code generation)
 */

import jwt from 'jsonwebtoken';

export class WalletTokenService {
  constructor() {
    // JWT secret - in production, use environment variable
    this.secret = process.env.JWT_SECRET || 'orlando-pirates-wallet-secret-key-change-in-production';
    this.tokenExpiration = 15 * 60; // 15 minutes in seconds
  }

  /**
   * Generate QR token for wallet payment
   * @param {string} walletId - Wallet ID
   * @param {string} userId - User ID
   * @param {number} amountCents - Amount to authorize (optional)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Token data
   */
  async generatePaymentToken(walletId, userId, amountCents = null, metadata = {}) {
    try {
      const expiresAt = new Date(Date.now() + this.tokenExpiration * 1000);
      
      const payload = {
        walletId,
        userId,
        amountCents,
        type: 'qr_payment',
        expiresAt: expiresAt.toISOString(),
        ...metadata
      };
      
      // Generate JWT token
      const token = jwt.sign(payload, this.secret, {
        expiresIn: this.tokenExpiration
      });
      
      // In real implementation, save token to Supabase wallet_tokens table
      // await this.saveTokenToDatabase({
      //   walletId,
      //   userId,
      //   token,
      //   tokenType: 'qr_payment',
      //   expiresAt,
      //   amountCents,
      //   status: 'active'
      // });
      
      return {
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        walletId,
        userId,
        amountCents
      };
    } catch (error) {
      console.error('Error generating payment token:', error);
      throw error;
    }
  }

  /**
   * Generate QR token for balance check
   * @param {string} walletId - Wallet ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Token data
   */
  async generateBalanceToken(walletId, userId) {
    try {
      const expiresAt = new Date(Date.now() + this.tokenExpiration * 1000);
      
      const payload = {
        walletId,
        userId,
        type: 'qr_balance_check',
        expiresAt: expiresAt.toISOString()
      };
      
      const token = jwt.sign(payload, this.secret, {
        expiresIn: this.tokenExpiration
      });
      
      return {
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        walletId,
        userId
      };
    } catch (error) {
      console.error('Error generating balance token:', error);
      throw error;
    }
  }

  /**
   * Validate and decode QR token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token data
   */
  async validateToken(token) {
    try {
      // Verify and decode JWT
      const decoded = jwt.verify(token, this.secret);
      
      // Check expiration
      if (new Date(decoded.expiresAt) < new Date()) {
        throw new Error('Token has expired');
      }
      
      // In real implementation, check token status in Supabase
      // const tokenRecord = await this.getTokenFromDatabase(token);
      // if (!tokenRecord || tokenRecord.status !== 'active') {
      //   throw new Error('Token is invalid or has been used');
      // }
      
      return {
        success: true,
        valid: true,
        data: decoded
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return {
          success: false,
          valid: false,
          error: 'Invalid token'
        };
      }
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          valid: false,
          error: 'Token has expired'
        };
      }
      
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Mark token as used
   * @param {string} token - JWT token
   * @param {string} usedBy - Who used the token (POS system, merchant ID)
   * @returns {Promise<Object>} Update result
   */
  async markTokenAsUsed(token, usedBy) {
    try {
      // In real implementation, update token in Supabase
      // await this.updateTokenInDatabase(token, {
      //   status: 'used',
      //   usedAt: new Date().toISOString(),
      //   usedBy
      // });
      
      return {
        success: true,
        token,
        status: 'used',
        usedBy,
        usedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error marking token as used:', error);
      throw error;
    }
  }

  /**
   * Revoke a token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Revocation result
   */
  async revokeToken(token) {
    try {
      // In real implementation, update token status in Supabase
      // await this.updateTokenInDatabase(token, {
      //   status: 'revoked',
      //   updatedAt: new Date().toISOString()
      // });
      
      return {
        success: true,
        token,
        status: 'revoked'
      };
    } catch (error) {
      console.error('Error revoking token:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const walletTokenService = new WalletTokenService();

export default WalletTokenService;

