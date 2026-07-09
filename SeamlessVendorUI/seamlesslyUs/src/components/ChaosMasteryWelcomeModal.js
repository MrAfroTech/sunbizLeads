import React, { useCallback, useEffect, useState } from 'react';
import '../styles/ChaosMasteryWelcomeModal.css';
import { submitIgSub } from '../lib/igSubs';
import {
  isChaosMasteryWelcomeModalDismissed,
  markChaosMasteryWelcomeModalDismissed,
  markChaosMasteryWelcomeModalSubscribed,
} from '../lib/chaosMasteryWelcomeModalStorage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CHAOS_MASTERY_WELCOME_MODAL_DELAY_MS = 4000;
const SUCCESS_AUTO_CLOSE_MS = 2800;

export function useChaosMasteryWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (isChaosMasteryWelcomeModalDismissed()) return;
    setIsOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    markChaosMasteryWelcomeModalDismissed();
    setIsOpen(false);
  }, []);

  const closeAfterSubscribe = useCallback(() => {
    markChaosMasteryWelcomeModalSubscribed();
    setIsOpen(false);
  }, []);

  return { isOpen, open, dismiss, closeAfterSubscribe };
}

const ChaosMasteryWelcomeModal = ({ isOpen, onDismiss, onSubscribed }) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setError('');
      return undefined;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!submitted) return undefined;

    const timer = window.setTimeout(() => {
      onSubscribed?.();
    }, SUCCESS_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [submitted, onSubscribed]);

  const handleDismiss = () => {
    onDismiss?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName) {
      setError('Please enter your first name.');
      return;
    }
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);

    const result = await submitIgSub({
      firstName: trimmedFirstName,
      email: trimmedEmail,
      phone: trimmedPhone || undefined,
      metadata: { form: 'chaos_mastery_welcome_modal' },
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(
        result.error === 'not_configured'
          ? 'Signup is temporarily unavailable. Please try again later.'
          : 'Something went wrong. Please try again.'
      );
      return;
    }

    setSubmitted(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="cm-welcome-modal-overlay"
      role="presentation"
      onClick={handleDismiss}
    >
      <div
        className="cm-welcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-welcome-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="cm-welcome-modal__close"
          aria-label="Close"
          onClick={handleDismiss}
        >
          ×
        </button>

        {submitted ? (
          <div className="cm-welcome-modal__success">
            <div className="cm-welcome-modal__success-icon" aria-hidden="true">
              ✓
            </div>
            <p className="cm-welcome-modal__success-text">
              You&apos;re in! Your first hospitality insight will arrive soon.
            </p>
          </div>
        ) : (
          <>
            <p className="cm-welcome-modal__eyebrow">Seamlessly.us</p>
            <h2 id="cm-welcome-modal-title" className="cm-welcome-modal__headline">
              Welcome to the Private Hospitality Community
            </h2>
            <p className="cm-welcome-modal__subheadline">
              Get one practical insight each week on creating more returning guests, increasing
              revenue, and building better hospitality experiences.
            </p>

            <form className="cm-welcome-modal__form" noValidate onSubmit={handleSubmit}>
              <label className="cm-welcome-modal__field">
                <span>First Name</span>
                <input
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>

              <label className="cm-welcome-modal__field">
                <span>Email Address</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="cm-welcome-modal__field">
                <span>
                  Phone Number <em>(optional)</em>
                </span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>

              {error ? <p className="cm-welcome-modal__error">{error}</p> : null}

              <button type="submit" className="cm-welcome-modal__cta" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Get Weekly Insights'}
              </button>

              <p className="cm-welcome-modal__fine-print">No spam. Unsubscribe anytime.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChaosMasteryWelcomeModal;
