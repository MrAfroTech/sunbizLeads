import React, { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveLeadContext } from '../lib/revenueFitAttribution';
import { scheduleRevenueFitSession } from '../lib/scheduleRevenueFitSession';

const BULLETS = [
  'Review your calculator results',
  'Validate what\u2019s driving your numbers',
  'Identify where your operation may be losing revenue',
  'Assess whether there is a meaningful opportunity to improve performance',
  'Determine if this is the right fit for your business',
];

export default function DownloadReveal({ email, name, phone, pdfDownloadHref }) {
  const location = useLocation();
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = useCallback(async () => {
    if (scheduling) return;
    setScheduling(true);
    const lead = resolveLeadContext(
      new URLSearchParams(location.search),
      location.pathname,
      { email, name, phone },
    );
    await scheduleRevenueFitSession(lead);
  }, [scheduling, location.search, location.pathname, email, name, phone]);

  const displayEmail =
    email ||
    resolveLeadContext(
      new URLSearchParams(location.search),
      location.pathname,
      { email, name, phone },
    ).email;

  return (
    <div
      style={{
        background: '#F5F0E8',
        borderTop: '4px solid #D4AF37',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        textAlign: 'left',
        gap: '12px',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'rgba(26,42,68,0.45)',
          textAlign: 'center',
        }}
      >
        Qualification review
      </div>

      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '32px',
          color: '#1A2A44',
          letterSpacing: '1px',
          lineHeight: 1.05,
          textAlign: 'center',
        }}
      >
        REVENUE FIT SESSION
      </div>

      <p
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontStyle: 'italic',
          fontSize: '15px',
          color: '#444',
          lineHeight: 1.55,
          textAlign: 'center',
          margin: '0 0 4px',
        }}
      >
        Let&apos;s review your numbers and see if there&apos;s a real revenue opportunity worth
        acting on.
      </p>

      <p
        style={{
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'center',
          color: '#777',
          margin: '0 0 8px',
        }}
      >
        Not every operator is a fit for this.
      </p>

      <div style={{ fontSize: '14px', lineHeight: 1.65, color: '#333', marginBottom: '4px' }}>
        <p style={{ margin: '0 0 8px' }}>During this 30-minute session we&apos;ll:</p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {BULLETS.map((item) => (
            <li key={item} style={{ marginBottom: '6px' }}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {displayEmail ? (
        <p
          style={{
            fontSize: '12px',
            color: '#888',
            textAlign: 'center',
            margin: '4px 0 0',
          }}
        >
          Your guide is on its way to {displayEmail}
        </p>
      ) : null}

      {pdfDownloadHref ? (
        <p style={{ fontSize: '13px', textAlign: 'center', margin: '8px 0 0' }}>
          <a
            href={pdfDownloadHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1A2A44', fontWeight: 700, textDecoration: 'underline' }}
          >
            Download your PDF guide now
          </a>
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSchedule}
        disabled={scheduling}
        style={{
          display: 'block',
          width: '100%',
          marginTop: '12px',
          padding: '16px',
          border: 'none',
          borderRadius: '3px',
          background: '#D4AF37',
          color: '#1A2A44',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '18px',
          letterSpacing: '2px',
          cursor: scheduling ? 'wait' : 'pointer',
          opacity: scheduling ? 0.7 : 1,
        }}
      >
        {scheduling ? 'OPENING SCHEDULER…' : 'SCHEDULE REVENUE FIT SESSION →'}
      </button>
    </div>
  );
}
