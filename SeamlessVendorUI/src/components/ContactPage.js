import React, { useEffect } from 'react';
import ContactSection from './ContactSection';
import '../styles/ContentPage.css';

const ContactPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });
  }, []);

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="gradient-overlay"></div>
        <div className="header-content">
          <h1 className="fade-in">Get In Touch</h1>
          <p className="fade-in">Interested in Seamless? Let's talk about how we can help your business.</p>
        </div>
      </div>
      
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <ContactSection />
      </div>
    </div>
  );
};

export default ContactPage;


