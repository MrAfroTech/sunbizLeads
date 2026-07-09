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

function Section4Networking({ formState, formStateWithConv, updateField, weekTotals, monthTotals, yearTotals }) {
  const [graphsCollapsed, setGraphsCollapsed] = useState(false);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const w = weekTotals ?? formState;
  const m = monthTotals ?? formState;
  const y = yearTotals ?? formState;
  const weekSteps = [
    { label: 'Contacts Made', value: n(w.s4Contacts) },
    { label: 'Follow-Ups Completed', value: n(w.s4Followups) },
    { label: 'Demos Booked', value: n(w.s4Demos) },
    { label: 'Sales', value: n(w.s4Sales) },
  ];
  const monthSteps = [
    { label: 'Contacts Made', value: n(m.s4Contacts) },
    { label: 'Follow-Ups Completed', value: n(m.s4Followups) },
    { label: 'Demos Booked', value: n(m.s4Demos) },
    { label: 'Sales', value: n(m.s4Sales) },
  ];
  const yearSteps = [
    { label: 'Contacts Made', value: n(y.s4Contacts) },
    { label: 'Follow-Ups Completed', value: n(y.s4Followups) },
    { label: 'Demos Booked', value: n(y.s4Demos) },
    { label: 'Sales', value: n(y.s4Sales) },
  ];

  return (
    <section style={{ marginBottom: 32, border: '1px solid var(--section-border)', padding: 16, borderRadius: 'var(--section-radius)', background: 'var(--section-bg)' }}>
      <h2 style={{ marginTop: 0 }}>Section 4: Networking Events (Weekly)</h2>
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
      <Field label="Week of">
        <input
          type="date"
          value={formState.s4Weekof}
          onChange={(e) => updateField('s4Weekof', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total events attended">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s4Events ?? '0'}
          onChange={(e) => updateField('s4Events', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total contacts made">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s4Contacts ?? '0'}
          onChange={(e) => updateField('s4Contacts', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total follow-ups completed">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s4Followups ?? '0'}
          onChange={(e) => updateField('s4Followups', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total demos booked">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s4Demos ?? '0'}
          onChange={(e) => updateField('s4Demos', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total sales closed">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s4Sales ?? '0'}
          onChange={(e) => updateField('s4Sales', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Conversion rate">
        <input
          type="text"
          value={formStateWithConv.s4Conv}
          readOnly
          style={{ width: '100%', maxWidth: 320, background: 'var(--readonly-bg)', borderColor: 'var(--readonly-border)', cursor: 'not-allowed' }}
        />
      </Field>
      <Field label="Rating 1–10: Overall networking effectiveness this week">
        <input
          type="number"
          min={1}
          max={10}
          step={1}
          value={formState.s4Rating ?? '0'}
          onChange={(e) => updateField('s4Rating', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Weekly notes/journal entry">
        <textarea
          value={formState.s4Journal}
          onChange={(e) => updateField('s4Journal', e.target.value)}
          style={{ width: '100%', maxWidth: 320, minHeight: 60, resize: 'vertical' }}
        />
      </Field>
        </div>
      )}
    </section>
  );
}

export default Section4Networking;
