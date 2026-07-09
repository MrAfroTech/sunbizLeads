import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/DemoPage.css';

const DemoPage = () => {
  return (
    <div className="demo-page">
      

      {/* Video Demo Section */}
      <div className="video-demo-section">
        <div className="video-container">
          <div className="video-poster" id="videoPoster">
            <div className="loading-container">
              <div className="video-overlay"></div>
              <div className="gradient-overlay"></div>
              <div className="grid-pattern"></div>
              
              <div className="logo">
                <span className="ez-text">Ez</span><span className="drink-text">Drink</span>
              </div>
              
              <div className="loading-message">
                Revolutionizing hospitality, one order at a time...
              </div>
              
              <div className="loading-bar">
                <div className="loading-progress"></div>
              </div>
            </div>
          </div>
          <video 
            controls 
            width="100%" 
            className="demo-video"
            preload="auto"
            playsInline
            autoPlay
            muted
            onCanPlay={() => {
              document.getElementById('videoPoster').style.display = 'none';
            }}
          >
            <source src="https://ly05c9rwajtfq1zb.public.blob.vercel-storage.com/demoMay2025-PCmgi9wrTvfWjB9wDLTP83iIsSTBhE.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="demo-features">
        <div className="feature-highlight">
          <div className="feature-icon">⚡</div>
          <h3>Speed</h3>
          <p>Cut wait times by 30%</p>
        </div>
        <div className="feature-highlight">
          <div className="feature-icon">💰</div>
          <h3>Revenue</h3>
          <p>Increase sales by 25%</p>
        </div>
        <div className="feature-highlight">
          <div className="feature-icon">👥</div>
          <h3>Efficiency</h3>
          <p>Boost staff productivity by 40%</p>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;