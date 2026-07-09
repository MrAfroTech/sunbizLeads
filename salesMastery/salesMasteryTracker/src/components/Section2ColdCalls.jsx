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

function Section2ColdCalls({ formState, formStateWithConv, updateField, weekTotals, monthTotals, yearTotals }) {
  const [graphsCollapsed, setGraphsCollapsed] = useState(false);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const w = weekTotals ?? formState;
  const m = monthTotals ?? formState;
  const y = yearTotals ?? formState;
  const weekSteps = [
    { label: 'Calls Made', value: n(w.s2Calls) },
    { label: 'Demos Booked', value: n(w.s2Demos) },
    { label: 'Sales', value: n(w.s2Sales) },
  ];
  const monthSteps = [
    { label: 'Calls Made', value: n(m.s2Calls) },
    { label: 'Demos Booked', value: n(m.s2Demos) },
    { label: 'Sales', value: n(m.s2Sales) },
  ];
  const yearSteps = [
    { label: 'Calls Made', value: n(y.s2Calls) },
    { label: 'Demos Booked', value: n(y.s2Demos) },
    { label: 'Sales', value: n(y.s2Sales) },
  ];

  return (
    <section style={{ marginBottom: 32, border: '1px solid var(--section-border)', padding: 16, borderRadius: 'var(--section-radius)', background: 'var(--section-bg)' }}>
      <h2 style={{ marginTop: 0 }}>Section 2: Cold Calls (Daily)</h2>
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
      <Field label="Total calls made">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s2Calls ?? '0'}
          onChange={(e) => updateField('s2Calls', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total positive responses">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s2Positive ?? '0'}
          onChange={(e) => updateField('s2Positive', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total demos booked">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s2Demos ?? '0'}
          onChange={(e) => updateField('s2Demos', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Total sales closed">
        <input
          type="number"
          min={0}
          step={1}
          value={formState.s2Sales ?? '0'}
          onChange={(e) => updateField('s2Sales', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Conversion rate">
        <input
          type="text"
          value={formStateWithConv.s2Conv}
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
          value={formState.s2Rating}
          onChange={(e) => updateField('s2Rating', e.target.value)}
          style={{ width: '100%', maxWidth: 320 }}
        />
      </Field>
      <Field label="Daily journal entry">
        <textarea
          value={formState.s2Journal}
          onChange={(e) => updateField('s2Journal', e.target.value)}
          style={{ width: '100%', maxWidth: 320, minHeight: 60, resize: 'vertical' }}
        />
      </Field>
        </div>
      )}
    </section>
  );
}

export default Section2ColdCalls;
