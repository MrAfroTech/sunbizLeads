/**
 * Location Data Service for SEO and Dynamic Content Management
 * Handles API calls to SEO Lambda functions for location-based content
 */

// API Configuration - Using Lambda function ARNs directly
const LOCATION_DATA_FUNCTION_ARN = 'arn:aws:lambda:us-east-1:915595598654:function:seamless-seo-location-data';
const SCHEMA_DATA_FUNCTION_ARN = 'arn:aws:lambda:us-east-1:915595598654:function:seamless-seo-schema-data';

// For now, we'll use fallback data since direct Lambda invocation from frontend requires additional setup
const USE_FALLBACK_DATA = true;

// Cache for performance optimization
const cache = {
  locationData: new Map(),
  schemaData: new Map(),
  formConfigs: new Map()
};

const CACHE_DURATION = {
  locationData: 60 * 60 * 1000, // 1 hour
  schemaData: 24 * 60 * 60 * 1000, // 24 hours
  formConfigs: 12 * 60 * 60 * 1000 // 12 hours
};

/**
 * Get location-specific data from SEO Lambda API
 * @param {string} locationId - City slug (e.g., 'orlando', 'tampa')
 * @param {string} contentType - Type of content ('meta_data', 'content', 'form_config')
 * @returns {Promise<Object>} Location data
 */
export async function getLocationData(locationId, contentType = 'meta_data') {
  const cacheKey = `${locationId}-${contentType}`;
  
  // Check cache first
  if (cache.locationData.has(cacheKey)) {
    const cached = cache.locationData.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION.locationData) {
      return cached.data;
    }
  }
  
  // For now, use fallback data immediately to avoid loading issues
  if (USE_FALLBACK_DATA) {
    const fallbackData = getFallbackLocationData(locationId, contentType);
    
    // Cache the fallback data
    cache.locationData.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now()
    });
    
    return fallbackData;
  }
  
  try {
    // Set a short timeout for API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${SEO_API_BASE_URL}/locations/${locationId}?contentType=${contentType}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data) {
        // Cache the result
        cache.locationData.set(cacheKey, {
          data: result.data,
          timestamp: Date.now()
        });
        
        return result.data;
      }
    }
    
    // Return fallback data if API fails
    return getFallbackLocationData(locationId, contentType);
  } catch (error) {
    console.error(`Error fetching location data for ${locationId}:`, error);
    return getFallbackLocationData(locationId, contentType);
  }
}

/**
 * Get schema markup data for a location from SEO Lambda API
 * @param {string} locationId - City slug
 * @param {string} schemaType - Type of schema ('LocalBusiness', 'Service', etc.)
 * @returns {Promise<Object>} Schema data
 */
export async function getLocationSchema(locationId, schemaType = 'LocalBusiness') {
  const cacheKey = `${locationId}-${schemaType}`;
  
  // Check cache first
  if (cache.schemaData.has(cacheKey)) {
    const cached = cache.schemaData.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION.schemaData) {
      return cached.data;
    }
  }
  
  // For now, use fallback data immediately to avoid loading issues
  if (USE_FALLBACK_DATA) {
    const fallbackData = generateDefaultSchema(locationId, schemaType);
    
    // Cache the fallback data
    cache.schemaData.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now()
    });
    
    return fallbackData;
  }
  
  try {
    const response = await fetch(`${SEO_API_BASE_URL}/schema/${locationId}?schemaType=${schemaType}`);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data) {
        // Cache the result
        cache.schemaData.set(cacheKey, {
          data: result.data,
          timestamp: Date.now()
        });
        
        return result.data;
      }
    }
    
    // Generate default schema if API fails
    return generateDefaultSchema(locationId, schemaType);
  } catch (error) {
    console.error(`Error fetching schema data for ${locationId}:`, error);
    return generateDefaultSchema(locationId, schemaType);
  }
}

/**
 * Get form configuration for a location from SEO Lambda API
 * @param {string} locationId - City slug
 * @returns {Promise<Object>} Form configuration
 */
