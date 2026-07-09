import React from 'react';
import '../styles/StatsModal.css';

const StatsModal = ({ statType, onClose }) => {
  // Content based on stat type with compelling copy
  const getModalContent = () => {
    switch (statType) {
      case 'wait-time':
        return {
          title: '30% Less Wait Time',
          benefits: [
            'AI-Powered Queue Management anticipates rush hours so customers never wait in frustration',
            'Smart Order Prioritization transforms chaotic drink prep into a symphony of efficiency',
            'Pre-Emptive Ordering eliminates the bar bottleneck, letting customers order from anywhere',
            'Multi-Order Processing turns your bartenders into mixology powerhouses, handling multiple orders simultaneously',
            'Visual Order Status keeps customers informed and happy, dramatically reducing "where"s my drink?" questions'
          ]
        };
      
      case 'revenue':
        return {
          title: '25% Revenue Increase',
          benefits: [
            'Personalized Upselling transforms $10 well drinks into $15+ premium experiences that customers love',
            'Smart Drink Recommendations unlock hidden profit margins by guiding customers to higher-value selections',
            'Reduced Walkaway Rate captures the 15% of impatient customers who would otherwise leave without ordering',
            'Increased Order Frequency turns one-drink customers into three-drink patrons with frictionless reordering',
            'Strategic Bundle Offers create irresistible drink packages that boost average check size by 30%'
          ]
        };
      
      case 'efficiency':
        return {
          title: '40% Increase in Staff Efficiency',
          benefits: [
            'Automated Order Taking slashes order-taking time, freeing bartenders to create drinks and generate revenue',
            'Inventory Management eliminates the costly "we"re out of that" moment after a customer has already decided',
            'Intelligent Workload Distribution ends the "slammed bartender/idle server" problem plaguing most bars',
            'Communication Streamlining eliminates costly errors that waste ingredients and frustrate customers',
            'Predictive Preparation gives bartenders a head start on upcoming orders, turning rush hour into rush profits'
          ]
        };
      
      default:
        return {
          title: 'Seamless Benefits',
          benefits: []
        };
    }
  };

  const content = getModalContent();
  
  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="stats-tooltip" onClick={handleModalClick}>
        <div className="tooltip-header">
          <h3>{content.title}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="tooltip-content">
          <ul>
            {content.benefits.map((benefit, index) => (
              <li key={index}>
                <span className="bullet-point">•</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default StatsModal;