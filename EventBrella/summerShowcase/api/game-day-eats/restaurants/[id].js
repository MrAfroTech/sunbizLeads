// api/game-day-eats/restaurants/[id].js - Get single restaurant by ID
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
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const supabase = getSupabase();
    
    // Fetch restaurant by ID
    const { data, error } = await supabase
      .from('game_day_restaurants')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch restaurant', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in restaurant API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
