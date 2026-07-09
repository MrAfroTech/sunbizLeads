import React, { useState, useEffect } from 'react';
import config from '../config';
import InviteForm from '../components/InviteForm';
import '../styles/CapitalDinner.css';

function FoundersPage() {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    document.title = 'The Capital Connection — Founders';
    window.scrollTo(0, 0);
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', "Get in front of active investors at Orlando's invite-only Capital Connection. Real investors, in person—not another demo day.");
  }, []);

  return (
    <div className="capital-dinner-page">
      <div className="page-container">
        <section className="capital-dinner-hero">
          <span className="badge">Invite only</span>
          <h1>The Capital Connection</h1>
          <div className="capital-dinner-divider" />
          <p className="subheading">Get in front of active investors. In person. This month.</p>
          <p className="supporting">Not another demo day. Connect with the most influential minds in Orlando&apos;s investment community.</p>
        </section>

        <section className="capital-dinner-section">
          <h2>What to expect</h2>
          <ul className="capital-dinner-list">
            <li>Meet active investors and decision-makers</li>
            <li>5-minute conversations with each investor</li>
            <li>Open networking with cocktails and hors d&apos;oeuvres</li>
            <li>Everyone in the room is vetted and serious</li>
          </ul>
        </section>

        <section className="capital-dinner-section">
          <h2>Requirements</h2>
          <ul className="capital-dinner-list">
            <li>Building in SaaS, AI, consumer tech, or related</li>
            <li>$100K+ ARR or backing from known angels</li>
            <li>Based in or expanding to Orlando market</li>
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
          <p className="seats-note">Invite only. {config.founderSeats} founder spots.</p>
          <button type="button" className="cta-button" onClick={() => setShowForm(true)}>
            Request Invitation
          </button>
        </section>

        <footer className="capital-dinner-footer">
          Questions? Email <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>
        </footer>
      </div>

      <InviteForm isOpen={showForm} onClose={() => setShowForm(false)} audience="founder" />
    </div>
  );
}

export default FoundersPage;
