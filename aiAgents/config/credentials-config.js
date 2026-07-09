const fs = require('fs');
const path = require('path');

/**
 * Credentials Configuration Module
 * Centralized loading and validation of API credentials
 */

const CREDENTIALS_DIR = path.join(__dirname, '../credentials');

/**
 * Load Google Sheets Service Account credentials
 * @returns {Object} Parsed JSON credentials
 * @throws {Error} If credentials file not found or invalid
 */
function getGoogleSheetsCredentials() {
  const credPath = path.join(CREDENTIALS_DIR, 'google-sheets-service-account.json');

  if (!fs.existsSync(credPath)) {
    throw new Error(
      `Google Sheets credentials not found at: ${credPath}\n` +
      `Please copy your service account JSON file to: ${CREDENTIALS_DIR}/google-sheets-service-account.json`
    );
  }

  try {
    const credentialsRaw = fs.readFileSync(credPath, 'utf8');
    const credentials = JSON.parse(credentialsRaw);

    // Validate required fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !credentials[field]);

    if (missingFields.length > 0) {
      throw new Error(`Invalid credentials file. Missing fields: ${missingFields.join(', ')}`);
    }

    return credentials;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in credentials file: ${credPath}`);
    }
    throw error;
  }
}

/**
 * Get service account email (useful for documentation/sharing instructions)
 * @returns {string} Service account email address
 */
function getServiceAccountEmail() {
  const credentials = getGoogleSheetsCredentials();
  return credentials.client_email;
}

/**
 * Validate that credentials exist and are valid
 * @returns {boolean} True if valid, throws error otherwise
 */
function validateCredentials() {
  try {
    const credentials = getGoogleSheetsCredentials();
    console.log('✅ Google Sheets credentials validated successfully');
    console.log(`📧 Service Account: ${credentials.client_email}`);
    return true;
  } catch (error) {
    console.error('❌ Credential validation failed:', error.message);
    throw error;
  }
}

/**
 * Load other API keys (for future expansion)
 */
function getAnthropicApiKey() {
  const keyPath = path.join(CREDENTIALS_DIR, 'anthropic-api-key.txt');
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Anthropic API key not found at: ${keyPath}`);
  }
  return fs.readFileSync(keyPath, 'utf8').trim();
}

function getBrevoApiKey() {
  const keyPath = path.join(CREDENTIALS_DIR, 'brevo-api-key.txt');
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Brevo API key not found at: ${keyPath}`);
  }
  return fs.readFileSync(keyPath, 'utf8').trim();
}

function getSerpApiKey() {
  const keyPath = path.join(CREDENTIALS_DIR, 'serpapi-key.txt');
  if (!fs.existsSync(keyPath)) {
    throw new Error(`SerpAPI key not found at: ${keyPath}`);
  }
  return fs.readFileSync(keyPath, 'utf8').trim();
}

module.exports = {
  getGoogleSheetsCredentials,
  getServiceAccountEmail,
  validateCredentials,
  getAnthropicApiKey,
  getBrevoApiKey,
  getSerpApiKey
};
