import React, { useEffect, useState } from 'react';
import '../styles/ModernHospitalityPlaybook.css';

const ModernHospitalityPlaybook = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = "The Modern Hospitality Playbook | Seamlessly";
    
    // Track page view
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Modern Hospitality Playbook',
        page_location: window.location.href,
        content_group1: 'Playbook',
        content_group2: 'Display'
      });
    }
  }, []);

  const handleDownloadHTML = async () => {
    setIsDownloading(true);

    try {
      // Track download event
      if (window.gtag) {
        window.gtag('event', 'download', {
          event_category: 'Playbook',
          event_label: 'Modern Hospitality Playbook HTML',
          value: 1
        });
      }

      // Fetch the HTML file from the assets folder
      const response = await fetch('/assets/modern-hospitality-playbook.html');
      if (!response.ok) {
        throw new Error('Failed to fetch HTML file');
      }
      
      const htmlContent = await response.text();
      
      // Create a blob and download it
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'modern-hospitality-playbook.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading HTML:', error);
      alert('There was an error downloading the HTML file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="playbook-container">
      <div className="playbook-header">
        <div className="playbook-header-content">
          <h1>The Modern Hospitality Playbook</h1>
          <p className="playbook-subtitle">
            7 Steps Cutting-Edge Venues Use to Compete in the 21st Century
          </p>
          <p className="playbook-description">
            A practical guide for venues, vendors, and operators who want higher revenue, lower stress, and better guest experiences—without adding complexity.
          </p>
          <button 
            onClick={handleDownloadHTML}
            disabled={isDownloading}
            className="download-button"
          >
            {isDownloading ? 'Downloading...' : 'Download HTML'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernHospitalityPlaybook;
