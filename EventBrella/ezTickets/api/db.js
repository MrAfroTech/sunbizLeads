// api/db.js - Supabase database connection and utilities
const { createClient } = require('@supabase/supabase-js');

// Get Supabase configuration from environment
const getSupabaseConfig = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration: SUPABASE_URL and SUPABASE_ANON_KEY are required');
  }

  return {
    url: supabaseUrl,
    key: supabaseKey
  };
};

// Create Supabase client (reused across requests)
let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    const config = getSupabaseConfig();
    supabaseClient = createClient(config.url, config.key);
    console.log('✅ Supabase client created');
  }
  return supabaseClient;
}

// Initialize database tables (run once on first request or via migration)
// Note: Tables should be created via Supabase SQL Editor, but this ensures they exist
async function initializeDatabase() {
  const supabase = getSupabase();
  
  try {
    console.log('🔧 ===== INITIALIZING DATABASE =====');
    console.log('🔧 Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
    console.log('🔧 Supabase Key:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    
    // Test connection by querying tickets table
    console.log('🔧 Testing connection to tickets table...');
    const { data, error } = await supabase
      .from('tickets')
      .select('id')
      .limit(1);

    console.log('🔧 Query result:', {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message
    });

    if (error && error.code === '42P01') {
      // Table doesn't exist - should be created via SQL Editor
      console.warn('⚠️ Tickets table does not exist. Please run the SQL script in Supabase SQL Editor.');
      throw new Error('Tickets table does not exist. Run supabase-setup.sql in Supabase SQL Editor.');
    }

    if (error) {
      console.error('❌ Database connection error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }

    console.log('✅ Database connection verified');
    console.log('✅ Tickets table exists and is accessible');
  } catch (error) {
    console.error('❌ Database initialization error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    });
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tickets')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Database connection test failed:', error.message);
      return false;
    }

    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  getSupabase,
  initializeDatabase,
  testConnection
};
