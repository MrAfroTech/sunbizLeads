#!/usr/bin/env node

/**
 * Test script to validate credentials are set up correctly
 * Run with: node config/test-credentials.js
 */

const { validateCredentials, getServiceAccountEmail } = require('./credentials-config');

console.log('🔍 Testing aiAgents credentials setup...\n');

try {
  validateCredentials();

  const email = getServiceAccountEmail();
  console.log('\n📋 Next Steps:');
  console.log('1. Share your Google Sheets with this email (Editor permission):');
  console.log(`   ${email}`);
  console.log('2. Get your Sheet ID from the URL:');
  console.log('   https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit');
  console.log('3. Update your workflow configs with the Sheet ID');

  console.log('\n✅ All credentials validated successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Credential validation failed!');
  console.error(error.message);
  process.exit(1);
}
