import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ scrollPosition, onOpenFunnel, onOpenLogin, onOpenBooking }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navbarClass, setNavbarClass] = useState('');

  useEffect(() => {
    // Change navbar style on scroll
    if (scrollPosition > 50) {
      setNavbarClass('navbar-scrolled');
    } else {
      setNavbarClass('');
    }
  }, [scrollPosition]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Make sure this handler is properly defined
  const handleButtonClick = () => {
    console.log("Button clicked, opening funnel");
    if (typeof onOpenFunnel === 'function') {
      onOpenFunnel();
    } else {
      console.error("onOpenFunnel is not a function");
    }
    setMenuOpen(false);
  };

  const handleScheduleDemo = () => {
    if (typeof onOpenBooking === 'function') {
      onOpenBooking();
    } else {
      console.error('onOpenBooking is not a function');
    }
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${navbarClass} ${menuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-container">
            <span className="logo-text">
              <span className="gradient-text">Seam</span>
              <span className="accent-text">lessly</span>
            </span>
          </div>
        </Link>

        <div className="menu-icon" onClick={toggleMenu}>
          <div className={`hamburger ${menuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/increase-revenue" className="nav-link" onClick={() => setMenuOpen(false)}>
              Solutions
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/reduce-expenses" className="nav-link" onClick={() => setMenuOpen(false)}>
              Operations
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/investors" className="nav-link" onClick={() => setMenuOpen(false)}>
              Investors
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/case-studies" className="nav-link" onClick={() => setMenuOpen(false)}>
              Case Studies
            </Link>
          </li>
          <li className="nav-item">
            <button 
              className="nav-button login-button" 
              onClick={() => {
                if (onOpenLogin) onOpenLogin();
                setMenuOpen(false);
              }}
            >
              Login
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className="nav-button schedule-demo-button"
              onClick={handleScheduleDemo}
            >
              Schedule a Demo
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;