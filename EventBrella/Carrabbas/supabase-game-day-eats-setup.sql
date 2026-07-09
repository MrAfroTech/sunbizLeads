-- Game Day Eats - Supabase Table Setup
-- Run this SQL in your Supabase SQL Editor to create the table and seed initial data

-- Create game_day_restaurants table
CREATE TABLE IF NOT EXISTS game_day_restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  food_type TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  distance_from_arena DECIMAL(5, 2) NOT NULL, -- Distance in miles
  promo_badge TEXT, -- e.g., "Free Appetizer", "$10 Off"
  promo_description TEXT, -- Detailed promo description
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_day_restaurants_active ON game_day_restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_game_day_restaurants_distance ON game_day_restaurants(distance_from_arena);

-- Enable Row Level Security (RLS)
ALTER TABLE game_day_restaurants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to active restaurants
CREATE POLICY "Allow public read access to active restaurants"
  ON game_day_restaurants
  FOR SELECT
  USING (is_active = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_game_day_restaurants_updated_at
  BEFORE UPDATE ON game_day_restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed data: 3 restaurants near Kia Center, Orlando
-- Kia Center coordinates: 28.5392, -81.3839

INSERT INTO game_day_restaurants (name, food_type, address, latitude, longitude, distance_from_arena, promo_badge, promo_description, is_active) VALUES
(
  'The Rusty Spoon',
  'Sports Bar',
  '55 W Church St, Orlando, FL 32801',
  28.5415,
  -81.3789,
  0.3,
  'Free Appetizer',
  'Show your game ticket and get a free appetizer with any entree purchase',
  true
),
(
  'Cask & Larder',
  'BBQ',
  '565 Winderley Pl, Maitland, FL 32751',
  28.5450,
  -81.3750,
  0.4,
  '$10 Off',
  '$10 off orders over $50. Valid on game days only',
  true
),
(
  'The Tap Room at Dubsdread',
  'Italian',
  '549 W Par St, Orlando, FL 32804',
  28.5370,
  -81.3900,
  0.5,
  'Game Day Special',
  '20% off all pizzas and pastas on game days. Show your ticket at checkout',
  true
);

-- Verify the data
SELECT 
  name,
  food_type,
  distance_from_arena,
  promo_badge,
  is_active
FROM game_day_restaurants
ORDER BY distance_from_arena;
