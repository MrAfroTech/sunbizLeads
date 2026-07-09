// api/game-day-eats/restaurants.js - Get Game Day Eats restaurants
// Vercel serverless function

const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    
    // Fetch all active restaurants, sorted by distance
    const { data, error } = await supabase
      .from('game_day_restaurants')
      .select('*')
      .eq('is_active', true)
      .order('distance_from_arena', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch restaurants', details: error.message });
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error in restaurants API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