export async function getFormConfig(locationId) {
  const cacheKey = locationId;
  
  // Check cache first
  if (cache.formConfigs.has(cacheKey)) {
    const cached = cache.formConfigs.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION.formConfigs) {
      return cached.data;
    }
  }
  
  // For now, use fallback data immediately to avoid loading issues
  if (USE_FALLBACK_DATA) {
    const fallbackData = getDefaultFormConfig(locationId);
    
    // Cache the fallback data
    cache.formConfigs.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now()
    });
    
    return fallbackData;
  }
  
  try {
    const response = await fetch(`${SEO_API_BASE_URL}/locations/${locationId}?contentType=form_config`);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data) {
        // Cache the result
        cache.formConfigs.set(cacheKey, {
          data: result.data,
          timestamp: Date.now()
        });
        
        return result.data;
      }
    }
    
    // Return default form config if API fails
    return getDefaultFormConfig(locationId);
  } catch (error) {
    console.error(`Error fetching form config for ${locationId}:`, error);
    return getDefaultFormConfig(locationId);
  }
}

/**
 * Get all locations with their priority for sitemap generation from SEO Lambda API
 * @returns {Promise<Array>} Array of location data
 */
export async function getAllLocations() {
  try {
    const response = await fetch(`${SEO_API_BASE_URL}/locations`);
    
    if (response.ok) {
      const result = await response.json();
      return result.success ? result.data : [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all locations:', error);
    return [];
  }
}

/**
 * Fallback location data when DynamoDB is unavailable
 * @param {string} locationId - City slug
 * @param {string} contentType - Content type
 * @returns {Object} Fallback data
 */
function getFallbackLocationData(locationId, contentType) {
  const locationData = getLocationSpecificData(locationId);
  
  return {
    location_id: locationId,
    content_type: contentType,
    city_name: locationData.cityName,
    state: 'Florida',
    title_tag: locationData.titleTag,
    meta_description: locationData.metaDescription,
    h1_headline: locationData.h1Headline,
    local_area_1: locationData.localArea1,
    local_area_2: locationData.localArea2,
    venue_types: locationData.venueTypes,
    local_features: locationData.localFeatures,
    business_challenges: locationData.businessChallenges,
    solutions_offered: locationData.solutionsOffered,
    seasonal_needs: locationData.seasonalNeeds,
    event_types: locationData.eventTypes,
    priority: locationData.priority,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Generate default schema markup for a location
 * @param {string} locationId - City slug
 * @param {string} schemaType - Schema type
 * @returns {Object} Schema data
 */
function generateDefaultSchema(locationId, schemaType) {
  const cityName = locationId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  if (schemaType === 'LocalBusiness') {
    return {
      location_id: locationId,
      schema_type: schemaType,
      schema_data: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `Seamless Ordering - ${cityName}`,
        "description": `QR code ordering system for ${cityName} restaurants, bars, and venues`,
        "url": `https://seamless.com/locations/${locationId}`,
        "operatingSystem": "iOS, Android, Web",
        "applicationCategory": "BusinessApplication",
        "areaServed": {
          "@type": "City",
          "name": cityName,
          "containedInPlace": {
            "@type": "State",
            "name": "Florida"
          }
        },
        "offers": {
          "@type": "Offer",
          "description": `Multi-POS integration service for ${cityName} venues`,
          "businessFunction": "http://purl.org/goodrelations/v1#LeaseOut"
        }
      }
    };
  }
  
  return {
    location_id: locationId,
    schema_type: schemaType,
    schema_data: {}
  };
}

/**
 * Get default form configuration for a location
 * @param {string} locationId - City slug
 * @returns {Object} Form configuration
 */
function getDefaultFormConfig(locationId) {
  const locationData = getLocationSpecificData(locationId);
  
  return {
    location_id: locationId,
    form_title: `Schedule a Chat for Your ${locationData.cityName} Hospitality Venue`,
    location_options: [
      { value: locationData.localArea1.toLowerCase().replace(/\s+/g, '-'), label: locationData.localArea1 },
      { value: locationData.localArea2.toLowerCase().replace(/\s+/g, '-'), label: locationData.localArea2 },
      { value: `other-${locationId}`, label: `Other ${locationData.cityName} Area` }
    ],
    thank_you_message: `Thanks! We'll contact you about seamlessly integrating your ${locationData.cityName} hospitality venue operations.`,
    redirect_url: `/thank-you/${locationId}/`
  };
}

/**
 * Clear cache for a specific location or all locations
 * @param {string} locationId - Optional location ID to clear specific cache
 */
export function clearCache(locationId = null) {
  if (locationId) {
    // Clear specific location cache
    for (const [key] of cache.locationData) {
      if (key.startsWith(locationId)) {
        cache.locationData.delete(key);
      }
    }
    for (const [key] of cache.schemaData) {
      if (key.startsWith(locationId)) {
        cache.schemaData.delete(key);
      }
    }
    cache.formConfigs.delete(locationId);
  } else {
    // Clear all cache
    cache.locationData.clear();
    cache.schemaData.clear();
    cache.formConfigs.clear();
  }
}

/**
 * Get location ID from URL path
 * @param {string} pathname - Current pathname
 * @returns {string|null} Location ID or null
 */
export function getLocationIdFromPath(pathname) {
  const locationMatch = pathname.match(/\/locations\/([^\/]+)/);
  if (locationMatch) {
    return locationMatch[1];
  }
  
  // Check for direct city routes
  const cityMatch = pathname.match(/^\/([^\/]+)$/);
  if (cityMatch) {
    const citySlug = cityMatch[1];
    // Only return if it's not a known non-location route
    const nonLocationRoutes = ['demo', 'increase-revenue', 'reduce-expenses', 'download', 'cash-finder', 'wine-walk', 'kids-expo', 'signup', 'signup-success', 'directsignup', 'vendor-download', 'vendor-integration', 'dynamic-pricing', 'square-oauth-callback', 'square-success', 'error', 'schedule-chat', 'calendar-box', 'ezfest'];
    if (!nonLocationRoutes.includes(citySlug)) {
      return citySlug;
    }
  }
  
  return null;
}

/**
 * Get location-specific data with local business focus
 * @param {string} locationId - City slug
 * @returns {Object} Location-specific data
 */
function getLocationSpecificData(locationId) {
  const locationMap = {
    'clermont': {
      cityName: 'Clermont',
      titleTag: 'Seamlessly Integrating Clermont Hospitality Venues | Seamless',
      metaDescription: 'Seamlessly integrating technology for Clermont hospitality venues - local restaurants, food trucks, and lake festival vendors. Scale during tourist season with seamless integration.',
      h1Headline: 'Seamlessly Integrating Clermont Hospitality Venues',
      localArea1: 'Lake Minneola waterfront',
      localArea2: 'Clermont Historic District',
      venueTypes: ['food_truck', 'local_restaurant', 'bar', 'festival_vendor', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, local bars, small restaurants',
        seasonalNeeds: 'lake festival support, tourist season scaling',
        eventTypes: ['lake festivals', 'waterfront events', 'community gatherings'],
        competitorLandscape: 'small business focused, not enterprise'
      },
      businessChallenges: [
        'Managing lake festival rushes with limited staff',
        'Scaling operations during tourist season',
        'Mobile POS needs for waterfront events',
        'Inventory management for seasonal demand'
      ],
      solutionsOffered: [
        'Mobile POS systems for food trucks',
        'Festival-ready ordering technology',
        'Tourist season scalability tools',
        'Inventory management for seasonal businesses'
      ],
      seasonalNeeds: 'Lake festival support, tourist season scaling',
      eventTypes: ['lake festivals', 'waterfront events', 'community gatherings'],
      priority: 0.9
    },
    'orlando': {
      cityName: 'Orlando',
      titleTag: 'Seamlessly Integrating Orlando Hospitality Venues | Seamless',
      metaDescription: 'Seamlessly integrating technology for Orlando hospitality venues - from local bars to massive festivals, food trucks to theme park vendors, resorts to local restaurants. Handle tourist crowds and events efficiently.',
      h1Headline: 'Seamlessly Integrating Orlando Hospitality Venues',
      localArea1: 'International Drive corridor',
      localArea2: 'Downtown Orlando food truck circuit',
      venueTypes: ['food_truck', 'theme_park_vendor', 'local_restaurant', 'bar', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, theme park vendors, local restaurants',
        seasonalNeeds: 'tourist season management, food truck circuit events',
        eventTypes: ['theme park events', 'food truck rallies', 'convention catering'],
        competitorLandscape: 'high tourism, event-driven market'
      },
      businessChallenges: [
        'Handling massive tourist crowds during peak season',
        'Food truck circuit event management',
        'Theme park vendor coordination',
        'Convention center catering logistics'
      ],
      solutionsOffered: [
        'High-volume mobile POS systems',
        'Food truck circuit management tools',
        'Tourist crowd handling technology',
        'Convention catering coordination'
      ],
      seasonalNeeds: 'Tourist season management, food truck circuit events',
      eventTypes: ['theme park events', 'food truck rallies', 'convention catering'],
      priority: 1.0
    },
    'tampa': {
      cityName: 'Tampa',
      titleTag: 'Seamlessly Integrating Tampa Hospitality Venues | Seamless',
      metaDescription: 'Seamlessly integrating technology for Tampa hospitality venues - from local bars to massive festivals, sports venues to downtown food scene, food trucks to local restaurants. Handle game day rushes and events efficiently.',
      h1Headline: 'Seamlessly Integrating Tampa Hospitality Venues',
      localArea1: 'Downtown Tampa sports district',
      localArea2: 'Ybor City entertainment district',
      venueTypes: ['food_truck', 'sports_bar', 'local_restaurant', 'entertainment_venue', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, sports bars, entertainment venues',
        seasonalNeeds: 'sports event support, downtown event management',
        eventTypes: ['sports events', 'downtown festivals', 'entertainment district events'],
        competitorLandscape: 'sports and entertainment focused'
      },
      businessChallenges: [
        'Managing game day rushes at sports bars',
        'Downtown event coordination',
        'Ybor City entertainment district management',
        'Food truck event logistics'
      ],
      solutionsOffered: [
        'Sports event POS systems',
        'Game day rush management tools',
        'Entertainment district coordination',
        'Food truck event logistics'
      ],
      seasonalNeeds: 'Sports event support, downtown event management',
      eventTypes: ['sports events', 'downtown festivals', 'entertainment district events'],
      priority: 0.95
    },
    'winter-garden': {
      cityName: 'Winter Garden',
      titleTag: 'Seamlessly Integrating Winter Garden Hospitality Venues | Seamless',
      metaDescription: 'Seamlessly integrating technology for Winter Garden hospitality venues - farmers market vendors, local restaurants, and community event businesses. Perfect for small business owners.',
      h1Headline: 'Seamlessly Integrating Winter Garden Hospitality Venues',
      localArea1: 'Winter Garden Farmers Market',
      localArea2: 'Historic downtown district',
      venueTypes: ['farmers_market_vendor', 'local_restaurant', 'cafe', 'catering', 'local_business'],
      localFeatures: {
        primaryMarket: 'farmers market vendors, local restaurants, cafes',
        seasonalNeeds: 'farmers market support, community event management',
        eventTypes: ['farmers markets', 'community events', 'downtown festivals'],
        competitorLandscape: 'small community business focused'
      },
      businessChallenges: [
        'Farmers market vendor management',
        'Community event coordination',
        'Small staff efficiency',
        'Local customer relationship management'
      ],
      solutionsOffered: [
        'Farmers market POS systems',
        'Community event management tools',
        'Small business efficiency solutions',
        'Local customer loyalty programs'
      ],
      seasonalNeeds: 'Farmers market support, community event management',
      eventTypes: ['farmers markets', 'community events', 'downtown festivals'],
      priority: 0.8
    },
    'kissimmee': {
      cityName: 'Kissimmee',
      titleTag: 'Tourist-Ready POS Systems for Kissimmee Food Businesses | Seamless',
      metaDescription: 'Tourist season POS solutions for Kissimmee\'s local restaurants, food trucks, and vacation rental catering. Handle Disney area crowds efficiently.',
      h1Headline: 'Tourist-Ready POS Systems for Kissimmee Food Businesses',
      localArea1: 'Disney area corridor',
      localArea2: 'Historic downtown Kissimmee',
      venueTypes: ['food_truck', 'local_restaurant', 'vacation_rental_catering', 'bar', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, vacation rental catering, local restaurants',
        seasonalNeeds: 'Disney area tourist management, vacation rental support',
        eventTypes: ['tourist events', 'vacation rental catering', 'downtown festivals'],
        competitorLandscape: 'tourism and vacation rental focused'
      },
      businessChallenges: [
        'Disney area tourist crowd management',
        'Vacation rental catering coordination',
        'Seasonal demand fluctuations',
        'Tourist customer service efficiency'
      ],
      solutionsOffered: [
        'Tourist crowd POS systems',
        'Vacation rental catering tools',
        'Seasonal demand management',
        'Tourist customer service solutions'
      ],
      seasonalNeeds: 'Disney area tourist management, vacation rental support',
      eventTypes: ['tourist events', 'vacation rental catering', 'downtown festivals'],
      priority: 0.85
    },
    'lakeland': {
      cityName: 'Lakeland',
      titleTag: 'Local Business POS Solutions for Lakeland Food Vendors | Seamless',
      metaDescription: 'Community-focused POS systems for Lakeland\'s local restaurants, food trucks, and event vendors. Perfect for small business growth.',
      h1Headline: 'Local Business POS Solutions for Lakeland Food Vendors',
      localArea1: 'Downtown Lakeland',
      localArea2: 'Lakeland food truck scene',
      venueTypes: ['food_truck', 'local_restaurant', 'cafe', 'catering', 'local_business'],
      localFeatures: {
        primaryMarket: 'food trucks, local restaurants, cafes',
        seasonalNeeds: 'community event support, local business growth',
        eventTypes: ['community festivals', 'food truck events', 'downtown events'],
        competitorLandscape: 'community and local business focused'
      },
      businessChallenges: [
        'Community event vendor management',
        'Local business growth scaling',
        'Food truck event coordination',
        'Small business efficiency'
      ],
      solutionsOffered: [
        'Community event POS systems',
        'Local business growth tools',
        'Food truck coordination solutions',
        'Small business efficiency systems'
      ],
      seasonalNeeds: 'Community event support, local business growth',
      eventTypes: ['community festivals', 'food truck events', 'downtown events'],
      priority: 0.75
    },
    'winter-haven': {
      cityName: 'Winter Haven',
      titleTag: 'Food Truck & Restaurant Tech for Winter Haven | Seamless',
      metaDescription: 'Mobile POS systems for Winter Haven\'s food trucks, local restaurants, and event vendors. Handle Chain of Lakes events and local festivals.',
      h1Headline: 'Food Truck & Restaurant Tech for Winter Haven',
      localArea1: 'Chain of Lakes area',
      localArea2: 'Downtown Winter Haven',
      venueTypes: ['food_truck', 'local_restaurant', 'bar', 'event_vendor', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, local restaurants, event vendors',
        seasonalNeeds: 'Chain of Lakes event support, local festival management',
        eventTypes: ['Chain of Lakes events', 'local festivals', 'downtown events'],
        competitorLandscape: 'lakes and events focused'
      },
      businessChallenges: [
        'Chain of Lakes event management',
        'Local festival vendor coordination',
        'Food truck event logistics',
        'Seasonal event scaling'
      ],
      solutionsOffered: [
        'Lakes event POS systems',
        'Festival vendor management tools',
        'Food truck event coordination',
        'Seasonal event scaling solutions'
      ],
      seasonalNeeds: 'Chain of Lakes event support, local festival management',
      eventTypes: ['Chain of Lakes events', 'local festivals', 'downtown events'],
      priority: 0.7
    },
    'apopka': {
      cityName: 'Apopka',
      titleTag: 'Small Business POS for Apopka Food Vendors | Seamless',
      metaDescription: 'Affordable POS solutions for Apopka\'s local restaurants, food trucks, and small food businesses. Perfect for growing local businesses.',
      h1Headline: 'Small Business POS for Apopka Food Vendors',
      localArea1: 'Downtown Apopka',
      localArea2: 'Apopka local business district',
      venueTypes: ['food_truck', 'local_restaurant', 'cafe', 'small_business', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, local restaurants, small businesses',
        seasonalNeeds: 'local business growth, community event support',
        eventTypes: ['community events', 'local festivals', 'business district events'],
        competitorLandscape: 'small business and community focused'
      },
      businessChallenges: [
        'Small business growth management',
        'Community event coordination',
        'Local customer relationship building',
        'Business efficiency optimization'
      ],
      solutionsOffered: [
        'Small business POS systems',
        'Community event management tools',
        'Local customer loyalty programs',
        'Business efficiency solutions'
      ],
      seasonalNeeds: 'Local business growth, community event support',
      eventTypes: ['community events', 'local festivals', 'business district events'],
      priority: 0.65
    },
    'oviedo': {
      cityName: 'Oviedo',
      titleTag: 'Local Restaurant Technology for Oviedo Food Businesses | Seamless',
      metaDescription: 'Community-focused POS systems for Oviedo\'s local restaurants, food trucks, and event vendors. Support local business growth.',
      h1Headline: 'Local Restaurant Technology for Oviedo Food Businesses',
      localArea1: 'Downtown Oviedo',
      localArea2: 'Oviedo local business area',
      venueTypes: ['food_truck', 'local_restaurant', 'cafe', 'event_vendor', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, local restaurants, event vendors',
        seasonalNeeds: 'community event support, local business growth',
        eventTypes: ['community festivals', 'local events', 'downtown activities'],
        competitorLandscape: 'community and local business focused'
      },
      businessChallenges: [
        'Community event vendor management',
        'Local business growth scaling',
        'Event coordination logistics',
        'Small business efficiency'
      ],
      solutionsOffered: [
        'Community event POS systems',
        'Local business growth tools',
        'Event coordination solutions',
        'Small business efficiency systems'
      ],
      seasonalNeeds: 'Community event support, local business growth',
      eventTypes: ['community festivals', 'local events', 'downtown activities'],
      priority: 0.6
    },
    'sanford': {
      cityName: 'Sanford',
      titleTag: 'Historic District POS Solutions for Sanford Food Vendors | Seamless',
      metaDescription: 'Historic district POS systems for Sanford\'s local restaurants, food trucks, and event vendors. Perfect for downtown and waterfront businesses.',
      h1Headline: 'Historic District POS Solutions for Sanford Food Vendors',
      localArea1: 'Historic downtown Sanford',
      localArea2: 'Sanford waterfront district',
      venueTypes: ['food_truck', 'local_restaurant', 'bar', 'event_vendor', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, local restaurants, event vendors',
        seasonalNeeds: 'historic district events, waterfront festival support',
        eventTypes: ['historic district events', 'waterfront festivals', 'downtown activities'],
        competitorLandscape: 'historic and waterfront focused'
      },
      businessChallenges: [
        'Historic district event management',
        'Waterfront festival coordination',
        'Event vendor logistics',
        'Seasonal event scaling'
      ],
      solutionsOffered: [
        'Historic district POS systems',
        'Waterfront festival management tools',
        'Event vendor coordination solutions',
        'Seasonal event scaling systems'
      ],
      seasonalNeeds: 'Historic district events, waterfront festival support',
      eventTypes: ['historic district events', 'waterfront festivals', 'downtown activities'],
      priority: 0.55
    },
    'mount-dora': {
      cityName: 'Mount Dora',
      titleTag: 'Tourist Town POS for Mount Dora Food Businesses | Seamless',
      metaDescription: 'Tourist-friendly POS systems for Mount Dora\'s local restaurants, food trucks, and event vendors. Handle tourist season and local festivals.',
      h1Headline: 'Tourist Town POS for Mount Dora Food Businesses',
      localArea1: 'Historic downtown Mount Dora',
      localArea2: 'Mount Dora waterfront area',
      venueTypes: ['food_truck', 'local_restaurant', 'cafe', 'event_vendor', 'catering'],
      localFeatures: {
        primaryMarket: 'food trucks, local restaurants, event vendors',
        seasonalNeeds: 'tourist season management, local festival support',
        eventTypes: ['tourist events', 'local festivals', 'waterfront activities'],
        competitorLandscape: 'tourist and festival focused'
      },
      businessChallenges: [
        'Tourist season crowd management',
        'Local festival vendor coordination',
        'Seasonal demand fluctuations',
        'Event logistics management'
      ],
      solutionsOffered: [
        'Tourist season POS systems',
        'Festival vendor management tools',
        'Seasonal demand solutions',
        'Event logistics coordination'
      ],
      seasonalNeeds: 'Tourist season management, local festival support',
      eventTypes: ['tourist events', 'local festivals', 'waterfront activities'],
      priority: 0.5
    }
  };

  // Return specific location data or default fallback
  return locationMap[locationId] || {
    cityName: locationId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    titleTag: `Local Business POS Solutions for ${locationId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')} | Seamless`,
    metaDescription: `Affordable POS systems for ${locationId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')} local restaurants, food trucks, and small businesses.`,
    h1Headline: `Local Business POS Solutions for ${locationId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')}`,
    localArea1: `downtown ${locationId}`,
    localArea2: `${locationId} area`,
    venueTypes: ['food_truck', 'local_restaurant', 'bar', 'local_business'],
    localFeatures: {
      primaryMarket: 'food trucks, local restaurants, small businesses',
      seasonalNeeds: 'local event support, business growth',
      eventTypes: ['local festivals', 'community events'],
      competitorLandscape: 'small business focused'
    },
    businessChallenges: [
      'Local event management',
      'Small business growth',
      'Community coordination',
      'Business efficiency'
    ],
    solutionsOffered: [
      'Local event POS systems',
      'Small business growth tools',
      'Community coordination solutions',
      'Business efficiency systems'
    ],
    seasonalNeeds: 'Local event support, business growth',
    eventTypes: ['local festivals', 'community events'],
    priority: 0.5
  };
}

export default {
  getLocationData,
  getLocationSchema,
  getFormConfig,
  getAllLocations,
  clearCache,
  getLocationIdFromPath
};
