import React, { useState, useEffect } from 'react';
import capitalDinnerConfig from '../config/capitalDinnerConfig';
import CapitalDinnerInviteForm from './CapitalDinnerInviteForm';
import '../styles/ContentPage.css';
import '../styles/CapitalDinner.css';

const TITLE = 'The Capital Dinner — Investors | Seamless';
const DESCRIPTION =
  "Meet pre-vetted founders at Orlando's invite-only Capital Dinner. One evening, real conversations—no pitch decks.";

const CapitalDinnerInvestors = () => {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = TITLE;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', DESCRIPTION);
  }, []);

  return (
    <div className="capital-dinner-page content-page">

      <div className="page-container">
        <section className="capital-dinner-hero">
          <span className="badge">Invite only</span>
          <h1>The Capital Dinner</h1>
          <div className="capital-dinner-divider" />
          <p className="subheading">Meet pre-vetted founders. One evening. Real conversations.</p>
          <p className="supporting">Orlando&apos;s top founders, curated for serious investors.</p>
        </section>

        <section className="capital-dinner-section">
          <p style={{ fontWeight: 600, fontStyle: 'italic', color: '#1a1410' }}>
            No pitch decks. No presentations. Just dinner and direct access.
          </p>
        </section>

        <section className="capital-dinner-section">
          <h2>What to expect</h2>
          <ul className="capital-dinner-list">
            <li>8–12 founders across SaaS, AI, and consumer tech</li>
            <li>5-minute rotations, then open networking</li>
            <li>Founders doing $100K–$2M ARR or backed by known angels</li>
            <li>Private venue, 30 people max</li>
          </ul>
        </section>

        <section className="capital-dinner-section">
          <h2>Event details</h2>
          <div className="capital-dinner-details">
            <p><strong>Date:</strong> {capitalDinnerConfig.date}</p>
            <p><strong>Time:</strong> {capitalDinnerConfig.time}</p>
            <p><strong>Location:</strong> {capitalDinnerConfig.venueName}, {capitalDinnerConfig.venueLocation}</p>
          </div>
        </section>

        <section className="capital-dinner-cta">
          <p className="seats-note">Invite only. {capitalDinnerConfig.investorSeats} investor seats.</p>
          <button
            type="button"
            className="cta-button"
            onClick={() => setShowForm(true)}
          >
            Request Invitation
          </button>
        </section>

        <footer className="capital-dinner-footer">
          Questions? Email{' '}
          <a href={`mailto:${capitalDinnerConfig.contactEmail}`}>{capitalDinnerConfig.contactEmail}</a>
        </footer>
      </div>

      <CapitalDinnerInviteForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        audience="investor"
      />
    </div>
  );
};

export default CapitalDinnerInvestors;
