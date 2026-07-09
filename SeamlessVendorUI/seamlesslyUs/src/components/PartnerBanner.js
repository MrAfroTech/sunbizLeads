import React from 'react';

const PartnerBanner = () => {
  return (
    <>
      <div className="partner-banner-container">
        <div className="partner-banner">
          <img 
            src="/orlandopirateslogo.png"
            alt="Orlando Pirates Logo"
            className="partner-banner-logo"
            onError={(e) => {
              console.error('Orlando Pirates logo failed to load:', e.target.src);
            }}
          />
          <div className="partner-banner-text">
            Official Partner of the Orlando Pirates<br />
            (Calling the 20,000+ seat Kia Center Home)
          </div>
        </div>
      </div>

      <style>{`
        .partner-banner-container {
          width: 100%;
          position: fixed;
          top: 80px;
          left: 0;
          z-index: 999;
          margin: 0 0 20px 0;
        }

        .partner-banner {
          width: 100%;
          background: linear-gradient(-45deg, #d4af37, #e0b841, #f5d76e, #e0b841);
          border-bottom: 2px solid rgba(139, 116, 78, 0.6);
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 12px 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .partner-banner-logo {
          width: 55px;
          height: auto;
          max-height: 55px;
          object-fit: contain;
        }

        .partner-banner-text {
          font-size: 16px;
          font-weight: 700;
          color: #1a1410;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          text-align: center;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .partner-banner {
            padding: 10px 16px;
            gap: 12px;
          }

          .partner-banner-logo {
            width: 45px;
            max-height: 45px;
          }

          .partner-banner-text {
            font-size: 13px;
            letter-spacing: 0.6px;
          }
        }

        @media (max-width: 480px) {
          .partner-banner {
            padding: 8px 12px;
            gap: 10px;
            flex-direction: row;
          }

          .partner-banner-logo {
            width: 40px;
            max-height: 40px;
          }

          .partner-banner-text {
            font-size: 11px;
            letter-spacing: 0.4px;
            line-height: 1.3;
          }
        }
      `}</style>
    </>
  );
};

export default PartnerBanner;
