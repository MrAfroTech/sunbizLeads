import React, { useState } from 'react';
import CashFinderForm from './CashFinderForm';
import '../styles/CashFinderPage.css';

const CashFinderPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleFormSubmit = (data) => {
    console.log('Form submitted with data:', data);
    setReportData(data);
    setSubmitted(true);
    
    // You might want to send this data to your backend here
    // For example: sendToBackend(data);
  };

  return (
    <div className="cash-finder-page">
      <div className="cash-finder-container">
        {!submitted ? (
          <>
            <div className="page-header">
              <h1>Bar Cash Finder Tool</h1>
              <p>Discover how much hidden revenue your bar is missing out on</p>
            </div>
            <CashFinderForm onSubmit={handleFormSubmit} />
          </>
        ) : (
          <div className="results-container">
            <div className="results-header">
              <h2>Your Cash Finder Report</h2>
              <p>Based on your inputs, here's how much additional revenue your bar could generate:</p>
            </div>
            
            <div className="results-summary">
              <div className="result-card">
                <h3>Peak Revenue Opportunity</h3>
                <div className="result-value">${reportData.peakOpportunity.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                <p>Annual revenue from improving to peak performance</p>
              </div>
              
              <div className="result-card">
                <h3>Inventory Savings</h3>
                <div className="result-value">${reportData.inventoryOpportunity.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                <p>Annual savings from optimized inventory</p>
              </div>
              
              <div className="result-card highlight">
                <h3>Total Annual Opportunity</h3>
                <div className="result-value">${reportData.totalOpportunity.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                <p>Combined revenue increase & cost savings</p>
              </div>
            </div>
            
            <div className="next-steps">
              <h3>Ready to unlock this potential?</h3>
              <p>Our team will reach out to discuss how we can help your venue achieve these results.</p>
              <a href="/demo" className="primary-button">Book a Demo</a>
              <button 
                onClick={() => setSubmitted(false)} 
                className="secondary-button"
              >
                Back to Calculator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFinderPage;