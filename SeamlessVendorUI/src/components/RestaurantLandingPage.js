import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOMetaTags from './SEOMetaTags';
import HospitalitySchema from './HospitalitySchema';
import '../styles/LocationLandingPage.css';

const RestaurantLandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="location-landing-page">
      <SEOMetaTags 
        title="Restaurant Service Standardization & Customer Retention | Seamless"
        description="Service standardization and customer retention rates for restaurants. Average order value optimization and revenue maximization through consistent service delivery."
      />
      <HospitalitySchema pageType="restaurant" />
      
      {/* Hero Section */}
      <section className="location-hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Restaurant Service Standardization & Customer Retention</h1>
          <p className="hero-subtitle">
            Service standardization and customer retention rates for restaurants. Optimize average order value and revenue maximization through consistent service delivery.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">67%</span>
              <span className="stat-label">Customer Retention</span>
            </div>
            <div className="stat">
              <span className="stat-number">35%</span>
              <span className="stat-label">Average Order Value</span>
            </div>
            <div className="stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Service Standardization</span>
            </div>
          </div>
          <button 
            className="hero-cta primary-button"
            onClick={() => document.getElementById('demo-form').scrollIntoView({ behavior: 'smooth' })}
          >
            Get Your Restaurant Demo
          </button>
        </div>
      </section>
      
      {/* Problem Section */}
      <section className="location-problem">
        <div className="container">
          <h2>Restaurant Industry Challenges</h2>
          <div className="problem-grid">
            <div className="problem-item">
              <div className="problem-icon">📊</div>
              <h3>Service Standardization</h3>
              <p>Maintaining consistent service quality across all channels and staff members</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">🔄</div>
              <h3>Customer Retention Rates</h3>
              <p>Building and maintaining customer loyalty in a competitive market</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">💰</div>
              <h3>Average Order Value</h3>
              <p>Increasing customer spending per visit and maximizing revenue potential</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">⚡</div>
              <h3>Revenue Maximization</h3>
              <p>Optimizing every customer interaction for maximum revenue generation</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Solution Section */}
      <section className="location-solution">
        <div className="container">
          <h2>Restaurant Service Standardization Solutions</h2>
          <div className="solution-content">
            <div className="solution-text">
              <h3>Advanced Service Standardization Technology</h3>
              <p>
                Seamless provides restaurant-specific service standardization and customer retention solutions designed for 
                consistent service delivery. From fine dining to casual restaurants, our technology ensures 
                service standardization while optimizing average order value and customer retention rates.
              </p>
              <ul className="solution-features">
                <li>✅ Service standardization across all touchpoints</li>
                <li>✅ Customer retention rate optimization</li>
                <li>✅ Average order value enhancement</li>
                <li>✅ Revenue maximization strategies</li>
                <li>✅ Consistent service delivery protocols</li>
                <li>✅ Customer loyalty program integration</li>
              </ul>
            </div>
            <div className="solution-visual">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-demo">
                    <div className="app-header">Restaurant Ordering</div>
                    <div className="menu-items">
                      <div className="menu-item">🍽️ Chef's Special - $28</div>
                      <div className="menu-item">🍷 Wine Pairing - $15</div>
                      <div className="menu-item">🍰 Dessert - $12</div>
                    </div>
                    <div className="order-button">Order Now - VIP Service</div>
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
          <h2>Perfect for Restaurant Venues</h2>
          <div className="venue-types">
            <div className="venue-type">
              <h3>Fine Dining</h3>
              <p>Upscale restaurants requiring service standardization and customer retention rates for high-value clientele</p>
            </div>
            <div className="venue-type">
              <h3>Casual Dining</h3>
              <p>Family restaurants needing average order value optimization and service standardization for consistent experience</p>
            </div>
            <div className="venue-type">
              <h3>Fast Casual</h3>
              <p>Quick-service restaurants requiring service standardization and revenue maximization for high-volume operations</p>
            </div>
            <div className="venue-type">
              <h3>Bar & Grill</h3>
              <p>Sports bars and grills needing customer retention rates and average order value enhancement for peak hours</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Demo Form Section */}
      <section id="demo-form" className="location-demo-form">
        <div className="container">
          <h2>Get Your Restaurant Service Standardization Demo</h2>
          <p>See how Seamless can improve your service standardization and customer retention rates</p>
          
          <form className="demo-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input type="email" id="email" name="email" required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" />
              </div>
              <div className="form-group">
                <label htmlFor="businessName">Restaurant Name *</label>
                <input type="text" id="businessName" name="businessName" required placeholder="e.g., The Golden Spoon, Downtown Bistro" />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="restaurantType">Restaurant Type</label>
              <select id="restaurantType" name="restaurantType">
                <option value="">Select restaurant type</option>
                <option value="fine-dining">Fine Dining</option>
                <option value="casual-dining">Casual Dining</option>
                <option value="fast-casual">Fast Casual</option>
                <option value="bar-grill">Bar & Grill</option>
                <option value="cafe">Cafe</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Tell us about your service challenges</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                placeholder="What are your biggest service standardization challenges? How do you currently track customer retention rates? What's your average order value?"
              ></textarea>
            </div>
            
            <button type="submit" className="primary-button submit-button">
              Get My Restaurant Demo
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default RestaurantLandingPage;
