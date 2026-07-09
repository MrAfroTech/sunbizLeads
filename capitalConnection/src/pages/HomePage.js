import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import config from '../config';
import '../styles/CapitalDinner.css';

function HomePage() {
  useEffect(() => {
    document.title = 'The Capital Connection';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="capital-dinner-page">
      <div className="page-container">
        <section className="capital-dinner-hero">
          <span className="badge">Invite only</span>
          <h1>The Capital Connection</h1>
          <div className="capital-dinner-divider" />
          <p className="subheading">One evening. Real conversations. No pitch decks.</p>
          <p className="supporting">Orlando&apos;s invite-only event connecting investors and founders.</p>
        </section>

        <section className="capital-dinner-section capital-dinner-cta">
          <p className="subheading" style={{ marginBottom: 24 }}>I am a…</p>
          <div className="home-choices">
            <Link to="/investors" className="home-choice-btn">
              Investor
            </Link>
            <Link to="/founders" className="home-choice-btn">
              Founder
            </Link>
          </div>
          <p className="seats-note" style={{ marginTop: 20, marginBottom: 0 }}>
            Each track has limited seats. Request an invitation from your track page.
          </p>
        </section>

        <footer className="capital-dinner-footer">
          <p>Questions? <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></p>
        </footer>
      </div>
    </div>
  );
}

export default HomePage;
