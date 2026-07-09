import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ChaosMasteryNewsletterPage.css';
import issues from '../generated/chaosMasteryNewsletterIssues.json';
import ChaosMasteryWelcomeModal, {
  CHAOS_MASTERY_WELCOME_MODAL_DELAY_MS,
  useChaosMasteryWelcomeModal,
} from './ChaosMasteryWelcomeModal';
import { isChaosMasteryWelcomeModalDismissed } from '../lib/chaosMasteryWelcomeModalStorage';

const newsletterBackgrounds = [
  '/pexels-bluerhinomedia-2788792.jpg',
  '/pexels-brett-sayles-2339712.jpg',
  '/pexels-imin-technology-276315592-12935077.jpg',
  '/pexels-imin-technology-276315592-12935100.jpg',
  '/pexels-pixabay-260922.jpg',
  '/pexels-pixabay-262047.jpg',
  '/pexels-wb2008-2290070.jpg',
];

const ChaosMasteryNewsletterPage = () => {
  const modalScheduledRef = useRef(false);
  const { isOpen, open, dismiss, closeAfterSubscribe } = useChaosMasteryWelcomeModal();

  useEffect(() => {
    if (isChaosMasteryWelcomeModalDismissed() || modalScheduledRef.current) return undefined;

    modalScheduledRef.current = true;
    const timer = window.setTimeout(() => {
      open();
    }, CHAOS_MASTERY_WELCOME_MODAL_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <div className="newsletter-page">
      <section className="newsletter-hero">
        <p className="newsletter-eyebrow">Seamlessly.us</p>
        <h1>Chaos Mastery Newsletter</h1>
        <p>
          Weekly hospitality strategy insights. This page keeps a running total of all Chaos
          Mastery issues.
        </p>
        <div className="newsletter-total">Total Issues: {issues.length}</div>
      </section>

      <section className="newsletter-list">
        {issues.map((issue, index) => {
          const imageUrl = newsletterBackgrounds[index % newsletterBackgrounds.length];
          const cardStyle = {
            backgroundImage: `linear-gradient(180deg, rgba(8, 16, 32, 0.78) 0%, rgba(8, 16, 32, 0.9) 100%), url(${imageUrl})`,
          };

          return (
          <a href={issue.href} className="newsletter-card-link" key={issue.href}>
            <article className="newsletter-card" style={cardStyle}>
              <div className="newsletter-card-top">
                <span className="newsletter-card-issue">Issue {issue.id}</span>
              </div>
              <h2 className="newsletter-card-title">{issue.title}</h2>
              <div className="newsletter-card-bottom">
                {[issue.dateLabel, issue.readTime].filter(Boolean).length ? (
                  <p className="newsletter-card-meta">
                    {[issue.dateLabel, issue.readTime].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
                <span className="newsletter-card-cta">Read issue</span>
              </div>
            </article>
          </a>
          );
        })}
      </section>

      <div className="newsletter-home-link-wrap">
        <Link to="/" className="newsletter-home-link">
          Back to Home
        </Link>
      </div>

      <ChaosMasteryWelcomeModal
        isOpen={isOpen}
        onDismiss={dismiss}
        onSubscribed={closeAfterSubscribe}
      />
    </div>
  );
};

export default ChaosMasteryNewsletterPage;
