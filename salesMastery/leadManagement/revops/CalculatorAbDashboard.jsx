import { useCallback, useEffect, useState } from 'react';
import supabase from './src/supabaseClient.js';
import './src/OrgFunnelDashboard.css';

const VARIANT_COLUMNS = [
  'ab_variant',
  'page_visits',
  'calculator_starts',
  'calculator_completions',
  'lead_submissions',
  'consultation_cta_clicks',
  'consultation_bookings',
  'avg_lead_score',
  'highest_lead_score',
  'leads_score_80_plus',
  'leads_score_50_79',
  'leads_score_30_49',
  'leads_score_under_30',
];

const SEGMENT_COLUMNS = [
  'visitors',
  'lead_submissions',
  'conversion_rate_pct',
  'consultation_bookings',
  'consultation_booking_rate_pct',
  'avg_lead_score',
];

function formatCell(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function DataTable({ columns, rows, labelColumn }) {
  if (!rows.length) {
    return <p className="empty-state">No data yet for {labelColumn}.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="revops-table">
        <thead>
          <tr>
            <th>{labelColumn}</th>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[labelColumn] ?? row.ab_variant ?? row.persona ?? row.ordering_method}>
              <td>{formatCell(row[labelColumn] ?? row.ab_variant ?? row.persona ?? row.ordering_method)}</td>
              {columns.map((col) => (
                <td key={col}>{formatCell(row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CalculatorAbDashboard() {
  const [variants, setVariants] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [ordering, setOrdering] = useState([]);
  const [scoreDist, setScoreDist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    if (!supabase) {
      setError('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      return;
    }

    setLoading(true);
    setError(null);

    const [variantRes, personaRes, orderingRes, scoreRes] = await Promise.all([
      supabase.from('calculator_ab_variant_report').select('*'),
      supabase.from('calculator_ab_persona_report').select('*'),
      supabase.from('calculator_ab_ordering_report').select('*'),
      supabase.from('calculator_ab_lead_score_by_variant').select('*'),
    ]);

    setLoading(false);

    const firstError =
      variantRes.error || personaRes.error || orderingRes.error || scoreRes.error;
    if (firstError) {
      setError(firstError.message);
      return;
    }

    setVariants(variantRes.data ?? []);
    setPersonas(personaRes.data ?? []);
    setOrdering(orderingRes.data ?? []);
    setScoreDist(scoreRes.data ?? []);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (!supabase) {
    return <p className="empty-state">Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY</p>;
  }

  const variantMetrics = VARIANT_COLUMNS.filter((col) => col !== 'ab_variant');

  return (
    <div className="revops-dashboard">
      <header className="revops-header">REVOPS / Calculator A/B + Lead Score</header>

      <div className="revops-toolbar">
        <button
          type="button"
          className="revops-btn-refresh"
          onClick={fetchReports}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error ? <p className="revops-error">{error}</p> : null}

      <section className="contacts-panel">
        <h2 className="contacts-domain-heading">Variant A vs Variant B</h2>
        <DataTable
          columns={variantMetrics}
          rows={variants}
          labelColumn="ab_variant"
        />
      </section>

      <section className="contacts-panel">
        <h2 className="contacts-domain-heading">By Persona</h2>
        <DataTable
          columns={SEGMENT_COLUMNS}
          rows={personas}
          labelColumn="persona"
        />
      </section>

      <section className="contacts-panel">
        <h2 className="contacts-domain-heading">By Ordering Method</h2>
        <DataTable
          columns={SEGMENT_COLUMNS}
          rows={ordering}
          labelColumn="ordering_method"
        />
      </section>

      <section className="contacts-panel">
        <h2 className="contacts-domain-heading">Lead Score Distribution by Variant</h2>
        <div className="table-wrap">
          <table className="revops-table">
            <thead>
              <tr>
                <th>ab_variant</th>
                <th>lead_score</th>
                <th>visit_count</th>
              </tr>
            </thead>
            <tbody>
              {scoreDist.map((row) => (
                <tr key={`${row.ab_variant}-${row.lead_score}`}>
                  <td>{formatCell(row.ab_variant)}</td>
                  <td>{formatCell(row.lead_score)}</td>
                  <td>{formatCell(row.visit_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!scoreDist.length ? <p className="empty-state">No scored visits yet.</p> : null}
      </section>
    </div>
  );
}
