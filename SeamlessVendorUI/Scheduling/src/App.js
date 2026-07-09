/**
 * White Label Booking Application
 * Premium booking and loyalty system with sophisticated design
 * Supports Coffee & Conversations Collective and Seamlessly branding
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import BookingSystem from './components/booking/BookingSystem';
import LoyaltyRewards from './components/loyalty/LoyaltyRewards';
import BookingDashboard from './components/admin/BookingDashboard';
import ServiceConfig from './components/admin/ServiceConfig';
import EventsList from './components/events/EventsList';
import { getCurrentBrand, getBrandColors } from './config/whiteLabel';
import './styles/global.css';
import './styles/App.css';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('booking');
  const [customerId] = useState('customer_001');
  const brand = getCurrentBrand();

  // Apply brand colors to CSS variables
  useEffect(() => {
    const colors = getBrandColors();
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  // Update view based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/allevents') {
      setView('events');
    } else if (path === '/loyalty') {
      setView('loyalty');
    } else if (path === '/admin') {
      setView('admin');
    } else if (path === '/services') {
      setView('services');
    } else {
      setView('booking');
    }
  }, [location.pathname]);

  const handleBookingComplete = (booking) => {
    console.log('Booking completed:', booking);
    alert(`Booking confirmed! You earned ${booking.loyalty_points_earned} points!`);
  };

  const handleSelectEvent = (event) => {
    // Navigate to payment page with event details
    const params = new URLSearchParams({
      eventDate: event.date,
      eventName: event.name
    });
    window.location.href = `/payment.html?${params.toString()}`;
  };

  return (
    <>
      {/* Background Elements */}
      <div className="grid-background"></div>
      <div className="purple-glow"></div>
      
      <div className="app-container">
        {/* Navigation Header - Hide on events page */}
        {location.pathname !== '/allevents' && (
          <header className="app-header">
            <div className="header-container">
              <div className="brand">
                <h1 className="brand-title">{brand.name}</h1>
                <p className="brand-subtitle">{brand.tagline}</p>
              </div>
              
              <nav className="nav-menu">
                <button
                  onClick={() => navigate('/')}
                  className={`nav-button ${view === 'booking' ? 'active' : ''}`}
                >
                  Book Appointment
                </button>
                <button
                  onClick={() => navigate('/allevents')}
                  className={`nav-button ${view === 'events' ? 'active' : ''}`}
                >
                  Events
                </button>
                <button
                  onClick={() => navigate('/loyalty')}
                  className={`nav-button ${view === 'loyalty' ? 'active' : ''}`}
                >
                  Rewards
                </button>
                <button
                  onClick={() => navigate('/admin')}
                  className={`nav-button ${view === 'admin' ? 'active' : ''}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className={`nav-button ${view === 'services' ? 'active' : ''}`}
                >
                  Services
                </button>
              </nav>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="app-main">
          <Routes>
            <Route path="/allevents" element={<EventsList onSelectEvent={handleSelectEvent} />} />
            <Route path="/loyalty" element={<LoyaltyRewards customerId={customerId} />} />
            <Route path="/admin" element={<BookingDashboard />} />
            <Route path="/services" element={<ServiceConfig />} />
            <Route path="/" element={
              <BookingSystem 
                customerId={customerId}
                onBookingComplete={handleBookingComplete}
              />
            } />
          </Routes>
        </main>

        {/* Footer - Hide on events page */}
        {location.pathname !== '/allevents' && (
          <footer className="app-footer">
            <div className="footer-content">
              <p className="footer-text">© 2025 {brand.name}</p>
              <p className="footer-tagline">{brand.tagline}</p>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

