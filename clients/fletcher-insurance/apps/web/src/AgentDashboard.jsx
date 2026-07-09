import React, { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { fetchAgentRows } from './lib/dashboardData.js';
import { formatLeadName } from './lib/formatLeadName.js';

function categoryDisplay(category) {
  if (category === 'Hot' || category === 'Warm') return category;
  return 'Other';
}

function tierDisplay(tier) {
  if (tier === 'TIER_1_HIGH') return 'Tier 1';
  if (tier === 'TIER_2_MEDIUM') return 'Tier 2';
  if (tier === 'TIER_3_LOW') return 'Tier 3';
  return '—';
}

export default function AgentDashboard({ onBack }) {
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error(
          'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in apps/api/.env (or the same keys in your host’s environment for production builds).'
        );
      }
      const rows = await fetchAgentRows(supabase);
      setLeads(rows);
    } catch (e) {
      setError(e.message || 'Failed to load');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  if (loading && leads.length === 0 && !error) {
    return (
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <div className="mark" />
            <div className="title">
              <h1>Agent</h1>
              <p>Loading…</p>
            </div>
          </div>
          <button type="button" className="btn btnGhost" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell agentShell">
      <div className="topbar">
        <div className="brand">
          <div className="mark" />
          <div className="title">
            <h1>Agent</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btnPrimary" onClick={() => fetchLeads()} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="btn btnGhost" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>

      {error ? (
        <div className="toast" style={{ borderColor: 'rgba(200,60,60,.35)' }}>
          {error}
        </div>
      ) : null}

      <div className="card">
        <div style={{ marginTop: 4, overflowX: 'auto' }}>
          <table className="agentLeadsTable">
            <thead>
              <tr>
                <th>Lead name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Urgency tier</th>
                <th>Lead category</th>
                <th>Follow-up score</th>
                <th>Date submitted</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No leads yet.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{formatLeadName(l)}</strong>
                    </td>
                    <td>
                      {l.email ? (
                        <a href={`mailto:${l.email}`}>{l.email}</a>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{l.phone ? <span>{l.phone}</span> : <span className="muted">—</span>}</td>
                    <td>{tierDisplay(l.urgency_tier)}</td>
                    <td>{categoryDisplay(l.lead_category)}</td>
                    <td>{l.lead_score != null ? l.lead_score : '—'}</td>
                    <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {l.date_submitted ? new Date(l.date_submitted).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
