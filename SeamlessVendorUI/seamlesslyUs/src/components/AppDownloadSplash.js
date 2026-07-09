import React from 'react';
import '../styles/AppDownloadSplash.css';
// Import the SVG directly
import ezLogoThin from '../styles/ez-logo-ultra-thin.svg';

const AppDownloadSplash = () => {
  return (
    <div className="app-splash-container">
      <div className="app-splash-content">
        <div className="app-splash-header">
          <h1 className="app-splash-title">
            <span className="gradient-text">Ez</span>
            <span className="accent-text">Drink</span>
          </h1>
          <p className="app-splash-subtitle">
            Your VIP Pass to the Perfect Night Out
          </p>
        </div>

        <div className="app-showcase">
          <div className="phone-mockup">
            <div className="phone-frame">
              <div className="phone-screen">
                {/* Only this part is changed - the phone mockup content */}
                <div className="mockup-content">
                  <div className="mockup-logo-container">
                    <img src={ezLogoThin} alt="EZ" className="mockup-logo" />
                  </div>
                  <div className="mockup-welcome">
                    <p className="welcome-text">Welcome back Maurice.</p>
                    <p className="drink-text">Would you like your usual Angel's Envy Smoked Old Fashioned?</p>
                  </div>
                  <div className="mockup-buttons">
                    <button className="mockup-button yes-button">Yes, Please</button>
                    <button className="mockup-button browse-button">Browse Menu</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="app-features">
            <h2 className="features-title">Elevate Your Night Out</h2>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Skip the Line, Live Divine</h3>
                <p>Order and pay right from your phone. No more fighting through crowds – be the VIP you were born to be.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Drink Memory™ – Never Repeat Yourself</h3>
                <p>We remember your cosmic cocktail combinations so you don't have to. Your perfect libation, manifested at the tap of a button.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Party Radar™ – Never Miss a Beat</h3>
                <p>See where your tribe is gathering in real-time. Join the vibration of the hottest spots without the guesswork.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="download-section">
          <h2 className="download-title">Unlock Your <span className="gradient-text">VIP Experience</span></h2>
          <p className="download-subtitle">Download now and transform from ordinary patron to nightlife royalty</p>
          
          <div className="app-store-buttons">
            <a href="#" className="store-button app-store">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="store-icon">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.039-3.903 1.183-4.94 3-.2.039-.43 7.043 3.877 10.98.9 1.351 2.017 2.898 3.523 2.836 1.39-.039 1.945-.895 3.642-.895 1.697 0 2.17.895 3.673.856 1.542-.04 2.523-1.391 3.48-2.742 1.078-1.56 1.5-3.061 1.539-3.143-.04 0-2.971-1.129-3-4.55-.04-2.837 2.327-4.23 2.444-4.268-1.35-1.977-3.442-2.207-4.174-2.246-1.93-.158-3.481 1.04-4.27 1.04l.166-.039z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 3.5c.5-1.396 1.862-2.5 3.5-2.5 1.5 0 2.75 1.104 3.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>App Store</span>
            </a>
            <a href="#" className="store-button play-store">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="store-icon">
                <path d="M6.263 3.309l12.96 7.095a1.537 1.537 0 010 2.693l-12.96 7.095c-1.005.55-2.263-.137-2.263-1.347V4.656c0-1.21 1.258-1.896 2.263-1.347zm0 0L16.05 12l-9.787 8.691" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Google Play</span>
            </a>
          </div>
        </div>

        <div className="perks-section">
          <h2 className="perks-title">The Velvet Rope Treatment</h2>
          
          <div className="perks-grid">
            <div className="perk-card">
              <div className="perk-icon">🎭</div>
              <h3>Behind-the-Bar Access</h3>
              <p>Exclusive off-menu concoctions crafted just for app users. Drink what the uninitiated don't even know exists.</p>
            </div>
            
            <div className="perk-card">
              <div className="perk-icon">⚡</div>
              <h3>Flash Drink Drops</h3>
              <p>Limited-time offers that materialize like magic when you're near partner bars. Spontaneity, meet savings.</p>
            </div>
            
            <div className="perk-card">
              <div className="perk-icon">🎁</div>
              <h3>Birthday Liberation</h3>
              <p>Free signature cocktail at any partner bar on your birthday. Because your revolution around the sun deserves lubrication.</p>
            </div>
            
            <div className="perk-card">
              <div className="perk-icon">🔥</div>
              <h3>Heat Map Access</h3>
              <p>See which venues are buzzing in real-time. Never waste precious evening energy on a dead scene again.</p>
            </div>
          </div>
        </div>

        <div className="testimonial-section">
          <div className="testimonial">
            <div className="testimonial-content">
              "I used to waste half my night trying to catch the bartender's eye. Now I step in, tap my phone, and my drink manifests while others languish in limbo. It's like having a VIP pass to existence itself."
              <div className="testimonial-author">— Sofia M., Los Angeles</div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2 className="cta-title">Miss the Line, Not the Party</h2>
          <p className="cta-text">Join the revolution of 100,000+ nightlife illuminati who've transcended the ordinary bar experience</p>
          <a href="#" className="cta-button">
            Download Free — Ascend Tonight
          </a>
          <p className="guarantee-text">
            No subscription fees. No cosmic complications. Just liquid transcendence.
          </p>
        </div>

        <div className="splash-footer">
          <p className="footer-text">© 2025 EzDrink. All rights reserved.</p>
          <p className="footer-tagline">
            <span className="gradient-text">Ez</span>
            <span className="accent-text">Drink</span> - DRINK SMARTER, PARTY HARDER
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadSplash;