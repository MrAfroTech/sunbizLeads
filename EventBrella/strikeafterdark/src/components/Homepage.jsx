import { useState, useEffect } from 'react';
import LoungeReservation from './LoungeReservation';

const BOWLING_EVENTBRITE_URL =
  'https://www.eventbrite.com/e/strike-after-dark-bosses-bowling-all-black-affair-leo-bash-tickets-1994258369467';

export default function Homepage() {
  const [showLounge, setShowLounge] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#lounge' || window.location.hash === '#lounge-details') {
      setShowLounge(true);
    }
  }, []);

  useEffect(() => {
    if (!showLounge) return;
    document.getElementById('lounge-details')?.scrollIntoView({ behavior: 'smooth' });
  }, [showLounge]);

  function openLounge(e) {
    e.preventDefault();
    setShowLounge(true);
  }

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-stage hero-stage-no-video">
            <div className="hero-pillar hero-pillar-center">
              <div className="hero-line hero-line--brand"><span className="hero-gold">Strike After Dark</span></div>
              <div className="hero-line hero-line--eyebrow"><span className="hero-gold">Tampa Bay&apos;s Premier Social Experience</span></div>
              <div className="rule"><span className="ln"></span><span className="diamond"></span><span className="ln r"></span></div>
              <div className="hero-line hero-line--schedule"><span className="hero-gold">Every 1st &amp; 3rd Thursday</span></div>
              <div className="hero-line hero-line--sub"><span className="hero-gold">Prebook through the end of 2026</span></div>
              <div className="hero-line hero-line--tag"><span className="hero-gold">Bowling. Vibes. Connections.</span></div>
              <div className="hero-line hero-line--tag2"><span className="hero-gold">One Night. Two Experiences.</span></div>
            </div>
          </div>

          <div className="info-strip">
            <div className="attire-badge"><div className="a1">Attire</div><div className="a2">All Black</div></div>
            <div className="info-chip"><b>9PM – Midnight</b> · Good Vibes Only</div>
            <div className="event-badge"><div className="a1">Event</div><div className="a2">25+</div></div>
          </div>

          <div className="cta-row">
            <a
              href={BOWLING_EVENTBRITE_URL}
              className="cta-btn primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="big">Reserve Bowling Experience</span>
              <span className="small">Secure your lane</span>
            </a>
            <a href="#lounge-details" className="cta-btn secondary" onClick={openLounge}>
              <span className="big">Reserve Social Lounge Experience</span>
              <span className="small">From $15 · Choose your pass</span>
            </a>
          </div>
        </div>
      </section>

      {showLounge && (
        <>
          <section className="panels theme-lounge" id="lounge-details">
            <div className="sec-head">
              <div className="sec-eyebrow">Social Lounge</div>
              <h2>You Choose Your Vibe</h2>
            </div>
            <div className="panel-grid panel-grid-single">
              <div className="panel frame"><div className="inner">
                <div className="icon-badge gold" aria-hidden="true">
                  <svg className="panel-icon" viewBox="0 0 60 60" fill="none">
                    <path d="M12 10 H48 L30 32 Z" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinejoin="round" />
                    <line x1="30" y1="32" x2="30" y2="50" stroke="#ffffff" strokeWidth="2.2" />
                    <line x1="18" y1="50" x2="42" y2="50" stroke="#ffffff" strokeWidth="2.2" />
                    <circle cx="22" cy="16" r="2" fill="#ffffff" />
                  </svg>
                </div>
                <h3>Social Lounge Experience</h3>
                <ul>
                  <li><span className="chk">✓</span>Premium lounge seating</li>
                  <li><span className="chk">✓</span>Pool tables</li>
                  <li><span className="chk">✓</span>Arcade games</li>
                  <li><span className="chk">✓</span>Curated music</li>
                  <li><span className="chk">✓</span>Networking &amp; good vibes</li>
                  <li><span className="chk">✓</span>The ultimate social atmosphere</li>
                </ul>
              </div></div>
            </div>
          </section>

          <section className="lounge theme-lounge" id="lounge">
            <LoungeReservation />
          </section>

          <footer>
            <div className="fw">STRIKE AFTER DARK</div>
            <div>Ticket admission via Get Tickets · Walk-ups $20 cash only</div>
            <div className="foot-row">
              <span>Facebook: Strike After Dark</span>
              <span>Instagram: Strike_After_Dark</span>
              <span>strikeafterdarkevents@gmail.com</span>
            </div>
          </footer>
        </>
      )}
    </>
  );
}
