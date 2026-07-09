import React, { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { fetchCompanyMetrics } from './lib/dashboardData.js';

export default function HomeDashboard({ onOpenAgent }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error(
          'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in apps/api/.env (or the same keys in your host’s environment for production builds).'
        );
      }
      const metrics = await fetchCompanyMetrics(supabase);
      setData(metrics);
    } catch (e) {
      setError(e.message || 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tb = data?.tierBreakdown || {};

  return (
    <div className="shell healthShell">
      <div className="topbar">
        <div className="brand">
          <div className="mark" />
          <div className="title">
            <h1>Fletcher Insurance</h1>
            <p>Company dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btnPrimary" onClick={() => load()} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="btn btnGhost" onClick={onOpenAgent}>
            Agent
          </button>
        </div>
      </div>

      {error ? (
        <div className="toast" style={{ borderColor: 'rgba(200,60,60,.35)' }}>
          <strong>Could not load dashboard.</strong> {error}
        </div>
      ) : null}

      {loading && !data ? (
        <p className="muted">Loading metrics…</p>
      ) : null}

      {data ? (
        <div className="card healthCard">
          <h2>Company dashboard</h2>
          <div className="healthKpiRow" style={{ marginTop: 8 }}>
            <div className="healthKpi">
              <span className="healthKpiValue">{data.totalLeadsToday}</span>
              <span className="healthKpiLabel">Total leads today</span>
            </div>
            <div className="healthKpi">
              <span className="healthKpiValue">{data.conversionRatePercent}%</span>
              <span className="healthKpiLabel">Conversion rate</span>
            </div>
          </div>
          <h3 style={{ marginTop: 18, marginBottom: 8, fontSize: 15 }}>Tier breakdown</h3>
          <ul className="healthLegend" style={{ marginTop: 0 }}>
            <li>
              Tier 1: <strong>{tb.TIER_1_HIGH ?? 0}</strong>
            </li>
            <li>
              Tier 2: <strong>{tb.TIER_2_MEDIUM ?? 0}</strong>
            </li>
            <li>
              Tier 3: <strong>{tb.TIER_3_LOW ?? 0}</strong>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
