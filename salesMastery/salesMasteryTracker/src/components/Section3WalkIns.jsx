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

function Section3WalkIns({ formState, formStateWithConv, updateField, weekTotals, monthTotals, yearTotals }) {
  const [graphsCollapsed, setGraphsCollapsed] = useState(false);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const w = weekTotals ?? formState;
  const m = monthTotals ?? formState;
  const y = yearTotals ?? formState;
  const weekSteps = [
    { label: 'Walk-Ins Attempted', value: n(w.s3Walkins) },
    { label: 'Demos Booked', value: n(w.s3Demos) },
    { label: 'Sales', value: n(w.s3Sales) },
  ];
  const monthSteps = [
    { label: 'Walk-Ins Attempted', value: n(m.s3Walkins) },
    { label: 'Demos Booked', value: n(m.s3Demos) },
    { label: 'Sales', value: n(m.s3Sales) },
  ];
  const yearSteps = [
    { label: 'Walk-Ins Attempted', value: n(y.s3Walkins) },
    { label: 'Demos Booked', value: n(y.s3Demos) },
    { label: 'Sales', value: n(y.s3Sales) },
  ];

  return (
    <section style={{ marginBottom: 32, border: '1px solid var(--section-border)', padding: 16, borderRadius: 'var(--section-radius)', background: 'var(--section-bg)' }}>
      <h2 style={{ marginTop: 0 }}>Section 3: Walk-Ins (Daily)</h2>
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
      <Field label="Total walk-ins attempted">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s3Walkins ?? '0'}
          onChange={(e) => updateField('s3Walkins', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total contact info gathered">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s3Contact ?? '0'}
          onChange={(e) => updateField('s3Contact', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total demos booked">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s3Demos ?? '0'}
          onChange={(e) => updateField('s3Demos', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total sales closed">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s3Sales ?? '0'}
          onChange={(e) => updateField('s3Sales', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Conversion rate">
        <input
          type="text"
          value={formStateWithConv.s3Conv}
          readOnly
          style={{ width: '100%', maxWidth: 320, background: 'var(--readonly-bg)', borderColor: 'var(--readonly-border)', cursor: 'not-allowed' }}
        />
      </Field>
      <Field label="Rating 1–10: How did we feel today?">
        <input
          type="number"
          min={1}
          max={10}
          step={1}
          value={formState.s3Rating}
          onChange={(e) => updateField('s3Rating', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Daily journal entry">
        <textarea
          value={formState.s3Journal}
          onChange={(e) => updateField('s3Journal', e.target.value)}
          style={{ width: '100%', maxWidth: 320, minHeight: 60, resize: 'vertical' }}
        />
      </Field>
        </div>
      )}
    </section>
  );
}

export default Section3WalkIns;
