import React, { useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

function tierBadge(tier) {
  if (tier === 'TIER_1_HIGH') return <span className="badge b1">Tier 1 (High)</span>;
  if (tier === 'TIER_2_MEDIUM') return <span className="badge b2">Tier 2 (Medium)</span>;
  if (tier === 'TIER_3_LOW') return <span className="badge b3">Tier 3 (Low)</span>;
  return <span className="badge b3">—</span>;
}

export default function App() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    sms: ''
  });
  const [toast, setToast] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return form.first_name.trim() && form.last_name.trim() && (form.email.trim() || form.sms.trim());
  }, [form]);

  async function submitLead(e) {
    e.preventDefault();
    setToast('');
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/leads/intake`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || undefined,
          sms: form.sms.trim() || undefined
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setToast('Lead captured. Typeform link sent (email or SMS).');
      setForm({ first_name: '', last_name: '', email: '', sms: '' });
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadRecentLeads() {
    setToast('');
    setIsLoading(true);
    try {
      // Simple API-less view for now: this expects you to query Supabase from the API later if desired.
      // We keep UI minimal and focused on intake + verification.
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('API not reachable');
      setLeads([]);
      setToast('API is healthy. Lead list endpoint not added yet (optional).');
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <div className="mark" />
          <div className="title">
            <h1>Client Form Qualifier</h1>
            <p>Lead intake → Typeform → urgency tiering → sales alerts</p>
          </div>
        </div>
        <span className="pill">
          <span className="dot" />
          Blue/White UI
        </span>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Lead Intake (Test Form)</h2>
          <div className="muted">
            Submitting will store the lead in Supabase and send the Typeform link via Brevo (or SMS if no email).
          </div>

          <form onSubmit={submitLead}>
            <div className="row">
              <div>
                <label>First name</label>
                <input
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="First name"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label>Last name</label>
                <input
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="Last name"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <label>Email (preferred)</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="lead@example.com"
              autoComplete="email"
            />

            <label>SMS (optional)</label>
            <input
              value={form.sms}
              onChange={(e) => setForm((f) => ({ ...f, sms: e.target.value }))}
              placeholder="+14075551234"
              autoComplete="tel"
            />

            <div className="actions">
              <button className="btn btnPrimary" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Submit lead'}
              </button>
              <button
                type="button"
                className="btn btnGhost"
                onClick={() => setForm({ first_name: '', last_name: '', email: '', sms: '' })}
              >
                Reset
              </button>
            </div>
          </form>

          {toast ? <div className="toast">{toast}</div> : null}
        </div>

        <div className="card">
          <h2>Recent Leads (Optional)</h2>
          <div className="muted">
            This UI intentionally stays lightweight. If you want, we can add an API endpoint to fetch leads + latest tiers.
          </div>

          <div className="actions">
            <button className="btn btnPrimary" onClick={loadRecentLeads} disabled={isLoading}>
              {isLoading ? 'Checking…' : 'Check API'}
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="muted">
                      No rows (not wired yet).
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l.id}>
                      <td>{l.name}</td>
                      <td>{tierBadge(l.urgency_tier)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }} className="muted">
        API base: <code>{API_BASE}</code>
      </div>
    </div>
  );
}

