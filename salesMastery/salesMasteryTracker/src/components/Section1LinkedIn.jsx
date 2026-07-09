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

function formatDollar(v) {
  const x = Number(v);
  if (Number.isNaN(x)) return '$0.00';
  return '$' + Number(x).toFixed(2);
}

function Section1LinkedIn({ formState, formStateWithConv, updateField, weekTotals, monthTotals, yearTotals }) {
  const [graphsCollapsed, setGraphsCollapsed] = useState(false);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const w = weekTotals ?? formState;
  const m = monthTotals ?? formState;
  const y = yearTotals ?? formState;
  const weekSteps = [
    { label: 'Requests Sent', value: n(w.s1Requests) },
    { label: 'Accepted', value: n(w.s1Accepted) },
    { label: 'Messages Sent', value: n(w.s1Responses) },
    { label: 'Responses / Contact Info', value: n(w.s1Responses) + n(w.s1Contact) },
    { label: 'Demos Booked', value: n(w.s1Demos) },
    { label: 'Sales', value: n(w.s1Sales) },
  ];
  const monthSteps = [
    { label: 'Requests Sent', value: n(m.s1Requests) },
    { label: 'Accepted', value: n(m.s1Accepted) },
    { label: 'Messages Sent', value: n(m.s1Responses) },
    { label: 'Responses / Contact Info', value: n(m.s1Responses) + n(m.s1Contact) },
    { label: 'Demos Booked', value: n(m.s1Demos) },
    { label: 'Sales', value: n(m.s1Sales) },
  ];
  const yearSteps = [
    { label: 'Requests Sent', value: n(y.s1Requests) },
    { label: 'Accepted', value: n(y.s1Accepted) },
    { label: 'Messages Sent', value: n(y.s1Responses) },
    { label: 'Responses / Contact Info', value: n(y.s1Responses) + n(y.s1Contact) },
    { label: 'Demos Booked', value: n(y.s1Demos) },
    { label: 'Sales', value: n(y.s1Sales) },
  ];

  const revenue = n(formState.s1Revenue);
  const requests = n(formState.s1Requests);
  const demos = n(formState.s1Demos);
  const messagesTotal = n(formState.s1Responses) + n(formState.s1FollowUpMessages);
  const dollarPerConnection = requests > 0 ? revenue / requests : 0;
  const dollarPerDemo = demos > 0 ? revenue / demos : 0;
  const dollarPerMessage = messagesTotal > 0 ? revenue / messagesTotal : 0;

  const adjustDate = (delta) => {
    const current = formState.s1Date;
    if (!current) return;
    const d = new Date(current + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    updateField('s1Date', `${y}-${m}-${day}`);
  };

  return (
    <section style={{ marginBottom: 32, border: '1px solid var(--section-border)', padding: 16, borderRadius: 'var(--section-radius)', background: 'var(--section-bg)' }}>
      <h2 style={{ marginTop: 0 }}>Section 1: Daily Prospecting Metrics (LinkedIn)</h2>
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
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-light)' }}>
          Revenue per connection requests sent: {formatDollar(dollarPerConnection)} &nbsp;|&nbsp;
          Revenue per demo: {formatDollar(dollarPerDemo)} &nbsp;|&nbsp;
          Revenue per message sent: {formatDollar(dollarPerMessage)}
        </div>
      </div>
      {!inputsCollapsed && (
        <div style={{ marginTop: 16 }}>
          <Field label="Date">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => adjustDate(-1)}
                style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}
              >
                ▼
              </button>
              <input
                type="date"
                value={formState.s1Date}
                onChange={(e) => updateField('s1Date', e.target.value)}
                style={{ width: '100%', maxWidth: 200 }}
              />
              <button
                type="button"
                aria-label="Next day"
                onClick={() => adjustDate(1)}
                style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}
              >
                ▲
              </button>
            </span>
          </Field>
          <Field label="Total LinkedIn connection requests sent">
            <input
              type="number"
              min={0}
              step={1}
              value={formState.s1Requests ?? '0'}
              onChange={(e) => updateField('s1Requests', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Total connection requests accepted">
            <input
              type="number"
              min={0}
              step={1}
              value={formState.s1Accepted ?? '0'}
              onChange={(e) => updateField('s1Accepted', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Total responses received">
            <input
              type="number"
              min={0}
              step={1}
              value={formState.s1Responses ?? '0'}
              onChange={(e) => updateField('s1Responses', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Follow-up messages sent">
            <input
              type="number"
              min={0}
              step={1}
              value={formState.s1FollowUpMessages ?? '0'}
              onChange={(e) => updateField('s1FollowUpMessages', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Total contact info gathered">
            <input
              type="number"
              min={0}
              step={1}
              value={formState.s1Contact ?? '0'}
              onChange={(e) => updateField('s1Contact', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Total demos booked">
            <input
              type="number"
              min={0}
              step={1}
              value={formState.s1Demos ?? '0'}
              onChange={(e) => updateField('s1Demos', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Total sales closed">
            <input
              type="number"
              min={0}
              step={1}
              value={formState.s1Sales ?? '0'}
              onChange={(e) => updateField('s1Sales', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Revenue for the day">
            <input
              type="number"
              min={0}
              step={0.01}
              value={formState.s1Revenue ?? '0'}
              onChange={(e) => updateField('s1Revenue', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Conversion rate">
            <input
              type="text"
              value={formStateWithConv.s1Conv}
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
              value={formState.s1Rating ?? '0'}
              onChange={(e) => updateField('s1Rating', e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            />
          </Field>
          <Field label="Daily journal entry">
            <textarea
              value={formState.s1Journal}
              onChange={(e) => updateField('s1Journal', e.target.value)}
              style={{ width: '100%', maxWidth: 320, minHeight: 60, resize: 'vertical' }}
            />
          </Field>
        </div>
      )}
    </section>
  );
}

export default Section1LinkedIn;
