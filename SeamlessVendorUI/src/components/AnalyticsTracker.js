/**
 * Enhanced Analytics Tracker Component
 * Tracks location-based conversions and user interactions
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLocationIdFromPath } from '../services/locationDataService';

const AnalyticsTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    const trackPageView = () => {
      const locationId = getLocationIdFromPath(location.pathname);
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      
      // Google Analytics 4 tracking
      if (typeof gtag !== 'undefined') {
        gtag('config', process.env.REACT_APP_GA4_MEASUREMENT_ID, {
          page_title: pageTitle,
          page_location: pageUrl,
          custom_map: {
            'location_id': locationId || 'homepage',
            'page_type': locationId ? 'location_page' : 'static_page'
          }
        });
        
        // Track page view event
        gtag('event', 'page_view', {
          page_title: pageTitle,
          page_location: pageUrl,
          location_id: locationId || 'homepage',
          page_type: locationId ? 'location_page' : 'static_page',
          timestamp: new Date().toISOString()
        });
      }
      
      // Facebook Pixel tracking
      if (typeof fbq !== 'undefined') {
        fbq('track', 'PageView', {
          content_name: pageTitle,
          content_category: locationId ? 'Location Page' : 'Static Page',
          location_id: locationId || 'homepage'
        });
      }
      
      // LinkedIn Insight Tag tracking
      if (typeof lintrk !== 'undefined') {
        lintrk('track', { conversion_id: process.env.REACT_APP_LINKEDIN_CONVERSION_ID });
      }
      
      console.log('📊 Analytics tracked:', {
        pageTitle,
        pageUrl,
        locationId: locationId || 'homepage',
        pageType: locationId ? 'location_page' : 'static_page'
      });
    };
    
    // Track page view on route change
    trackPageView();
    
  }, [location]);
  
  // Track form submissions
  useEffect(() => {
    const trackFormSubmission = (event) => {
      const form = event.target;
      const formData = new FormData(form);
      const formType = form.getAttribute('data-form-type') || 'contact';
      const locationId = getLocationIdFromPath(location.pathname);
      
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', 'generate_lead', {
          form_type: formType,
          location_id: locationId || 'homepage',
          page_location: window.location.href,
          value: getFormValue(formType, locationId)
        });
      }
      
      // Facebook Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
          content_name: `${formType} form submission`,
          content_category: 'Form Submission',
          location_id: locationId || 'homepage',
          value: getFormValue(formType, locationId),
          currency: 'USD'
        });
      }
      
      console.log('📊 Form submission tracked:', {
        formType,
        locationId: locationId || 'homepage',
        value: getFormValue(formType, locationId)
      });
    };
    
    // Add event listeners to all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', trackFormSubmission);
    });
    
    // Cleanup
    return () => {
      forms.forEach(form => {
        form.removeEventListener('submit', trackFormSubmission);
      });
    };
  }, [location]);
  
  // Track button clicks
  useEffect(() => {
    const trackButtonClick = (event) => {
      const button = event.target;
      const buttonText = button.textContent || button.getAttribute('aria-label') || 'button';
      const buttonType = button.getAttribute('data-button-type') || 'cta';
      const locationId = getLocationIdFromPath(location.pathname);
      
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
          button_text: buttonText,
          button_type: buttonType,
          location_id: locationId || 'homepage',
          page_location: window.location.href
        });
      }
      
      // Facebook Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', 'ViewContent', {
          content_name: `Button Click: ${buttonText}`,
          content_category: 'Button Interaction',
          location_id: locationId || 'homepage'
        });
      }
      
      console.log('📊 Button click tracked:', {
        buttonText,
        buttonType,
        locationId: locationId || 'homepage'
      });
    };
    
    // Add event listeners to CTA buttons
    const ctaButtons = document.querySelectorAll('button[class*="cta"], button[class*="primary"], a[class*="cta"], a[class*="primary"]');
    ctaButtons.forEach(button => {
      button.addEventListener('click', trackButtonClick);
    });
    
    // Cleanup
    return () => {
      ctaButtons.forEach(button => {
        button.removeEventListener('click', trackButtonClick);
      });
    };
  }, [location]);
  
  // Track scroll depth
  useEffect(() => {
    let maxScrollDepth = 0;
    const scrollThresholds = [25, 50, 75, 90, 100];
    const trackedThresholds = new Set();
    
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = Math.round((scrollTop / documentHeight) * 100);
      
      if (scrollPercentage > maxScrollDepth) {
        maxScrollDepth = scrollPercentage;
        
        // Track milestone thresholds
        scrollThresholds.forEach(threshold => {
          if (scrollPercentage >= threshold && !trackedThresholds.has(threshold)) {
            trackedThresholds.add(threshold);
            
            const locationId = getLocationIdFromPath(location.pathname);
            
            // Google Analytics 4
            if (typeof gtag !== 'undefined') {
              gtag('event', 'scroll', {
                scroll_depth: threshold,
                location_id: locationId || 'homepage',
                page_location: window.location.href
              });
            }
            
            console.log('📊 Scroll depth tracked:', {
              threshold,
              locationId: locationId || 'homepage'
            });
          }
        });
      }
    };
    
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', trackScrollDepth);
    };
  }, [location]);
  
  // Track time on page
  useEffect(() => {
    const startTime = Date.now();
    
    const trackTimeOnPage = () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      const locationId = getLocationIdFromPath(location.pathname);
      
      // Track time milestones
      const timeMilestones = [30, 60, 120, 300]; // 30s, 1m, 2m, 5m
      
      timeMilestones.forEach(milestone => {
        if (timeOnPage >= milestone && timeOnPage < milestone + 10) {
          // Google Analytics 4
          if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
              name: 'time_on_page',
              value: timeOnPage,
              location_id: locationId || 'homepage',
              page_location: window.location.href
            });
          }
          
          console.log('📊 Time on page tracked:', {
            timeOnPage,
            locationId: locationId || 'homepage'
          });
        }
      });
    };
    
    const interval = setInterval(trackTimeOnPage, 10000); // Check every 10 seconds
    
    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [location]);
  
  return null; // This component doesn't render anything
};

/**
 * Get form value based on form type and location
 * @param {string} formType - Type of form
 * @param {string} locationId - Location identifier
 * @returns {number} Form value
 */
function getFormValue(formType, locationId) {
  const baseValues = {
    'contact': 10,
    'demo': 50,
    'signup': 25,
    'location-demo': 75
  };
  
  const locationMultipliers = {
    'orlando': 1.2,
    'tampa': 1.2,
    'winter-garden': 1.1,
    'clermont': 1.1,
    'winter-park': 1.1,
    'maitland': 1.1,
    'apopka': 1.0,
    'mount-dora': 1.0,
    'sanford': 1.0,
    'lake-county': 0.9,
    'polk-county': 0.9
  };
  
  const baseValue = baseValues[formType] || 10;
  const multiplier = locationMultipliers[locationId] || 1.0;
  
  return Math.round(baseValue * multiplier);
}

export default AnalyticsTracker;
