import React, { useState, useEffect } from 'react';
import config from '../config';
import InviteForm from '../components/InviteForm';
import '../styles/CapitalDinner.css';

function InvestorsPage() {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    document.title = 'The Capital Connection — Investors';
    window.scrollTo(0, 0);
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', "Meet pre-vetted founders at Orlando's invite-only Capital Connection. One evening, real conversations—no pitch decks.");
  }, []);

  return (
    <div className="capital-dinner-page">
      <div className="page-container">
        <section className="capital-dinner-hero">
          <span className="badge">Invite only</span>
          <h1>The Capital Connection</h1>
          <div className="capital-dinner-divider" />
          <p className="subheading">Meet pre-vetted founders. One evening. Real conversations.</p>
          <p className="supporting">Orlando&apos;s top founders, curated for serious investors.</p>
        </section>

        <section className="capital-dinner-section">
          <p style={{ fontWeight: 600, fontStyle: 'italic', color: '#1a1410' }}>
            No pitch decks. No presentations. Just cocktails, hors d&apos;oeuvres, and direct access.
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
            <p><strong>Date:</strong> {config.date}</p>
            <p><strong>Time:</strong> {config.time}</p>
            <p><strong>Location:</strong> {config.venueName}, {config.venueLocation}</p>
          </div>
        </section>

        <section className="capital-dinner-cta">
          <p className="seats-note">Invite only. {config.investorSeats} investor seats.</p>
          <button type="button" className="cta-button" onClick={() => setShowForm(true)}>
            Request Invitation
          </button>
        </section>

        <footer className="capital-dinner-footer">
          Questions? Email <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>
        </footer>
      </div>

      <InviteForm isOpen={showForm} onClose={() => setShowForm(false)} audience="investor" />
    </div>
  );
}

export default InvestorsPage;
