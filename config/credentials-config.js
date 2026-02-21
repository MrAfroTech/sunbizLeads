// config/credentials-config.js (Google Sheets – same pattern as workflows-speaking-production)
const path = require('path');
const fs = require('fs');

function getGoogleSheetsCredentials() {
  const fullJson = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (fullJson && fullJson.trim()) {
    try {
      const raw = typeof fullJson === 'string' ? JSON.parse(fullJson) : fullJson;
      return {
        type: raw.type || 'service_account',
        project_id: raw.project_id || '',
        client_email: raw.client_email,
        private_key: raw.private_key,
      };
    } catch (e) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT in .env is invalid JSON: ' + e.message);
    }
  }

  const fromEnv =
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (fromEnv) {
    return {
      type: 'service_account',
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID || '',
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  const credPath = path.resolve(process.cwd(), 'credentials', 'google-sheets-service-account.json');
  if (!fs.existsSync(credPath)) {
    throw new Error(
      'Google Sheets credentials not found. Set GOOGLE_SERVICE_ACCOUNT (full JSON) or GOOGLE_SHEETS_CLIENT_EMAIL+PRIVATE_KEY in .env, ' +
      'or place google-sheets-service-account.json in credentials/'
    );
  }
  const fileContent = fs.readFileSync(credPath, 'utf8').trim();
  if (!fileContent) {
    throw new Error('credentials/google-sheets-service-account.json is empty. Paste the full service account JSON into that file.');
  }
  try {
    const raw = JSON.parse(fileContent);
    return {
      type: raw.type || 'service_account',
      project_id: raw.project_id || '',
      client_email: raw.client_email,
      private_key: raw.private_key,
    };
  } catch (e) {
    throw new Error('credentials/google-sheets-service-account.json has invalid JSON: ' + e.message);
  }
}

module.exports = { getGoogleSheetsCredentials };
