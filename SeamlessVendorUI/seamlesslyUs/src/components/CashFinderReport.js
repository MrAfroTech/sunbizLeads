import React, { useState } from 'react';
import CashFinderForm from './CashFinderForm';
import CashFinderReport from './CashFinderReport';
import LeadCaptureFunnel from './LeadCaptureFunnel';

const CashFinderSystem = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showLeadFunnel, setShowLeadFunnel] = useState(true);
  
  const handleFormSubmit = (data) => {
    // Set the report data with calculated values
    setReportData(data);
    setFormSubmitted(true);
    
    // Optional: Send data to your backend or analytics
    // saveDataToBackend(data);
    
    // Optional: Send the email report
    // sendEmailReport(data);
  };
  
  const handleLeadFunnelClose = () => {
    setShowLeadFunnel(false);
  };
  
  // When user completes the Cash Finder Form from the Lead Funnel
  const handleCashFinderFromLeadFunnel = (data) => {
    setReportData(data);
    setFormSubmitted(true);
    setShowLeadFunnel(false);
  };
  
  return (
    <div className="cash-finder-system">
      {/* Lead Capture Funnel as the first step */}
      {showLeadFunnel && (
        <LeadCaptureFunnel 
          isOpen={showLeadFunnel} 
          onClose={handleLeadFunnelClose} 
          onCashFinderSubmit={handleCashFinderFromLeadFunnel}
        />
      )}
      
      {/* Show the report if form was submitted either directly or through the funnel */}
      {formSubmitted ? (
        <CashFinderReport reportData={reportData} />
      ) : (
        // Only show the direct form if the lead funnel is closed
        !showLeadFunnel && <CashFinderForm onSubmit={handleFormSubmit} />
      )}
    </div>
  );
};

export default CashFinderSystem;