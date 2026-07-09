import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOMetaTags from './SEOMetaTags';
import HospitalitySchema from './HospitalitySchema';
import '../styles/LocationLandingPage.css';

const FoodTruckLandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="location-landing-page">
      <SEOMetaTags 
        title="Food Truck Revenue Maximization & Average Order Value | Seamless"
        description="Revenue maximization and average order value optimization for food trucks. Mobile crowd management and seasonal scalability for mobile food vendors."
      />
      <HospitalitySchema pageType="food-truck" />
      
      {/* Hero Section */}
      <section className="location-hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Food Truck Revenue Maximization & Average Order Value</h1>
          <p className="hero-subtitle">
            Revenue maximization and average order value optimization for food trucks. Mobile crowd management and seasonal scalability for mobile food vendors.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">45%</span>
              <span className="stat-label">Revenue Increase</span>
            </div>
            <div className="stat">
              <span className="stat-number">28%</span>
              <span className="stat-label">Average Order Value</span>
            </div>
            <div className="stat">
              <span className="stat-number">80%</span>
              <span className="stat-label">Mobile Efficiency</span>
            </div>
          </div>
          <button 
            className="hero-cta primary-button"
            onClick={() => document.getElementById('demo-form').scrollIntoView({ behavior: 'smooth' })}
          >
            Get Your Food Truck Demo
          </button>
        </div>
      </section>
      
      {/* Problem Section */}
      <section className="location-problem">
        <div className="container">
          <h2>Food Truck Industry Challenges</h2>
          <div className="problem-grid">
            <div className="problem-item">
              <div className="problem-icon">💰</div>
              <h3>Revenue Maximization</h3>
              <p>Maximizing revenue during limited service windows and high-traffic events</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">📊</div>
              <h3>Average Order Value</h3>
              <p>Increasing customer spending per transaction in mobile food service</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">👥</div>
              <h3>Mobile Crowd Management</h3>
              <p>Managing customer flow and wait times at different locations and events</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">📈</div>
              <h3>Seasonal Scalability</h3>
              <p>Scaling operations for different seasons and event types</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Solution Section */}
      <section className="location-solution">
        <div className="container">
          <h2>Food Truck Revenue Maximization Solutions</h2>
          <div className="solution-content">
            <div className="solution-text">
              <h3>Mobile Revenue Maximization Technology</h3>
              <p>
                Seamless provides food truck-specific revenue maximization and average order value solutions designed for 
                mobile food service. From food truck rallies to street festivals, our technology optimizes 
                revenue maximization and average order value for mobile vendors.
              </p>
              <ul className="solution-features">
                <li>✅ Revenue maximization for mobile operations</li>
                <li>✅ Average order value optimization</li>
                <li>✅ Mobile crowd management tools</li>
                <li>✅ Seasonal scalability for events</li>
                <li>✅ Location-based revenue tracking</li>
                <li>✅ Event-specific pricing strategies</li>
              </ul>
            </div>
            <div className="solution-visual">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-demo">
                    <div className="app-header">Food Truck Ordering</div>
                    <div className="menu-items">
                      <div className="menu-item">🌮 Gourmet Tacos - $14</div>
                      <div className="menu-item">🍔 Artisan Burger - $16</div>
                      <div className="menu-item">🥤 Craft Beverage - $8</div>
                    </div>
                    <div className="order-button">Order Now - Mobile Pickup</div>
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
          <h2>Perfect for Food Truck Vendors</h2>
          <div className="venue-types">
            <div className="venue-type">
              <h3>Gourmet Food Trucks</h3>
              <p>High-end mobile food vendors needing revenue maximization and average order value optimization for premium markets</p>
            </div>
            <div className="venue-type">
              <h3>Event Food Trucks</h3>
              <p>Festival and event vendors requiring mobile crowd management and seasonal scalability for varying attendance</p>
            </div>
            <div className="venue-type">
              <h3>Street Food Vendors</h3>
              <p>Daily street vendors needing revenue maximization and average order value enhancement for consistent locations</p>
            </div>
            <div className="venue-type">
              <h3>Corporate Catering Trucks</h3>
              <p>Business catering trucks requiring revenue maximization and service standardization for corporate events</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Demo Form Section */}
      <section id="demo-form" className="location-demo-form">
        <div className="container">
          <h2>Get Your Food Truck Revenue Maximization Demo</h2>
          <p>See how Seamless can boost your food truck revenue and average order value</p>
          
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
                <label htmlFor="businessName">Food Truck Name *</label>
                <input type="text" id="businessName" name="businessName" required placeholder="e.g., The Rolling Kitchen, Street Eats Mobile" />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="truckType">Food Truck Type</label>
              <select id="truckType" name="truckType">
                <option value="">Select truck type</option>
                <option value="gourmet">Gourmet Food Truck</option>
                <option value="event">Event Food Truck</option>
                <option value="street">Street Food Vendor</option>
                <option value="corporate">Corporate Catering</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Tell us about your revenue challenges</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                placeholder="What are your biggest revenue maximization challenges? What's your current average order value? How do you handle different events and locations?"
              ></textarea>
            </div>
            
            <button type="submit" className="primary-button submit-button">
              Get My Food Truck Demo
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default FoodTruckLandingPage;
