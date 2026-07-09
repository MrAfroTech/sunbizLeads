/**
 * Authentication Service for Uber and Lyft
 * Handles OAuth flow and token storage
 */

import * as SecureStore from 'expo-secure-store';
import uberAPI from './uberAPI';
import lyftAPI from './lyftAPI';

const UBER_TOKEN_KEY = 'uber_access_token';
const UBER_REFRESH_TOKEN_KEY = 'uber_refresh_token';
const LYFT_TOKEN_KEY = 'lyft_access_token';
const LYFT_REFRESH_TOKEN_KEY = 'lyft_refresh_token';

class AuthService {
  /**
   * Get Uber authorization URL
   */
  getUberAuthURL(redirectURI) {
    return uberAPI.getAuthorizationURL(redirectURI);
  }

  /**
   * Get Lyft authorization URL
   */
  getLyftAuthURL(redirectURI) {
    return lyftAPI.getAuthorizationURL(redirectURI);
  }

  /**
   * Handle Uber OAuth callback
   */
  async handleUberCallback(code, redirectURI) {
    try {
      const tokens = await uberAPI.exchangeCodeForToken(code, redirectURI);
      await this.storeUberTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Uber OAuth error:', error);
      throw error;
    }
  }

  /**
   * Handle Lyft OAuth callback
   */
  async handleLyftCallback(code, redirectURI) {
    try {
      const tokens = await lyftAPI.exchangeCodeForToken(code, redirectURI);
      await this.storeLyftTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Lyft OAuth error:', error);
      throw error;
    }
  }

  /**
   * Store Uber tokens securely
   */
  async storeUberTokens(tokens) {
    await SecureStore.setItemAsync(UBER_TOKEN_KEY, tokens.access_token);
    if (tokens.refresh_token) {
      await SecureStore.setItemAsync(UBER_REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  }

  /**
   * Store Lyft tokens securely
   */
  async storeLyftTokens(tokens) {
    await SecureStore.setItemAsync(LYFT_TOKEN_KEY, tokens.access_token);
    if (tokens.refresh_token) {
      await SecureStore.setItemAsync(LYFT_REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  }

  /**
   * Get stored Uber access token
   */
  async getUberAccessToken() {
    try {
      return await SecureStore.getItemAsync(UBER_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting Uber token:', error);
      return null;
    }
  }

  /**
   * Get stored Lyft access token
   */
  async getLyftAccessToken() {
    try {
      return await SecureStore.getItemAsync(LYFT_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting Lyft token:', error);
      return null;
    }
  }

  /**
   * Refresh Uber token if needed
   */
  async refreshUberTokenIfNeeded() {
    try {
      const refreshToken = await SecureStore.getItemAsync(UBER_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return null;
      }

      const tokens = await uberAPI.refreshToken(refreshToken);
      await this.storeUberTokens(tokens);
      return tokens.access_token;
    } catch (error) {
      console.error('Error refreshing Uber token:', error);
      return null;
    }
  }

  /**
   * Refresh Lyft token if needed
   */
  async refreshLyftTokenIfNeeded() {
    try {
      const refreshToken = await SecureStore.getItemAsync(LYFT_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return null;
      }

      const tokens = await lyftAPI.refreshToken(refreshToken);
      await this.storeLyftTokens(tokens);
      return tokens.access_token;
    } catch (error) {
      console.error('Error refreshing Lyft token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated with Uber
   */
  async isUberAuthenticated() {
    const token = await this.getUberAccessToken();
    return !!token;
  }

  /**
   * Check if user is authenticated with Lyft
   */
  async isLyftAuthenticated() {
    const token = await this.getLyftAccessToken();
    return !!token;
  }

  /**
   * Disconnect Uber account
   */
  async disconnectUber() {
    try {
      await SecureStore.deleteItemAsync(UBER_TOKEN_KEY);
      await SecureStore.deleteItemAsync(UBER_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error disconnecting Uber:', error);
    }
  }

  /**
   * Disconnect Lyft account
   */
  async disconnectLyft() {
    try {
      await SecureStore.deleteItemAsync(LYFT_TOKEN_KEY);
      await SecureStore.deleteItemAsync(LYFT_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error disconnecting Lyft:', error);
    }
  }
}

export default new AuthService();

