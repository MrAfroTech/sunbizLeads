import React, { useState } from 'react';
import '../styles/HeroSection.css';

const PhoneMenuPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openPopup = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closePopup = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <div className="device-mockup" onClick={openPopup}>
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="app-screen">
              <div className="app-header">
                <div className="app-logo">EzDrink</div>
                <div className="app-icon"></div>
              </div>
              <div className="app-content">
                <div className="menu-item">
                  <div className="menu-item-info">
                    <div className="menu-item-name">Old Fashioned</div>
                    <div className="menu-item-price">$12</div>
                  </div>
                  <div className="menu-item-action">+</div>
                </div>
                <div className="menu-item active">
                  <div className="menu-item-info">
                    <div className="menu-item-name">Margarita</div>
                    <div className="menu-item-price">$10</div>
                  </div>
                  <div className="menu-item-action">+</div>
                </div>
                <div className="menu-item">
                  <div className="menu-item-info">
                    <div className="menu-item-name">Mojito</div>
                    <div className="menu-item-price">$11</div>
                  </div>
                  <div className="menu-item-action">+</div>
                </div>
                <div className="menu-item">
                  <div className="menu-item-info">
                    <div className="menu-item-name">Espresso Martini</div>
                    <div className="menu-item-price">$14</div>
                  </div>
                  <div className="menu-item-action">+</div>
                </div>
              </div>
              <div className="app-footer">
                <div className="order-button">Order Now</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="menu-popup-overlay" onClick={closePopup}>
          <div className="menu-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={closePopup}>×</button>
            <h2>Seamless Menu Integration</h2>
            <p className="subtitle">Your entire bar menu, digitized in minutes</p>
            
            <div className="popup-content">
              <h3>No More Menu Maintenance Headaches</h3>
              <p>EzDrink transforms your existing menu into a digital masterpiece with zero effort on your part. Our team handles the entire process, from initial setup to seasonal updates.</p>
              
              <h3>Three Simple Steps to Digital Transformation</h3>
              <ol>
                <li><strong>Share Your Menu</strong> - Send us your current menu in any format</li>
                <li><strong>Magic Happens</strong> - Our team digitizes everything</li>
                <li><strong>Go Live</strong> - Within 48 hours, your menu is available via the app</li>
              </ol>
              
              <h3>Smart Features That Drive Revenue</h3>
              <ul>
                <li><strong>Intelligent Upselling</strong> - Suggests premium spirits and add-ons</li>
                <li><strong>Dynamic Pricing</strong> - Easily implement happy hour specials</li>
                <li><strong>Real-Time Updates</strong> - Update when items sell out</li>
                <li><strong>Customer Insights</strong> - Learn which items drive revenue</li>
              </ul>
              
              <blockquote>
                "EzDrink's menu integration was shockingly easy. We sent our menu on Monday and were fully digital by Wednesday."
                <cite>— James W., Owner, Copper & Oak Lounge</cite>
              </blockquote>
            </div>
            
            <button className="popup-button">Schedule Your Free Menu Integration</button>
          </div>
        </div>
      )}
    </>
  );
};

export default PhoneMenuPopup;