/**
 * Lyft API Client
 * Handles all Lyft API interactions including OAuth, estimates, and ride requests
 */

const LYFT_SANDBOX_URL = 'https://sandbox-api.lyft.com/v1';
const LYFT_PRODUCTION_URL = 'https://api.lyft.com/v1';

class LyftAPI {
  constructor() {
    this.baseURL = process.env.RIDE_API_ENV === 'production' 
      ? LYFT_PRODUCTION_URL 
      : LYFT_SANDBOX_URL;
    this.clientId = process.env.REACT_APP_LYFT_CLIENT_ID;
    this.clientSecret = process.env.REACT_APP_LYFT_CLIENT_SECRET;
    this.serverToken = process.env.REACT_APP_LYFT_SERVER_TOKEN;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationURL(redirectURI, state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectURI,
      scope: 'public profile rides.read rides.request offline',
      state: state || Math.random().toString(36).substring(7),
    });
    return `https://www.lyft.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, redirectURI) {
    const response = await fetch('https://api.lyft.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectURI,
      }),
    });

    if (!response.ok) {
      throw new Error(`Lyft OAuth error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    const response = await fetch('https://api.lyft.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Lyft token refresh error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get cost estimates
   */
  async getCostEstimates(startLat, startLng, endLat, endLng, accessToken) {
    const url = `${this.baseURL}/cost`;
    const params = new URLSearchParams({
      start_lat: startLat,
      start_lng: startLng,
      end_lat: endLat,
      end_lng: endLng,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lyft cost estimates error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cost_estimates || [];
  }

  /**
   * Get ETA estimates
   */
  async getETAEstimates(lat, lng, accessToken) {
    const url = `${this.baseURL}/eta`;
    const params = new URLSearchParams({
      lat: lat,
      lng: lng,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lyft ETA estimates error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.eta_estimates || [];
  }

  /**
   * Request a ride
   */
  async requestRide(rideType, origin, destination, accessToken) {
    const url = `${this.baseURL}/rides`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ride_type: rideType,
        origin: origin,
        destination: destination,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Lyft ride request error: ${error.error_description || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get ride status
   */
  async getRideStatus(rideId, accessToken) {
    const url = `${this.baseURL}/rides/${rideId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lyft ride status error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Cancel a ride
   */
  async cancelRide(rideId, accessToken) {
    const url = `${this.baseURL}/rides/${rideId}/cancel`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lyft cancel ride error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken) {
    const url = `${this.baseURL}/profile`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lyft profile error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default new LyftAPI();

