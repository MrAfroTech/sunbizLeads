/**
 * Location-Specific Landing Page Component
 * Dynamic landing page for each city/location based on CTO SEO Guidelines
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLocationData, getFormConfig } from '../services/locationDataService';
import SEOMetaTags from './SEOMetaTags';
import '../styles/LocationLandingPage.css';

const LocationLandingPage = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    location: '',
    message: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  
  useEffect(() => {
    // Only proceed if we have a locationId
    if (!locationId) return;
    
    // Set fallback data immediately - no loading state needed
    const fallbackData = getFallbackLocationData(locationId);
    const fallbackFormConfig = getDefaultFormConfig(locationId);
    
    setLocationData(fallbackData);
    setFormConfig(fallbackFormConfig);
    
    // Try to get updated data from API in background (optional)
    const loadUpdatedData = async () => {
      try {
        const [metaData, formData] = await Promise.all([
          getLocationData(locationId, 'meta_data'),
          getFormConfig(locationId)
        ]);
        
        // Only update if we got different data
        if (metaData && metaData !== fallbackData) {
          setLocationData(metaData);
        }
        if (formData && formData !== fallbackFormConfig) {
          setFormConfig(formData);
        }
      } catch (error) {
        console.error('Error loading location data:', error);
        // Keep using fallback data - no need to do anything
      }
    };
    
    if (locationId) {
      loadUpdatedData();
    }
  }, [locationId, navigate]);
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    
    try {
      const response = await fetch('/api/location-demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          locationId,
          cityName: locationData?.city_name,
          source: 'location-landing-page'
        }),
      });
      
      if (response.ok) {
        setFormSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          businessName: '',
          location: '',
          message: ''
        });
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      setFormError('There was an error submitting your request. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };
  
  if (!locationData) {
    return (
      <div className="location-error">
        <h1>Location Not Found</h1>
        <p>The requested location could not be found.</p>
        <button onClick={() => navigate('/')} className="primary-button">
          Return to Homepage
        </button>
      </div>
    );
  }
  
  return (
    <div className="location-landing-page">
      <SEOMetaTags locationId={locationId} />
      
      {/* Hero Section */}
      <section className="location-hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">{locationData.h1_headline}</h1>
          <p className="hero-subtitle">
            Join {locationData.city_name} hospitality venues already seamlessly integrating operations with Seamless technology
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">60%</span>
              <span className="stat-label">Less Wait Time</span>
            </div>
            <div className="stat">
              <span className="stat-number">25%</span>
              <span className="stat-label">Revenue Increase</span>
            </div>
            <div className="stat">
              <span className="stat-number">40%</span>
              <span className="stat-label">Staff Efficiency</span>
            </div>
          </div>
          <button 
            className="hero-cta primary-button"
            onClick={() => document.getElementById('demo-form').scrollIntoView({ behavior: 'smooth' })}
          >
            Get Your Free {locationData.city_name} Demo
          </button>
        </div>
      </section>
      
      {/* Problem Section */}
      <section className="location-problem">
        <div className="container">
          <h2>Hospitality Industry Challenges in {locationData.city_name}</h2>
          <div className="problem-grid">
            {locationData.business_challenges && locationData.business_challenges.map((challenge, index) => (
              <div key={index} className="problem-item">
                <div className="problem-icon">
                  {index === 0 && '⏰'}
                  {index === 1 && '📱'}
                  {index === 2 && '💰'}
                  {index === 3 && '🚚'}
                </div>
                <h3>{challenge.split(' ').slice(0, 3).join(' ')}</h3>
                <p>{challenge}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Solution Section */}
      <section className="location-solution">
        <div className="container">
          <h2>Seamlessly Integrated Solutions for {locationData.city_name} Hospitality Venues</h2>
          <div className="solution-content">
            <div className="solution-text">
              <h3>Seamlessly Integrated Technology Solutions</h3>
              <p>
                Seamless provides affordable, seamlessly integrated technology solutions specifically designed for 
                all hospitality venues - from food trucks to stadiums, resorts to festivals. California to New York, Florida to Maine. 
                Advanced crowd management and seasonal scalability help you scale operations during peak seasons and events without breaking the bank.
              </p>
              <ul className="solution-features">
                {locationData.solutions_offered && locationData.solutions_offered.map((solution, index) => (
                  <li key={index}>✅ {solution}</li>
                ))}
              </ul>
            </div>
            <div className="solution-visual">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-demo">
                    <div className="app-header">Seamless Ordering</div>
                    <div className="menu-items">
                      <div className="menu-item">🍔 Burger Deluxe - $12</div>
                      <div className="menu-item">🍕 Margherita Pizza - $14</div>
                      <div className="menu-item">🥗 Caesar Salad - $9</div>
                    </div>
                    <div className="order-button">Order Now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Perfect For Section */}
      <section className="location-perfect-for">
        <div className="container">
          <h2>Perfect for {locationData.city_name} Hospitality Venue Owners</h2>
          <div className="venue-types">
            {locationData.venue_types && locationData.venue_types.map((type, index) => (
              <div key={index} className="venue-type">
                <h3>{type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h3>
                <p>
                  {type === 'food_truck' && 'Mobile food vendors needing portable POS systems and event-ready technology'}
                  {type === 'local_restaurant' && 'Independent restaurants looking to modernize operations and serve more customers'}
                  {type === 'bar' && 'Local bars and pubs wanting to streamline service during peak hours'}
                  {type === 'festival_vendor' && 'Event and festival vendors needing mobile ordering and payment solutions'}
                  {type === 'catering' && 'Catering businesses requiring flexible ordering and inventory management'}
                  {type === 'theme_park_vendor' && 'Theme park and tourist area vendors handling high-volume crowds'}
                  {type === 'sports_bar' && 'Sports bars managing game day rushes and event crowds'}
                  {type === 'entertainment_venue' && 'Entertainment venues needing efficient food and beverage service'}
                  {type === 'farmers_market_vendor' && 'Farmers market vendors requiring simple, mobile-friendly POS systems'}
                  {type === 'vacation_rental_catering' && 'Vacation rental catering businesses serving tourist accommodations'}
                  {type === 'cafe' && 'Coffee shops and cafes seeking to streamline their ordering process'}
                  {type === 'local_business' && 'Local food businesses wanting to modernize their customer experience'}
                  {type === 'small_business' && 'Small food businesses looking to grow and improve efficiency'}
                  {type === 'event_vendor' && 'Event vendors needing mobile solutions for festivals and gatherings'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Local Areas Section */}
      <section className="location-areas">
        <div className="container">
          <h2>Seamlessly Integrated Throughout {locationData.city_name}</h2>
          <p>
            From {locationData.local_area_1} to {locationData.local_area_2}, 
            Seamless is seamlessly integrating {locationData.city_name} hospitality venues to serve more customers and grow their operations.
          </p>
          <div className="areas-grid">
            <div className="area-item">
              <h3>{locationData.local_area_1}</h3>
              <p>Hospitality venues in this area are seamlessly integrating operations and seeing improved efficiency and customer satisfaction</p>
            </div>
            <div className="area-item">
              <h3>{locationData.local_area_2}</h3>
              <p>Food trucks and vendors seamlessly integrate operations and report better event management and increased sales</p>
            </div>
          </div>
          {locationData.event_types && (
            <div className="event-types">
              <h3>Perfect for {locationData.city_name} Events:</h3>
              <div className="event-tags">
                {locationData.event_types.map((event, index) => (
                  <span key={index} className="event-tag">{event}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Demo Form Section */}
      <section id="demo-form" className="location-demo-form">
        <div className="container">
          <h2>{formConfig?.form_title || `Get Your Free ${locationData.city_name} Seamless Integration Demo`}</h2>
          <p>See how Seamless can seamlessly integrate your {locationData.city_name} hospitality venue operations</p>
          
          {formSuccess ? (
            <div className="form-success">
              <div className="success-icon">✅</div>
              <h3>Thank You!</h3>
              <p>{formConfig?.thank_you_message || `We'll contact you about seamlessly integrating your ${locationData.city_name} hospitality venue operations.`}</p>
              <button 
                className="primary-button"
                onClick={() => setFormSuccess(false)}
              >
                Request Another Demo
              </button>
            </div>
          ) : (
            <form className="demo-form" onSubmit={handleFormSubmit}>
              {formError && (
                <div className="form-error">
                  <p>{formError}</p>
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Your Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    disabled={formLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    disabled={formLoading}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessName">Business Name *</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleFormChange}
                    required
                    disabled={formLoading}
                    placeholder="e.g., Joe's Food Truck, Downtown Cafe, etc."
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location in {locationData.city_name}</label>
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  disabled={formLoading}
                >
                  <option value="">Select your area</option>
                  {formConfig?.location_options?.map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Tell us about your hospitality venue</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  rows="4"
                  placeholder="What type of hospitality venue do you have? (food truck, restaurant, bar, resort, stadium, festival, etc.) What are your biggest challenges?"
                  disabled={formLoading}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="primary-button submit-button"
                disabled={formLoading}
              >
                {formLoading ? 'Sending Request...' : 'Get My Free Demo'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

/**
 * Fallback location data when API is unavailable
 */
function getFallbackLocationData(locationId) {
  if (!locationId) return null;
  
  // Import the location data from the service
  const { getLocationData } = require('../services/locationDataService');
  return getLocationData(locationId, 'meta_data');
}

/**
 * Default form configuration
 */
function getDefaultFormConfig(locationId) {
  if (!locationId) return null;
  
  // Import the form config from the service
  const { getFormConfig } = require('../services/locationDataService');
  return getFormConfig(locationId);
}

export default LocationLandingPage;
