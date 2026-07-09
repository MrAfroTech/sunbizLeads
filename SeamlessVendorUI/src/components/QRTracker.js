// QRTracker.js
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const QRTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(location.search);
    const trackingId = params.get('t');
    
    if (trackingId) {
      console.log(`QR Code scan detected: ${trackingId}`);
      
      // Record the scan
      recordScan(trackingId);
      
      // Redirect to appropriate page (remove tracking parameter)
      const destinationPath = location.pathname;
      navigate(destinationPath, { replace: true });
    }
  }, [location, navigate]);
  
  // Function to record the scan
  const recordScan = async (trackingId) => {
    try {
      // Get additional data if needed
      const scanData = {
        trackingId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        page: location.pathname
      };
      
      // Store in localStorage for now (for demo purposes)
      const existingScans = JSON.parse(localStorage.getItem('seamless-qr-scans') || '[]');
      existingScans.push(scanData);
      localStorage.setItem('seamless-qr-scans', JSON.stringify(existingScans));
      
      // In a real application, you would send this to your server
      // await fetch('/api/track-qr-scan', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(scanData)
      // });
    } catch (error) {
      console.error('Error recording QR scan:', error);
    }
  };
  
  // This component doesn't render anything
  return null;
};

export default QRTracker;