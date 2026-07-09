import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOMetaTags from './SEOMetaTags';
import HospitalitySchema from './HospitalitySchema';
import '../styles/LocationLandingPage.css';

const FestivalLandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="location-landing-page">
      <SEOMetaTags 
        title="Festival Crowd Management & Seasonal Scalability | Seamless"
        description="Advanced crowd management and seasonal scalability solutions for festivals and events. Revenue maximization through efficient crowd control and service standardization."
      />
      <HospitalitySchema pageType="festival" />
      
      {/* Hero Section */}
      <section className="location-hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Festival Crowd Management & Seasonal Scalability</h1>
          <p className="hero-subtitle">
            Advanced crowd management technology for festivals and events. Seamlessly scale operations during peak seasons with revenue maximization tools.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">75%</span>
              <span className="stat-label">Faster Service</span>
            </div>
            <div className="stat">
              <span className="stat-number">40%</span>
              <span className="stat-label">Revenue Increase</span>
            </div>
            <div className="stat">
              <span className="stat-number">90%</span>
              <span className="stat-label">Crowd Management</span>
            </div>
          </div>
          <button 
            className="hero-cta primary-button"
            onClick={() => document.getElementById('demo-form').scrollIntoView({ behavior: 'smooth' })}
          >
            Get Your Festival Demo
          </button>
        </div>
      </section>
      
      {/* Problem Section */}
      <section className="location-problem">
        <div className="container">
          <h2>Festival & Event Challenges</h2>
          <div className="problem-grid">
            <div className="problem-item">
              <div className="problem-icon">👥</div>
              <h3>Crowd Management</h3>
              <p>Managing massive crowds during peak festival hours with limited staff and infrastructure</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">📈</div>
              <h3>Seasonal Scalability</h3>
              <p>Scaling operations from off-season to peak festival periods without over-investing</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">💰</div>
              <h3>Revenue Maximization</h3>
              <p>Capturing maximum revenue during limited festival windows and peak attendance periods</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">⚡</div>
              <h3>Service Standardization</h3>
              <p>Maintaining consistent service quality across multiple vendors and high-volume periods</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Solution Section */}
      <section className="location-solution">
        <div className="container">
          <h2>Festival Crowd Management Solutions</h2>
          <div className="solution-content">
            <div className="solution-text">
              <h3>Advanced Crowd Management Technology</h3>
              <p>
                Seamless provides festival-specific crowd management and seasonal scalability solutions designed for 
                high-volume events. From music festivals to food truck rallies, our technology handles peak crowds 
                with advanced revenue maximization and service standardization tools.
              </p>
              <ul className="solution-features">
                <li>✅ Advanced crowd management algorithms</li>
                <li>✅ Seasonal scalability for peak periods</li>
                <li>✅ Revenue maximization during high-traffic events</li>
                <li>✅ Service standardization across all vendors</li>
                <li>✅ Real-time crowd density monitoring</li>
                <li>✅ Dynamic pricing for peak demand periods</li>
              </ul>
            </div>
            <div className="solution-visual">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-demo">
                    <div className="app-header">Festival Ordering</div>
                    <div className="menu-items">
                      <div className="menu-item">🍔 Festival Burger - $15</div>
                      <div className="menu-item">🍕 Artisan Pizza - $18</div>
                      <div className="menu-item">🥗 Fresh Salad - $12</div>
                    </div>
                    <div className="order-button">Order Now - Skip Line</div>
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
          <h2>Perfect for Festival & Event Venues</h2>
          <div className="venue-types">
            <div className="venue-type">
              <h3>Music Festivals</h3>
              <p>Large-scale music festivals requiring advanced crowd management and seasonal scalability for peak attendance periods</p>
            </div>
            <div className="venue-type">
              <h3>Food Truck Rallies</h3>
              <p>Mobile food events needing revenue maximization and service standardization across multiple vendors</p>
            </div>
            <div className="venue-type">
              <h3>Cultural Festivals</h3>
              <p>Cultural events requiring crowd management solutions and seasonal scalability for varying attendance</p>
            </div>
            <div className="venue-type">
              <h3>Sports Events</h3>
              <p>Stadium and arena events needing advanced crowd management and revenue maximization tools</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Demo Form Section */}
      <section id="demo-form" className="location-demo-form">
        <div className="container">
          <h2>Get Your Festival Crowd Management Demo</h2>
          <p>See how Seamless can transform your festival operations with advanced crowd management and seasonal scalability</p>
          
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
                <label htmlFor="businessName">Festival/Event Name *</label>
                <input type="text" id="businessName" name="businessName" required placeholder="e.g., Summer Music Festival, Food Truck Rally" />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="eventType">Event Type</label>
              <select id="eventType" name="eventType">
                <option value="">Select event type</option>
                <option value="music-festival">Music Festival</option>
                <option value="food-truck-rally">Food Truck Rally</option>
                <option value="cultural-festival">Cultural Festival</option>
                <option value="sports-event">Sports Event</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Tell us about your festival challenges</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                placeholder="What are your biggest crowd management challenges? How many attendees do you typically handle? What's your peak season?"
              ></textarea>
            </div>
            
            <button type="submit" className="primary-button submit-button">
              Get My Festival Demo
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default FestivalLandingPage;
