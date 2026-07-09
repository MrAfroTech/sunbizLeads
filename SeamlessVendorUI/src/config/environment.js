// Environment Configuration Helper
// Automatically detects environment and loads appropriate config

const getEnvironment = () => {
  // Check for explicit environment variable
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  
  // Check for React app environment
  if (process.env.REACT_APP_NODE_ENV) {
    return process.env.REACT_APP_NODE_ENV;
  }
  
  // Default to development
  return 'development';
};

const isProduction = () => getEnvironment() === 'production';
const isDevelopment = () => getEnvironment() === 'development';
const isStaging = () => getEnvironment() === 'staging';

const getApiBaseURL = () => {
  if (isProduction()) {
    return process.env.REACT_APP_API_BASE_URL || 'https://api.yourdomain.com';
  }
  
  if (isStaging()) {
    return process.env.REACT_APP_API_BASE_URL || 'https://api-staging.yourdomain.com';
  }
  
  // Development
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
};

const getStripeConfig = () => {
  if (isProduction()) {
    return {
      publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
      environment: 'production'
    };
  }
  
  // Development and staging use test keys
  return {
    publishableKey: process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY,
    environment: 'test'
  };
};

const getKlaviyoConfig = () => {
  if (isProduction()) {
    return {
      listId: process.env.KLAVIYO_LIST_ID,
      clientListId: process.env.KLAVIYO_CLIENT_LIST_ID
    };
  }
  
  // Development and staging use dev lists
  return {
    listId: process.env.KLAVIYO_DEV_LIST_ID || process.env.KLAVIYO_LIST_ID,
    clientListId: process.env.KLAVIYO_DEV_CLIENT_LIST_ID || process.env.KLAVIYO_CLIENT_LIST_ID
  };
};

const getSquareConfig = () => {
  if (isProduction()) {
    return {
      clientId: process.env.REACT_APP_SQUARE_CLIENT_ID,
      clientSecret: process.env.SQUARE_CLIENT_SECRET,
      accessToken: process.env.SQUARE_ACCESS_TOKEN
    };
  }
  
  // Development and staging use sandbox
  return {
    clientId: process.env.REACT_APP_SQUARE_SANDBOX_CLIENT_ID || process.env.REACT_APP_SQUARE_CLIENT_ID,
    clientSecret: process.env.SQUARE_SANDBOX_CLIENT_SECRET || process.env.SQUARE_CLIENT_SECRET,
    accessToken: process.env.SQUARE_SANDBOX_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN
  };
};

const getCloverConfig = () => {
  // Always use production Clover credentials for now
  return {
    clientId: process.env.REACT_APP_CLOVER_CLIENT_ID,
    clientSecret: process.env.REACT_APP_CLOVER_CLIENT_SECRET,
    redirectUri: process.env.REACT_APP_CLOVER_REDIRECT_URI
  };
};

const getDatabaseConfig = () => {
  if (isProduction()) {
    return {
      url: process.env.DATABASE_URL,
      ssl: true
    };
  }
  
  // Development and staging
  return {
    url: process.env.DATABASE_URL,
    ssl: false
  };
};

const getAwsConfig = () => {
  return {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
};

// Configuration object
const config = {
  environment: getEnvironment(),
  isProduction,
  isDevelopment,
  isStaging,
  
  // API Configuration
  api: {
    baseURL: getApiBaseURL(),
    timeout: isProduction() ? 30000 : 60000
  },
  
  // Stripe Configuration
  stripe: getStripeConfig(),
  
  // Klaviyo Configuration
  klaviyo: getKlaviyoConfig(),
  
  // Square Configuration
  square: getSquareConfig(),
  
  // Clover Configuration
  clover: getCloverConfig(),
  
  // Database Configuration
  database: getDatabaseConfig(),
  
  // AWS Configuration
  aws: getAwsConfig(),
  
  // Feature Flags
  features: {
    demoMode: process.env.REACT_APP_DEMO_MODE === 'true',
    continuousTracking: process.env.REACT_APP_ENABLE_CONTINUOUS_TRACKING === 'true',
    googleMaps: !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  },
  
  // URLs
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    api: getApiBaseURL()
  }
};

// Development logging
if (isDevelopment()) {
  console.log('🔧 Environment Configuration:', {
    environment: config.environment,
    apiBaseURL: config.api.baseURL,
    stripeEnvironment: config.stripe.environment,
    demoMode: config.features.demoMode
  });
}

export default config;
