import React, { useEffect, useState } from 'react';
import { parseContactFromSearchParams } from '../lib/journeyContactHelpers';
import {
  isContactCaptured,
  markContactCaptured,
  persistContactEmail,
} from '../lib/seamlesslyContactCapture';
import DownloadReveal from './DownloadReveal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useSportsCalculatorLeadModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    if (isContactCaptured()) return;
    setIsOpen(true);
  };

  const close = () => {
    markContactCaptured();
    setIsOpen(false);
  };

  return { isOpen, open, close };
}

const SportsCalculatorLeadModal = ({
  isOpen,
  onClose,
  onLeadSubmit,
  leadFromUrl = false,
  searchParams,
  resultsCopy = null,
  turnoverCopy = null,
  variant = 'sports',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  useEffect(() => {
    if (isOpen) return;
    setSubmitted(false);
    setSubmittedEmail('');
    setSubmittedName('');
    setSubmittedPhone('');
    setError('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!searchParams) return;
    const parsed = parseContactFromSearchParams(searchParams);
    if (parsed.fullName) setName(parsed.fullName);
    if (parsed.email) setEmail(parsed.email);
    if (parsed.phone) setPhone(parsed.phone);
  }, [searchParams]);

  const handleDismiss = () => {
    onClose();
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!trimmedPhone) {
      setError('Please enter your phone number.');
      return;
    }

    if (!onLeadSubmit) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSubmitting(true);

    const result = await onLeadSubmit({
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
    });

    setSubmitting(false);

    if (result && result.ok === false) {
      setError('Something went wrong. Please try again.');
      return;
    }

    persistContactEmail(trimmedEmail);
    markContactCaptured();
    setSubmittedEmail(trimmedEmail);
    setSubmittedName(trimmedName);
    setSubmittedPhone(trimmedPhone);
    setSubmitted(true);
  };

  const isWaitVariant = variant === 'wait';
  const showNameEmailFields = resultsCopy != null || turnoverCopy != null || !leadFromUrl;
  const submitLabel = turnoverCopy
    ? 'Send Me The Playbook'
    : resultsCopy
    ? isWaitVariant
      ? `Get The $17 road map that could recover ${resultsCopy.amount}`
      : `Get The $17 road map that could save you ${resultsCopy.amount}`
    : 'GET MY FREE REVENUE REVIEW';

  if (!isOpen) return null;

  return (
    <>
      <div
        className="sports-lead-modal-overlay"
        role="presentation"
        onClick={handleDismiss}
      >
        <div
          className="sports-lead-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sports-lead-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="sports-lead-modal-close"
            aria-label="Close"
            onClick={handleDismiss}
          >
            ×
          </button>
          <div className="sports-lead-modal-body">
            {submitted ? (
              <DownloadReveal
                email={submittedEmail}
                name={submittedName}
                phone={submittedPhone}
              />
            ) : (
              <>
            <h2 id="sports-lead-modal-title" className="sports-lead-modal-headline">
              {turnoverCopy ? (
                <>
                  Are you sure you want <strong>{turnoverCopy.totalAnnual}</strong> in losses to keep running?
                </>
              ) : resultsCopy && isWaitVariant ? (
                <>
                  Your venue is leaving <strong>{resultsCopy.amount}</strong> on the table —{' '}
                  <strong>{resultsCopy.missedRevenueThatNight}</strong> that peak night, plus{' '}
                  <strong>{resultsCopy.ltvLoss}</strong> in lost guest lifetime value.
                </>
              ) : resultsCopy ? (
                <>
                  Your venue is leaving <strong>{resultsCopy.amount}</strong> on the table. Every. Single.
                  Game.
                </>
              ) : (
                'Find Out Exactly How Much Revenue Your Venue Is Leaving On The Table'
              )}
            </h2>
            {turnoverCopy ? (
              <>
                <p className="sports-lead-modal-text">
                  That&apos;s <strong>{turnoverCopy.monthly}</strong> every month.{' '}
                  <strong>{turnoverCopy.employeesLost}</strong> employees walking out the door every year — taking
                  institutional knowledge, training investment, and team culture with them.
                </p>
                <p className="sports-lead-modal-text">
                  Drop your info. We&apos;ll send you the exact playbook for closing both gaps — concession revenue
                  and staff retention — in one deployment.
                </p>
              </>
            ) : resultsCopy && isWaitVariant ? (
              <>
                <p className="sports-lead-modal-text">
                  That&apos;s <strong>{resultsCopy.customersWhoWaited}</strong> guests who waited too long — and{' '}
                  <strong>{resultsCopy.customersWhoWontReturn}</strong> who likely won&apos;t come back.
                </p>
                <p className="sports-lead-modal-text">
                  We&apos;ll send you the exact roadmap to fix it — faster ordering, fewer walkaways, and guests
                  who keep coming back. Drop your info and we&apos;ll get it to you.
                </p>
              </>
            ) : resultsCopy ? (
              <>
                <p className="sports-lead-modal-text">
                  That&apos;s <strong>{resultsCopy.fans}</strong> fans who came ready to spend — and walked away
                  without ordering. At <strong>{resultsCopy.lostPerFan}</strong> per fan, per game.
                </p>
                <p className="sports-lead-modal-text">
                  We&apos;ll send you the exact roadmap to close that gap — zone by zone, game by game. Drop your
                  info and we&apos;ll get it to you.
                </p>
              </>
            ) : (
              <p className="sports-lead-modal-text">
                Takes 15 minutes. We&apos;ll show you where the leaks are and what to do about it — free.
              </p>
            )}
            <form className="sports-lead-modal-form" noValidate onSubmit={handleSubmit}>
              {showNameEmailFields ? (
                <label className="sports-lead-modal-field">
                  <span>{resultsCopy ? 'Full Name' : 'Name'}</span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              ) : null}
              {showNameEmailFields ? (
                <label className="sports-lead-modal-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              ) : null}
              <label className="sports-lead-modal-field sports-lead-modal-field--phone">
                <span>
                  Phone <span className="sports-lead-modal-required" aria-hidden="true">*</span>
                </span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <span className="sports-lead-modal-field-hint">
                  So we can reach you directly with your results
                </span>
              </label>
              {error ? <p className="sports-lead-modal-form-error">{error}</p> : null}
              <button type="submit" className="sports-lead-modal-cta" disabled={submitting}>
                {submitting
                  ? resultsCopy || turnoverCopy
                    ? 'Redirecting to checkout…'
                    : 'Submitting…'
                  : submitLabel}
              </button>
              {!resultsCopy && !turnoverCopy ? (
                <p className="sports-lead-modal-form-note">No obligation. No pitch. Just your numbers.</p>
              ) : null}
            </form>
            <button type="button" className="sports-lead-modal-opt-out" onClick={handleDismiss}>
              I&apos;ll figure it out myself
            </button>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .sports-lead-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .sports-lead-modal {
          background: #2E2210;
          border: 1px solid rgba(200, 164, 74, 0.25);
          border-radius: 12px;
          max-width: 480px;
          width: 100%;
          position: relative;
          padding: 36px 32px 24px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
          font-family: 'DM Sans', sans-serif;
        }
        .sports-lead-modal-close {
          position: absolute;
          top: 12px;
          right: 16px;
          background: none;
          border: none;
          color: rgba(245, 236, 215, 0.5);
          font-size: 24px;
          cursor: pointer;
          line-height: 1;
        }
        .sports-lead-modal-close:hover {
          color: #F5ECD7;
        }
        .sports-lead-modal-headline {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          color: #E8C97A;
          letter-spacing: 1px;
          line-height: 1.1;
          margin: 0 0 12px;
        }
        .sports-lead-modal-headline strong {
          color: #F5ECD7;
          font-weight: 700;
        }
        .sports-lead-modal-text strong {
          color: #E8C97A;
          font-weight: 700;
        }
        .sports-lead-modal-text {
          font-size: 16px;
          font-weight: 600;
          color: rgba(245, 236, 215, 0.9);
          line-height: 1.55;
          margin: 0 0 18px;
        }
        .sports-lead-modal-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 8px;
        }
        .sports-lead-modal-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sports-lead-modal-field > span:first-child {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #C8A44A;
        }
        .sports-lead-modal-required {
          color: #E05C3A;
          text-transform: none;
          letter-spacing: 0;
        }
        .sports-lead-modal-field-hint {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0;
          text-transform: none;
          color: #9A8060;
          line-height: 1.4;
        }
        .sports-lead-modal-field--phone {
          gap: 6px;
        }
        .sports-lead-modal-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border: 1px solid rgba(200, 164, 74, 0.25);
          border-radius: 10px;
          background: #212121;
          color: #F5ECD7;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
        }
        .sports-lead-modal-field input:focus {
          outline: none;
          border-color: #C8A44A;
        }
        .sports-lead-modal-form-error {
          font-size: 13px;
          font-weight: 600;
          color: #ff8a8a;
          margin: 0;
        }
        .sports-lead-modal-cta {
          display: block;
          width: 100%;
          background: linear-gradient(135deg, #C8A44A, #E8C97A);
          color: #1A1208;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 2px;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          margin-top: 4px;
        }
        .sports-lead-modal-cta:hover:not(:disabled) {
          opacity: 0.9;
        }
        .sports-lead-modal-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .sports-lead-modal-form-note {
          font-size: 12px;
          font-weight: 600;
          color: #9A8060;
          text-align: center;
          margin: 0;
          line-height: 1.45;
        }
        .sports-lead-modal-opt-out {
          display: block;
          width: 100%;
          background: none;
          border: none;
          color: #9A8060;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          text-align: center;
          padding: 8px;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .sports-lead-modal-opt-out:hover {
          color: rgba(154, 128, 96, 0.85);
        }
      `}</style>
    </>
  );
};

export default SportsCalculatorLeadModal;