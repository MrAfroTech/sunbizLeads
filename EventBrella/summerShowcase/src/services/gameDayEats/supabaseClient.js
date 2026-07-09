// Supabase client for Game Day Eats feature
// This service handles all Supabase interactions for restaurant data

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
// In production, these should be set in your environment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase configuration missing. Using fallback mode.');
      return null;
    }
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export async function fetchRestaurants() {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      // Fallback: return empty array or fetch from API endpoint
      const response = await fetch('/api/game-day-eats/restaurants');
      if (response.ok) {
        return await response.json();
      }
      return [];
    }

    const { data, error } = await supabase
      .from('game_day_restaurants')
      .select('*')
      .eq('is_active', true)
      .order('distance_from_arena', { ascending: true });

    if (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRestaurants:', error);
    throw error;
  }
}

export async function fetchRestaurantById(id) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      const response = await fetch(`/api/game-day-eats/restaurants/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    }

    const { data, error } = await supabase
      .from('game_day_restaurants')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching restaurant:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchRestaurantById:', error);
    throw error;
  }
}
