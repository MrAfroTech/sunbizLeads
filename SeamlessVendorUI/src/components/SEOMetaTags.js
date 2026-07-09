/**
 * SEO Meta Tags Component
 * Dynamically generates meta tags based on location and page type
 * Implements CTO SEO Guidelines specifications
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getLocationData, getLocationSchema, getLocationIdFromPath } from '../services/locationDataService';

const SEOMetaTags = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  locationId = null 
}) => {
  const [locationData, setLocationData] = useState(null);
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const routerLocation = useLocation();
  
  // Determine location ID
  const currentLocationId = locationId || getLocationIdFromPath(routerLocation.pathname);
  
  useEffect(() => {
    const loadLocationData = async () => {
      if (currentLocationId) {
        try {
          const [metaData, schema] = await Promise.all([
            getLocationData(currentLocationId, 'meta_data'),
            getLocationSchema(currentLocationId, 'LocalBusiness')
          ]);
          setLocationData(metaData);
          setSchemaData(schema);
        } catch (error) {
          console.error('Error loading location data:', error);
        }
      }
      setLoading(false);
    };
    
    loadLocationData();
  }, [currentLocationId]);
  
  // Generate meta tags based on location data or fallback to props
  const generateMetaTags = () => {
    if (loading) return null;
    
    // Use location-specific data if available, otherwise use props
    const finalTitle = locationData?.title_tag || title || 'Restaurant Technology Solutions | Seamless';
    const finalDescription = locationData?.meta_description || description || 'Help your restaurant serve more customers and boost revenue. Seamless reduces wait times by 60% with QR code ordering. Free demo available.';
    const finalUrl = url || `${window.location.origin}${routerLocation.pathname}`;
    const finalImage = image || `${window.location.origin}/images/seamless-og-image.jpg`;
    
    // Generate city-specific Open Graph data
    const ogTitle = locationData 
      ? `${locationData.city_name} Restaurant Technology - Skip the Line Ordering`
      : 'Restaurant Technology Solutions - Skip the Line Ordering';
    
    const ogDescription = locationData
      ? `Join ${locationData.city_name} venues eliminating wait times with QR code ordering`
      : 'Join restaurants eliminating wait times with QR code ordering';
    
    const ogUrl = locationData
      ? `https://seamless.com/locations/${currentLocationId}`
      : finalUrl;
    
    const ogImage = locationData
      ? `https://seamless.com/images/${currentLocationId}-venues.jpg`
      : finalImage;
    
    return {
      title: finalTitle,
      description: finalDescription,
      url: finalUrl,
      image: finalImage,
      ogTitle,
      ogDescription,
      ogUrl,
      ogImage
    };
  };
  
  const metaTags = generateMetaTags();
  
  if (!metaTags) return null;
  
  return (
    <>
      {/* Basic Meta Tags */}
      <title>{metaTags.title}</title>
      <meta name="description" content={metaTags.description} />
      <meta name="keywords" content={locationData ? 
        `skip the line ordering ${locationData.city_name}, QR code restaurant ordering ${locationData.city_name}, mobile food ordering ${locationData.city_name}, restaurant technology ${locationData.city_name}, contactless ordering ${locationData.city_name}, crowd management ${locationData.city_name}, revenue maximization ${locationData.city_name}, seasonal scalability ${locationData.city_name}, service standardization ${locationData.city_name}, customer retention rates ${locationData.city_name}, average order value ${locationData.city_name}` :
        'skip the line ordering, QR code restaurant ordering, mobile food ordering, restaurant technology, contactless ordering, POS integration, crowd management, revenue maximization, seasonal scalability, service standardization, customer retention rates, average order value, hospitality technology'
      } />
      
      {/* Canonical URL */}
      <link rel="canonical" href={metaTags.url} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={metaTags.ogTitle} />
      <meta property="og:description" content={metaTags.ogDescription} />
      <meta property="og:url" content={metaTags.ogUrl} />
      <meta property="og:image" content={metaTags.ogImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Seamless" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@SeamlessOrdering" />
      <meta name="twitter:title" content={metaTags.ogTitle} />
      <meta name="twitter:description" content={metaTags.ogDescription} />
      <meta name="twitter:image" content={metaTags.ogImage} />
      
      {/* Mobile Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Seamless" />
      <meta name="language" content="en" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Location-specific meta tags */}
      {locationData && (
        <>
          <meta name="geo.region" content={`US-${locationData.state === 'Florida' ? 'FL' : 'FL'}`} />
          <meta name="geo.placename" content={locationData.city_name} />
          <meta name="geo.position" content={getLocationCoordinates(locationData.city_name)} />
          <meta name="ICBM" content={getLocationCoordinates(locationData.city_name)} />
        </>
      )}
      
      {/* Schema Markup */}
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaData.schema_data)
          }}
        />
      )}
    </>
  );
};

/**
 * Get coordinates for major cities (simplified)
 * @param {string} cityName - Name of the city
 * @returns {string} Coordinates in format "lat,lon"
 */
function getLocationCoordinates(cityName) {
  const coordinates = {
    'Orlando': '28.5383,-81.3792',
    'Tampa': '27.9506,-82.4572',
    'Winter Garden': '28.5547,-81.5862',
    'Clermont': '28.5494,-81.7729',
    'Winter Park': '28.5999,-81.3392',
    'Maitland': '28.6278,-81.3631',
    'Apopka': '28.6931,-81.5112',
    'Mount Dora': '28.8025,-81.6445',
    'Sanford': '28.8028,-81.2691',
    'Lake County': '28.7500,-81.7500',
    'Polk County': '27.9500,-81.9500'
  };
  
  return coordinates[cityName] || '28.5383,-81.3792'; // Default to Orlando
}

export default SEOMetaTags;
