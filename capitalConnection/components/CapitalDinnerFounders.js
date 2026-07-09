import React, { useState, useEffect } from 'react';
import capitalDinnerConfig from '../config/capitalDinnerConfig';
import CapitalDinnerInviteForm from './CapitalDinnerInviteForm';
import '../styles/CapitalDinner.css';

const TITLE = 'The Capital Dinner — Founders | Seamless';
const DESCRIPTION =
  "Get in front of active investors at Orlando's invite-only Capital Dinner. Real investors, in person—not another demo day.";

const CapitalDinnerFounders = () => {
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
          <p className="subheading">Get in front of active investors. In person. This month.</p>
          <p className="supporting">Not another demo day. Real investors writing checks in Orlando.</p>
        </section>

        <section className="capital-dinner-section">
          <h2>What to expect</h2>
          <ul className="capital-dinner-list">
            <li>15 investors actively deploying capital</li>
            <li>5-minute conversations with each one</li>
            <li>Then open networking over dinner</li>
            <li>Everyone there is qualified and serious</li>
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
            <p><strong>Date:</strong> {capitalDinnerConfig.date}</p>
            <p><strong>Time:</strong> {capitalDinnerConfig.time}</p>
            <p><strong>Location:</strong> {capitalDinnerConfig.venueName}, {capitalDinnerConfig.venueLocation}</p>
          </div>
        </section>

        <section className="capital-dinner-cta">
          <p className="seats-note">Invite only. {capitalDinnerConfig.founderSeats} founder spots.</p>
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
        audience="founder"
      />
    </div>
  );
};

export default CapitalDinnerFounders;
