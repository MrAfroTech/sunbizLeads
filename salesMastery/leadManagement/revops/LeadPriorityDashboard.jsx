import { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from './src/supabaseClient.js';
import {
  AM_STATUS_OPTIONS,
  downloadLeadPriorityCsv,
  fetchLeadPriority,
  updateLeadStatus,
} from './src/leadPriorityService.js';
import './src/OrgFunnelDashboard.css';

function displayOrDash(value) {
  if (value === null || value === undefined || String(value).trim() === '') return '—';
  return String(value);
}

function formatRelativeTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 48) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 14) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTitleCompany(title, company) {
  const parts = [title, company].filter((v) => v && String(v).trim());
  return parts.length ? parts.join(' · ') : '—';
}

export default function LeadPriorityDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clusterOnly, setClusterOnly] = useState(false);
  const [outreachOnly, setOutreachOnly] = useState(false);
  const [sortKey, setSortKey] = useState('priority_score');
  const [sortDir, setSortDir] = useState('desc');
  const [statusSaving, setStatusSaving] = useState({});
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeadPriority({ clusterOnly });
      setRows(data);
    } catch (err) {
      setError(err.message || 'Failed to load lead priority');
    } finally {
      setLoading(false);
    }
  }, [clusterOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const visibleRows = useMemo(() => {
    let list = rows;
    if (outreachOnly) {
      list = list.filter((row) => !row.suppress_individual_outreach);
    }
    return list;
  }, [rows, outreachOnly]);

  const sortedRows = useMemo(() => {
    const list = [...visibleRows];
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [visibleRows, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'domain' || key === 'email' || key === 'full_name' ? 'asc' : 'desc');
    }
  }

  async function handleStatusChange(email, nextStatus) {
    const prev = rows;
    setRows((current) =>
      current.map((row) => (row.email === email ? { ...row, status: nextStatus } : row)),
    );
    setStatusSaving((s) => ({ ...s, [email]: true }));
    try {
      await updateLeadStatus(email, nextStatus);
    } catch (err) {
      setRows(prev);
      setError(err.message || 'Failed to update status');
    } finally {
      setStatusSaving((s) => {
        const next = { ...s };
        delete next[email];
        return next;
      });
    }
  }

  function sortIndicator(key) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  async function handleDownloadCsv() {
    if (sortedRows.length === 0) return;
    setExporting(true);
    setError(null);
    try {
      await downloadLeadPriorityCsv(sortedRows);
    } catch (err) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="revops-dashboard">
      <div className="revops-header">Lead Priority</div>
      <div className="revops-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="button" className="revops-btn-refresh" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <button
          type="button"
          className="revops-btn-refresh"
          onClick={handleDownloadCsv}
          disabled={loading || exporting || sortedRows.length === 0}
        >
          {exporting ? 'Exporting…' : 'Download CSV'}
        </button>
        <label className="lead-priority-filter">
          <input
            type="checkbox"
            checked={clusterOnly}
            onChange={(e) => setClusterOnly(e.target.checked)}
          />
          Cluster signals only
        </label>
        <label className="lead-priority-filter">
          <input
            type="checkbox"
            checked={outreachOnly}
            onChange={(e) => setOutreachOnly(e.target.checked)}
          />
          Outreach targets only
        </label>
        <span className="lead-priority-meta">
          {sortedRows.length} lead{sortedRows.length === 1 ? '' : 's'}
        </span>
      </div>

      {error ? <div className="revops-error">{error}</div> : null}

      {loading && rows.length === 0 ? (
        <div className="empty-state">Loading lead priority…</div>
      ) : null}

      {!loading && sortedRows.length === 0 ? (
        <div className="empty-state">No leads match the current filter.</div>
      ) : null}

      {sortedRows.length > 0 ? (
        <div className="table-wrap">
          <table className="revops-table lead-priority-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('full_name')}>
                    Name{sortIndicator('full_name')}
                  </button>
                </th>
                <th>Title / Company</th>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('email')}>
                    Email{sortIndicator('email')}
                  </button>
                </th>
                <th>Phone</th>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('domain')}>
                    Domain{sortIndicator('domain')}
                  </button>
                </th>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('furthest_stage')}>
                    Furthest Stage{sortIndicator('furthest_stage')}
                  </button>
                </th>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('event_count_30d')}>
                    Frequency (30d){sortIndicator('event_count_30d')}
                  </button>
                </th>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('cluster_size')}>
                    Cluster (30d){sortIndicator('cluster_size')}
                  </button>
                </th>
                <th>Account POC</th>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('contacts_at_domain')}>
                    Contacts at Account{sortIndicator('contacts_at_domain')}
                  </button>
                </th>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('last_activity')}>
                    Last Activity{sortIndicator('last_activity')}
                  </button>
                </th>
                <th>
                  <button type="button" className="lead-priority-sort" onClick={() => toggleSort('priority_score')}>
                    Priority Score{sortIndicator('priority_score')}
                  </button>
                </th>
                <th>Status</th>
                <th>LinkedIn</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.email}>
                  <td>{displayOrDash(row.full_name) !== '—' ? row.full_name : row.email}</td>
                  <td>{formatTitleCompany(row.title, row.company_name)}</td>
                  <td>{row.email}</td>
                  <td>{displayOrDash(row.phone)}</td>
                  <td>{row.domain}</td>
                  <td>
                    <span className="lead-priority-stage">{row.furthest_stage_label}</span>
                    {row.is_cluster_signal ? (
                      <span className="lead-priority-cluster-badge" title="3+ contacts at this domain in 30 days">
                        CLUSTER
                      </span>
                    ) : null}
                    {row.suppress_individual_outreach ? (
                      <span className="lead-priority-suppress-badge" title="Route outreach to account POC only">
                        SUPPRESSED
                      </span>
                    ) : null}
                  </td>
                  <td>{row.event_count_30d}</td>
                  <td>{row.cluster_size ?? 0}</td>
                  <td>{displayOrDash(row.cluster_poc_email)}</td>
                  <td>{row.contacts_at_domain}</td>
                  <td>{formatRelativeTime(row.last_activity)}</td>
                  <td className="lead-priority-score">{row.priority_score}</td>
                  <td>
                    <select
                      className="lead-priority-status"
                      value={row.status || 'not_contacted'}
                      disabled={Boolean(statusSaving[row.email])}
                      onChange={(e) => handleStatusChange(row.email, e.target.value)}
                    >
                      {AM_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {row.linkedin_url ? (
                      <a
                        href={row.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lead-priority-linkedin"
                        aria-label="LinkedIn profile"
                      >
                        in
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
