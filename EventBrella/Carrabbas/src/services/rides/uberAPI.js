/**
 * Uber API Client
 * Handles all Uber API interactions including OAuth, estimates, and ride requests
 */

const UBER_SANDBOX_URL = 'https://sandbox-api.uber.com/v1.2';
const UBER_PRODUCTION_URL = 'https://api.uber.com/v1.2';

class UberAPI {
  constructor() {
    this.baseURL = process.env.UBER_API_ENV === 'production' 
      ? UBER_PRODUCTION_URL 
      : UBER_SANDBOX_URL;
    this.clientId = process.env.REACT_APP_UBER_CLIENT_ID;
    this.clientSecret = process.env.REACT_APP_UBER_CLIENT_SECRET;
    this.serverToken = process.env.REACT_APP_UBER_SERVER_TOKEN;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationURL(redirectURI, state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectURI,
      scope: 'profile request',
      state: state || Math.random().toString(36).substring(7),
    });
    return `https://login.uber.com/oauth/v2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, redirectURI) {
    const response = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectURI,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Uber OAuth error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    const response = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Uber token refresh error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get price estimates
   */
  async getPriceEstimates(startLat, startLng, endLat, endLng, accessToken) {
    const url = `${this.baseURL}/estimates/price`;
    const params = new URLSearchParams({
      start_latitude: startLat,
      start_longitude: startLng,
      end_latitude: endLat,
      end_longitude: endLng,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Uber price estimates error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prices || [];
  }

  /**
   * Get time estimates
   */
  async getTimeEstimates(startLat, startLng, accessToken) {
    const url = `${this.baseURL}/estimates/time`;
    const params = new URLSearchParams({
      start_latitude: startLat,
      start_longitude: startLng,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Uber time estimates error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.times || [];
  }

  /**
   * Request a ride
   */
  async requestRide(productId, startLat, startLng, endLat, endLng, fareId, accessToken) {
    const url = `${this.baseURL}/requests`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        start_latitude: startLat,
        start_longitude: startLng,
        end_latitude: endLat,
        end_longitude: endLng,
        fare_id: fareId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Uber ride request error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get ride status
   */
  async getRideStatus(requestId, accessToken) {
    const url = `${this.baseURL}/requests/${requestId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Uber ride status error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Cancel a ride
   */
  async cancelRide(requestId, accessToken) {
    const url = `${this.baseURL}/requests/${requestId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Uber cancel ride error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken) {
    const url = `${this.baseURL}/me`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Uber profile error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default new UberAPI();

