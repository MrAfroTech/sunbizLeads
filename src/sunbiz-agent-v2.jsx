import React, { useState, useEffect } from 'react';

const NAVY = '#060c18';
const NAVY_MID = '#0b1524';
const NAVY_LIGHT = '#111f35';
const BORDER = '#1c2e4a';
const AMBER = '#f59e0b';
const TEAL = '#14b8a6';
const GREEN = '#10b981';
const SLATE = '#94a3b8';
const WHITE = '#ddeeff';

function nextRunText() {
  const d = new Date();
  const day = d.getDay();
  const hour = d.getHours();
  if (day >= 1 && day <= 5 && hour < 9) return 'Today 9:00 AM EST (FL)';
  if (day === 2 && hour < 9.5) return 'Today 9:30 AM EST (GA)';
  if (day === 3 && hour < 10) return 'Today 10:00 AM EST (AL)';
  if (day === 0 || day === 6) return 'Mon 9:00 AM EST (FL)';
  if (day === 1) return 'Tue 9:30 AM EST (GA)';
  if (day === 2) return 'Wed 10:00 AM EST (AL)';
  return 'Mon–Fri 9:00 AM EST';
}

export default function SunbizDualAgent() {
  const [leads, setLeads] = useState([]);
  const [lastRun, setLastRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterLayer, setFilterLayer] = useState('all');
  const [activeTab, setActiveTab] = useState('results');
  const [stateFilter, setStateFilter] = useState('FL');

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLeads(data.leads || []);
      setLastRun(data.lastRun || null);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setError(err.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    const filtered =
      filterLayer === 'all'
        ? leads
        : leads.filter((l) => l.layer === filterLayer);
    const headers = [
      'Layer',
      'Name',
      'Source',
      'County',
      'Type',
      'Filing Date',
      'Locations',
      'Score',
      'Tech Fit',
      'Status',
      'Contact',
    ];
    const rows = filtered.map((l) => [
      l.layer,
      l.name,
      l.source,
      l.county,
      l.type,
      l.filingDate || l.filed,
      l.locations,
      l.score,
      l.techFit,
      l.status,
      l.contact,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const estLeads = leads.filter((l) => l.layer === 'est');
  const newLeads = leads.filter((l) => l.layer === 'new');
  const filteredLeads =
    filterLayer === 'all'
      ? leads
      : leads.filter((l) => l.layer === filterLayer);

  const chainsStaged = estLeads.length;
  const hotChains = estLeads.filter((l) => (Number(l.score) || 0) >= 70).length;
  const avgScoreEst =
    estLeads.length > 0
      ? Math.round(
          estLeads.reduce((a, l) => a + (Number(l.score) || 0), 0) / estLeads.length
        )
      : 0;
  const newBizStaged = newLeads.length;
  const highGrowth = newLeads.filter((l) => (Number(l.score) || 0) >= 60).length;
  const avgScoreNew =
    newLeads.length > 0
      ? Math.round(
          newLeads.reduce((a, l) => a + (Number(l.score) || 0), 0) / newLeads.length
        )
      : 0;

  const estPct = leads.length ? Math.round((estLeads.length / leads.length) * 100) : 0;
  const newPct = leads.length ? Math.round((newLeads.length / leads.length) * 100) : 0;

  return (
    <div className="sunbiz-agent">
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Syne:wght@800&display=swap"
        rel="stylesheet"
      />
      <header className="header">
        <div className="header-top">
          <h1 className="title">
            <span className="title-amber">LEADOPS</span>
            <span className="title-slash"> / </span>
            <span className="title-teal">Dual</span>
          </h1>
          <div className="badges">
            <span className="badge badge-amber">Sunbiz Agent</span>
            <span className="badge badge-teal">
              Dual-Layer v2 <span className="pulse-dot" />
            </span>
          </div>
          <div className="state-tabs">
            {['FL', 'GA', 'AL'].map((s) => (
              <button
                key={s}
                className={`state-tab ${stateFilter === s ? 'active' : ''}`}
                onClick={() => setStateFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <p className="subtitle">
          FL Sunbiz · GA SoS · AL SoS · Hospitality SaaS Pipeline
        </p>
      </header>

      <div className="layer-toggle">
        <button
          className={`layer-panel layer-est ${filterLayer === 'est' ? 'active' : ''}`}
          onClick={() => setFilterLayer('est')}
        >
          <span className="layer-icon">🏢</span>
          <span className="layer-title">Established Chains</span>
          <span className="layer-desc">3+ locations · 2020+ filings · direct close</span>
          <span className="layer-pct" style={{ color: AMBER }}>{estPct}%</span>
        </button>
        <button
          className={`layer-panel layer-new ${filterLayer === 'new' ? 'active' : ''}`}
          onClick={() => setFilterLayer('new')}
        >
          <span className="layer-icon">🌱</span>
          <span className="layer-title">New Businesses</span>
          <span className="layer-desc">Filed 2025+ · early-stage · stack-first pitch</span>
          <span className="layer-pct" style={{ color: TEAL }}>{newPct}%</span>
        </button>
      </div>

      <div className="status-bar">
        <span className="status-item">
          Last run: <strong>{lastRun || '—'}</strong>
        </span>
        <span className="status-item">
          Next run: <strong>{nextRunText()}</strong>
        </span>
        <span className="status-item status-gh">
          <span className="pulse-dot amber" /> GitHub Actions
        </span>
        <button className="export-btn" onClick={exportCSV}>
          ↓ Export CSV
        </button>
      </div>

      {loading && (
        <div className="loading">Loading leads…</div>
      )}
      {error && (
        <div className="error-panel">{error}</div>
      )}

      {!loading && !error && leads.length > 0 && (
        <div className="stats-grid">
          <div className="stats-col stats-amber">
            <div className="stat-label">Chains Staged</div>
            <div className="stat-value">{chainsStaged}</div>
            <div className="stat-label">Hot Chains</div>
            <div className="stat-value">{hotChains}</div>
            <div className="stat-label">Avg Score (Est)</div>
            <div className="stat-value">{avgScoreEst}</div>
          </div>
          <div className="stats-col stats-teal">
            <div className="stat-label">New Biz Staged</div>
            <div className="stat-value">{newBizStaged}</div>
            <div className="stat-label">High Growth</div>
            <div className="stat-value">{highGrowth}</div>
            <div className="stat-label">Avg Score (New)</div>
            <div className="stat-value">{avgScoreNew}</div>
          </div>
        </div>
      )}

      <nav className="tab-nav">
        <button
          className={activeTab === 'results' ? 'active' : ''}
          onClick={() => setActiveTab('results')}
        >
          📋 Results
        </button>
        <button
          className={activeTab === 'schedule' ? 'active' : ''}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Schedule
        </button>
        <button
          className={activeTab === 'outreach' ? 'active' : ''}
          onClick={() => setActiveTab('outreach')}
        >
          ✉ Outreach
        </button>
      </nav>

      {activeTab === 'results' && (
        <div className="results-panel">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Name</th>
                <th>Source</th>
                <th>County</th>
                <th>Type</th>
                <th>Filed</th>
                <th>Loc</th>
                <th>Score</th>
                <th>Tech Fit</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Outreach</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((l, i) => (
                <tr key={i}>
                  <td>
                    <span
                      className={`layer-pill ${l.layer === 'est' ? 'est' : 'new'}`}
                    >
                      {l.layer === 'est' ? 'EST' : 'NEW'}
                    </span>
                  </td>
                  <td className="name-cell">{l.name}</td>
                  <td><span className="source-badge">{l.source}</span></td>
                  <td>{l.county}</td>
                  <td>{l.type}</td>
                  <td>{l.filingDate || l.filed}</td>
                  <td>{l.locations}</td>
                  <td>
                    <div className="score-bar-wrap">
                      <div
                        className={`score-bar ${l.layer === 'est' ? 'amber' : 'teal'}`}
                        style={{
                          width: `${Math.min(100, Number(l.score) || 0)}%`,
                        }}
                      />
                      <span className="score-num">{l.score}</span>
                    </div>
                  </td>
                  <td><span className="tech-badge">{l.techFit || '—'}</span></td>
                  <td><span className="status-pill">{l.status}</span></td>
                  <td className="contact-cell">{l.contact || '—'}</td>
                  <td>{l.outreachStatus || 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="schedule-panel">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time (EST)</th>
                <th>Layer 1</th>
                <th>Layer 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mon–Fri</td>
                <td>9:00 AM</td>
                <td>FL Established</td>
                <td>FL New Biz</td>
              </tr>
              <tr>
                <td>Tue</td>
                <td>9:30 AM</td>
                <td>GA Established</td>
                <td>GA New Biz</td>
              </tr>
              <tr>
                <td>Wed</td>
                <td>10:00 AM</td>
                <td>AL Established</td>
                <td>AL New Biz</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'outreach' && (
        <div className="outreach-panel">
          <div className="template-block">
            <h4 style={{ color: AMBER }}>Established chain</h4>
            <pre className="template-text">
{`Hi [Name] — We help multi-location operators like [Company] consolidate POS and back-office. Would a 15-min call this week make sense? We're seeing strong fit with 3+ unit groups in [State].`}
            </pre>
          </div>
          <div className="template-block">
            <h4 style={{ color: TEAL }}>New business</h4>
            <pre className="template-text">
{`Hi [Name] — Congrats on the recent launch. We work with new concepts to get on the right stack from day one (POS + inventory + reporting). Happy to show you what we do in a quick call.`}
            </pre>
          </div>
          <div className="template-block">
            <h4 style={{ color: GREEN }}>Speaker bonus</h4>
            <pre className="template-text">
{`If you're speaking at or attending [Event], we can fast-track a demo and extend a speaker/attendee rate.`}
            </pre>
          </div>
        </div>
      )}

      <footer className="footer">
        <span className="pulse-dot amber" /> Est
        <span className="pulse-dot teal" style={{ marginLeft: '1rem' }} /> New
        <span className="footer-text">
          Sunbiz Dual-Layer Agent v2.0 · GitHub Actions · Automated
        </span>
      </footer>

      <style>{`
        .sunbiz-agent {
          font-family: 'JetBrains Mono', monospace;
          background: ${NAVY};
          color: ${WHITE};
          min-height: 100vh;
          padding: 1.5rem;
          max-width: 1280px;
          margin: 0 auto;
        }
        .header { margin-bottom: 1.5rem; }
        .header-top { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.5rem; }
        .title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2rem; margin: 0; letter-spacing: 0.02em; }
        .title-amber { color: ${AMBER}; }
        .title-slash { color: ${SLATE}; }
        .title-teal { color: ${TEAL}; }
        .badges { display: flex; gap: 0.5rem; }
        .badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; }
        .badge-amber { background: ${AMBER}; color: ${NAVY}; }
        .badge-teal { background: ${TEAL}; color: ${NAVY}; }
        .state-tabs { margin-left: auto; display: flex; gap: 0.25rem; }
        .state-tab { background: ${NAVY_LIGHT}; border: 1px solid ${BORDER}; color: ${SLATE}; padding: 0.35rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .state-tab.active { color: ${AMBER}; border-color: ${AMBER}; }
        .subtitle { margin: 0; font-size: 0.8rem; color: ${SLATE}; }

        .layer-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .layer-panel { background: ${NAVY_MID}; border: 1px solid ${BORDER}; border-radius: 8px; padding: 1rem; text-align: left; cursor: pointer; transition: border-color 0.2s; }
        .layer-panel:hover { border-color: ${SLATE}; }
        .layer-panel.active.layer-est { border-color: ${AMBER}; }
        .layer-panel.active.layer-new { border-color: ${TEAL}; }
        .layer-icon { font-size: 1.25rem; }
        .layer-title { display: block; font-weight: 600; margin-top: 0.25rem; }
        .layer-desc { display: block; font-size: 0.8rem; color: ${SLATE}; margin-top: 0.25rem; }
        .layer-pct { display: block; font-size: 1.25rem; margin-top: 0.5rem; font-weight: 700; }

        .status-bar { background: ${NAVY_MID}; border: 1px solid ${BORDER}; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; flex-wrap: wrap; gap: 1.5rem; }
        .status-item { font-size: 0.85rem; color: ${SLATE}; }
        .status-item strong { color: ${WHITE}; }
        .status-gh { color: ${AMBER}; }
        .export-btn { margin-left: auto; background: ${GREEN}; color: ${NAVY}; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }

        .pulse-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${TEAL}; animation: pulse 1.5s ease-in-out infinite; margin-left: 4px; vertical-align: middle; }
        .pulse-dot.amber { background: ${AMBER}; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        .loading { padding: 2rem; color: ${SLATE}; }
        .error-panel { padding: 1rem; background: rgba(220,38,38,0.15); border: 1px solid #dc2626; color: #fca5a5; border-radius: 6px; margin-bottom: 1rem; }

        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .stats-col { border: 1px solid ${BORDER}; border-radius: 8px; padding: 1rem; }
        .stats-amber { border-left: 3px solid ${AMBER}; }
        .stats-teal { border-left: 3px solid ${TEAL}; }
        .stat-label { font-size: 0.75rem; color: ${SLATE}; margin-top: 0.5rem; }
        .stat-label:first-child { margin-top: 0; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }

        .tab-nav { margin-bottom: 1rem; display: flex; gap: 0.25rem; }
        .tab-nav button { background: ${NAVY_MID}; border: 1px solid ${BORDER}; color: ${SLATE}; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
        .tab-nav button.active { color: ${WHITE}; border-color: ${SLATE}; }

        .results-panel { background: ${NAVY_MID}; border: 1px solid ${BORDER}; border-radius: 8px; overflow-x: auto; }
        .leads-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .leads-table th, .leads-table td { border-bottom: 1px solid ${BORDER}; padding: 0.5rem 0.6rem; text-align: left; }
        .leads-table th { background: ${NAVY_LIGHT}; color: ${SLATE}; font-weight: 500; }
        .layer-pill { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
        .layer-pill.est { background: ${AMBER}; color: ${NAVY}; }
        .layer-pill.new { background: ${TEAL}; color: ${NAVY}; }
        .source-badge { font-size: 0.7rem; padding: 0.15rem 0.4rem; background: ${NAVY_LIGHT}; border-radius: 3px; color: ${SLATE}; }
        .score-bar-wrap { position: relative; min-width: 48px; }
        .score-bar { height: 6px; border-radius: 3px; min-width: 2px; }
        .score-bar.amber { background: ${AMBER}; }
        .score-bar.teal { background: ${TEAL}; }
        .score-num { position: absolute; right: 0; top: -2px; font-size: 0.7rem; color: ${SLATE}; }
        .tech-badge { font-size: 0.7rem; color: ${SLATE}; }
        .status-pill { font-size: 0.7rem; padding: 0.15rem 0.4rem; background: ${NAVY_LIGHT}; border-radius: 3px; }
        .name-cell { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .contact-cell { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .schedule-panel { background: ${NAVY_MID}; border: 1px solid ${BORDER}; border-radius: 8px; padding: 1rem; }
        .schedule-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .schedule-table th, .schedule-table td { border-bottom: 1px solid ${BORDER}; padding: 0.5rem; text-align: left; }
        .schedule-table th { color: ${SLATE}; }

        .outreach-panel { background: ${NAVY_MID}; border: 1px solid ${BORDER}; border-radius: 8px; padding: 1rem; }
        .template-block { margin-bottom: 1.5rem; }
        .template-block h4 { margin: 0 0 0.5rem 0; font-size: 0.9rem; }
        .template-text { background: ${NAVY}; border: 1px solid ${BORDER}; border-radius: 4px; padding: 1rem; font-size: 0.8rem; color: ${SLATE}; white-space: pre-wrap; margin: 0; overflow-x: auto; }

        .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid ${BORDER}; font-size: 0.8rem; color: ${SLATE}; }
        .footer-text { margin-left: 1rem; }
      `}</style>
    </div>
  );
}
