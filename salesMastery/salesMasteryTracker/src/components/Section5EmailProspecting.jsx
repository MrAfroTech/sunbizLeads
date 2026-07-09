import { useState } from 'react';
import FunnelChart from './FunnelChart';

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'inline-block', minWidth: 220 }}>{label}</label>{' '}
      {children}
    </div>
  );
}

function n(v) {
  const x = Number(v);
  return Number.isNaN(x) ? 0 : x;
}

function Section5EmailProspecting({ formState, formStateWithConv, updateField, weekTotals, monthTotals, yearTotals }) {
  const [graphsCollapsed, setGraphsCollapsed] = useState(false);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const w = weekTotals ?? formState;
  const m = monthTotals ?? formState;
  const y = yearTotals ?? formState;
  const weekSteps = [
    { label: 'Emails Sent', value: n(w.s5Emails) },
    { label: 'Demos Booked', value: n(w.s5Demos) },
    { label: 'Sales', value: n(w.s5Sales) },
  ];
  const monthSteps = [
    { label: 'Emails Sent', value: n(m.s5Emails) },
    { label: 'Demos Booked', value: n(m.s5Demos) },
    { label: 'Sales', value: n(m.s5Sales) },
  ];
  const yearSteps = [
    { label: 'Emails Sent', value: n(y.s5Emails) },
    { label: 'Demos Booked', value: n(y.s5Demos) },
    { label: 'Sales', value: n(y.s5Sales) },
  ];

  return (
    <section style={{ marginBottom: 32, border: '1px solid var(--section-border)', padding: 16, borderRadius: 'var(--section-radius)', background: 'var(--section-bg)' }}>
      <h2 style={{ marginTop: 0 }}>Section 5: Email Prospecting</h2>
      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setGraphsCollapsed((c) => !c)}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-light)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--section-border)',
            borderRadius: 8,
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          {graphsCollapsed ? 'Graphs ▶' : 'Graphs ▼'}
        </button>
        <button
          type="button"
          onClick={() => setInputsCollapsed((c) => !c)}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-light)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--section-border)',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          {inputsCollapsed ? 'Inputs ▶' : 'Inputs ▼'}
        </button>
      </div>
      {!graphsCollapsed && (
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, marginTop: 16, width: '100%' }}>
        <FunnelChart label="Week" steps={weekSteps} />
        <FunnelChart label="Month" steps={monthSteps} />
        <FunnelChart label="Year" steps={yearSteps} />
      </div>
      )}
      {!inputsCollapsed && (
        <div style={{ marginTop: 16 }}>
      <Field label="Emails sent (outreach)">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s5Emails ?? '0'}
          onChange={(e) => updateField('s5Emails', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Positive replies / opened">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s5Replies ?? '0'}
          onChange={(e) => updateField('s5Replies', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Demos booked">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s5Demos ?? '0'}
          onChange={(e) => updateField('s5Demos', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Sales closed">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s5Sales ?? '0'}
          onChange={(e) => updateField('s5Sales', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Conversion rate">
        <input
          type="text"
          value={formStateWithConv.s5Conv}
          readOnly
          style={{ width: '100%', maxWidth: 320, background: 'var(--readonly-bg)', borderColor: 'var(--readonly-border)', cursor: 'not-allowed' }}
        />
      </Field>
      <Field label="Rating 1–10: How did email prospecting go?">
        <input
          type="number"
          min={1}
          max={10}
          step={1}
          value={formState.s5Rating ?? ''}
          onChange={(e) => updateField('s5Rating', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Journal (email prospecting)">
        <textarea
          value={formState.s5Journal ?? ''}
          onChange={(e) => updateField('s5Journal', e.target.value)}
          style={{ width: '100%', maxWidth: 320, minHeight: 60, resize: 'vertical' }}
        />
      </Field>
        </div>
      )}
    </section>
  );
}

export default Section5EmailProspecting;
