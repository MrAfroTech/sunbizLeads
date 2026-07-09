import { useCallback, useEffect, useState } from 'react';
import supabase from './src/supabaseClient.js';
import './src/OrgFunnelDashboard.css';

const TIER_ORDER = { HOT: 0, WARM: 1, COLD: 2 };

const BADGE_STYLES = {
  HOT: { background: '#D4AF37', color: '#0d1117' },
  WARM: { background: '#00D4AA', color: '#0d1117' },
  COLD: { background: '#484f58', color: '#0d1117' },
};

const ORIGIN_LABEL = {
  finished: { label: 'NEW', color: '#D4AF37' },
  call_task: { label: 'TASK', color: '#00D4AA' },
  journey: { label: 'OLD', color: 'rgba(255,255,255,0.3)' },
};

function formatCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatCell(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSource(source) {
  if (!source) return 'Calculator';
  return source
    .replace(/_/g, ' ')
    .replace(/calculator/gi, 'Calc')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isExcludedEmail(email, { includeUser = false } = {}) {
  if (!email) return true;
  const lower = email.toLowerCase();
  return (
    lower.includes('test') ||
    lower.includes('seamlessly') ||
    lower === 'maurice@mauricethefirst.com' ||
    (includeUser && lower.includes('user'))
  );
}

function buildAbandonedList(pageVisitors, abandonedLeads, finishedEmails) {
  const seen = new Set(finishedEmails);
  const list = [];

  for (const lead of abandonedLeads || []) {
    if (!lead.email || isExcludedEmail(lead.email, { includeUser: true }) || seen.has(lead.email)) {
      continue;
    }
    seen.add(lead.email);
    list.push({
      email: lead.email,
      name: '—',
      phone: null,
      source: lead.lead_source,
      event_count: lead.event_count,
      last_seen: lead.last_event_at || lead.created_at,
      origin: 'abandoned_tracked',
    });
  }

  for (const visit of pageVisitors || []) {
    if (!visit.email || isExcludedEmail(visit.email, { includeUser: true }) || seen.has(visit.email)) {
      continue;
    }
    seen.add(visit.email);
    list.push({
      email: visit.email,
      name: visit.name || '—',
      phone: visit.phone || null,
      source: visit.page_key,
      event_count: 1,
      last_seen: visit.created_at,
      origin: 'page_visit',
    });
  }

  return list.sort((a, b) => {
    const countDiff = (b.event_count || 0) - (a.event_count || 0);
    if (countDiff !== 0) return countDiff;
    return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
  });
}

function buildUnifiedList(newLeads, taskLeads, journeyLeads) {
  const seen = new Set();
  const list = [];

  for (const lead of newLeads || []) {
    if (isExcludedEmail(lead.email) || seen.has(lead.email)) continue;
    seen.add(lead.email);
    list.push({
      email: lead.email,
      name: lead.name || '—',
      phone: lead.phone || null,
      source: lead.lead_source,
      intent_tier: lead.intent_tier || 'COLD',
      intent_score: lead.intent_score || 0,
      submitted: lead.created_at,
      origin: 'finished',
    });
  }

  for (const task of taskLeads || []) {
    const email = task.email;
    if (isExcludedEmail(email) || seen.has(email)) continue;
    seen.add(email);
    list.push({
      email,
      name: task.name || '—',
      phone: task.phone || null,
      source: task.lead_source,
      intent_tier: task.intent_tier || 'COLD',
      intent_score: task.intent_score || 0,
      submitted: task.submitted_at,
      origin: 'call_task',
    });
  }

  for (const journey of journeyLeads || []) {
    if (isExcludedEmail(journey.email) || seen.has(journey.email)) continue;
    seen.add(journey.email);
    list.push({
      email: journey.email,
      name: journey.full_name || '—',
      phone: journey.phone || null,
      source: journey.persona || 'calculator',
      intent_tier: 'COLD',
      intent_score: 0,
      submitted: journey.created_at,
      origin: 'journey',
    });
  }

  return list.sort((a, b) => {
    const tierDiff =
      (TIER_ORDER[a.intent_tier] ?? 2) - (TIER_ORDER[b.intent_tier] ?? 2);
    if (tierDiff !== 0) return tierDiff;
    return new Date(b.submitted).getTime() - new Date(a.submitted).getTime();
  });
}

async function fetchTaskLeads(client) {
  const { data: tasks, error } = await client
    .from('follow_up_tasks')
    .select('email, name, phone, click_event_id, created_at')
    .eq('status', 'pending');

  if (error) throw error;
  if (!tasks?.length) return [];

  const clickIds = [...new Set(tasks.map((task) => task.click_event_id).filter(Boolean))];
  let clickById = {};

  if (clickIds.length) {
    const { data: clicks, error: clickError } = await client
      .from('scan_and_scale_click_events')
      .select('id, email, name, phone, lead_source, intent_tier, intent_score, created_at')
      .in('id', clickIds);

    if (clickError) throw clickError;
    clickById = Object.fromEntries((clicks ?? []).map((row) => [row.id, row]));
  }

  return tasks.map((task) => {
    const click = task.click_event_id ? clickById[task.click_event_id] : null;
    return {
      email: click?.email ?? task.email,
      name: click?.name ?? task.name,
      phone: click?.phone ?? task.phone,
      lead_source: click?.lead_source ?? null,
      intent_tier: click?.intent_tier ?? 'COLD',
      intent_score: click?.intent_score ?? 0,
      submitted_at: click?.created_at ?? task.created_at,
    };
  });
}

function TierBadge({ tier }) {
  const normalized = String(tier ?? '').toUpperCase();
  const style = BADGE_STYLES[normalized] ?? BADGE_STYLES.COLD;

  return (
    <span className="badge" style={style}>
      {normalized || '—'}
    </span>
  );
}

function OriginTag({ origin }) {
  const meta = ORIGIN_LABEL[origin] ?? ORIGIN_LABEL.journey;

  return (
    <span
      className="badge"
      style={{
        background: 'transparent',
        border: `1px solid ${meta.color}`,
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
}

export default function FollowUpDashboard() {
  const [activeTab, setActiveTab] = useState('call');
  const [callList, setCallList] = useState([]);
  const [abandonedList, setAbandonedList] = useState([]);
  const [abandonedLeads, setAbandonedLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async () => {
    if (!supabase) {
      setError('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [newLeadsResult, taskLeads, journeyLeadsResult, pageVisitorsResult, abandonedCalcResult, abandonedResult] =
        await Promise.all([
          supabase
            .from('finished_calc_leads')
            .select('email, name, phone, lead_source, intent_tier, intent_score, created_at')
            .not('email', 'ilike', '%test%')
            .not('email', 'ilike', '%seamlessly%')
            .neq('email', 'maurice@mauricethefirst.com')
            .order('intent_score', { ascending: false }),
          fetchTaskLeads(supabase),
          supabase
            .from('sports_revenue_game_journeys')
            .select('email, full_name, phone, persona, created_at')
            .not('email', 'ilike', '%test%')
            .not('email', 'ilike', '%seamlessly%')
            .neq('email', 'maurice@mauricethefirst.com')
            .not('email', 'is', null)
            .order('created_at', { ascending: false }),
          supabase
            .from('calculator_page_visits')
            .select('email, name, phone, page_key, query_params, created_at')
            .not('email', 'is', null)
            .not('email', 'ilike', '%test%')
            .not('email', 'ilike', '%seamlessly%')
            .neq('email', 'maurice@mauricethefirst.com')
            .not('email', 'ilike', '%user%')
            .order('created_at', { ascending: false })
            .limit(200),
          supabase
            .from('abandoned_calc_leads')
            .select('email, session_id, lead_source, event_count, last_event_at, created_at')
            .eq('re_engaged', false)
            .not('email', 'is', null)
            .not('email', 'ilike', '%test%')
            .not('email', 'ilike', '%seamlessly%')
            .order('event_count', { ascending: false })
            .limit(200),
          supabase
            .from('abandoned_calc_leads')
            .select('*')
            .eq('re_engaged', false)
            .order('event_count', { ascending: false })
            .limit(100),
        ]);

      if (newLeadsResult.error) throw newLeadsResult.error;
      if (journeyLeadsResult.error) throw journeyLeadsResult.error;
      if (pageVisitorsResult.error) throw pageVisitorsResult.error;
      if (abandonedCalcResult.error) throw abandonedCalcResult.error;
      if (abandonedResult.error) throw abandonedResult.error;

      const unified = buildUnifiedList(
        newLeadsResult.data,
        taskLeads,
        journeyLeadsResult.data,
      );
      const finishedEmails = new Set(unified.map((lead) => lead.email));

      setCallList(unified);
      setAbandonedList(
        buildAbandonedList(
          pageVisitorsResult.data,
          abandonedCalcResult.data,
          finishedEmails,
        ),
      );
      setAbandonedLeads(abandonedResult.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  if (!supabase) {
    return <p className="empty-state">Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY</p>;
  }

  return (
    <div className="revops-dashboard">
      <header className="revops-header">SEAMLESSLY REVOPS</header>

      <nav className="revops-toolbar">
        <button
          type="button"
          className="revops-btn-refresh"
          style={{ marginRight: '0.5rem', opacity: activeTab === 'call' ? 1 : 0.65 }}
          onClick={() => setActiveTab('call')}
        >
          Call These Now
        </button>
        <button
          type="button"
          className="revops-btn-refresh"
          style={{
            marginRight: '0.5rem',
            opacity: activeTab === 'reengage' ? 1 : 0.65,
          }}
          onClick={() => setActiveTab('reengage')}
        >
          Re-Engage
        </button>
        <button
          type="button"
          className="revops-btn-refresh"
          style={{
            marginRight: '0.5rem',
            background: activeTab === 'abandoned' ? '#D4AF37' : 'transparent',
            color: activeTab === 'abandoned' ? '#1A2A44' : 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(212,175,55,0.4)',
            opacity: activeTab === 'abandoned' ? 1 : 0.85,
          }}
          onClick={() => setActiveTab('abandoned')}
        >
          Abandoned Calculator
        </button>
        <button
          type="button"
          className="revops-btn-refresh"
          style={{ marginLeft: '0.75rem' }}
          onClick={fetchLeads}
          disabled={loading}
        >
          Refresh
        </button>
      </nav>

      {error ? <p className="revops-error">{error}</p> : null}

      {activeTab === 'call' ? (
        <section>
          <h2 className="contacts-domain-heading">Call These Now</h2>
          <p className="empty-state" style={{ margin: '0 0 1rem', textAlign: 'left' }}>
            All contact submissions — deduplicated by email, HOT first.
          </p>
          {!callList.length && !loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', padding: '32px', textAlign: 'center' }}>
              No leads to follow up on right now.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="revops-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Calculator</th>
                    <th>Intent</th>
                    <th>Source</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {callList.map((lead) => (
                    <tr key={lead.email}>
                      <td>{lead.name}</td>
                      <td>{formatCell(lead.email)}</td>
                      <td>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} style={{ color: '#58a6ff' }}>
                            {lead.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{formatSource(lead.source)}</td>
                      <td>
                        <TierBadge tier={lead.intent_tier} />
                      </td>
                      <td>
                        <OriginTag origin={lead.origin} />
                      </td>
                      <td>{formatDate(lead.submitted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : activeTab === 'reengage' ? (
        <section>
          <h2 className="contacts-domain-heading">Re-Engage</h2>
          <p className="empty-state" style={{ margin: '0 0 1rem', textAlign: 'left' }}>
            Sorted by engagement depth, then last seen.
          </p>
          {!abandonedLeads.length && !loading ? (
            <p className="empty-state">No abandoned calculator sessions yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="revops-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Calculator</th>
                    <th>Events</th>
                    <th>Last Seen</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {abandonedLeads.map((row) => (
                    <tr key={row.id}>
                      <td>{row.email?.trim() ? row.email : 'Anonymous'}</td>
                      <td>{formatSource(row.lead_source)}</td>
                      <td>{formatCell(row.event_count)}</td>
                      <td>{formatDate(row.last_event_at)}</td>
                      <td>
                        <button type="button" className="revops-btn-refresh" disabled>
                          Send Follow-up
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section>
          <h2 className="contacts-domain-heading" style={{ color: '#D4AF37' }}>
            Abandoned Calculator
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0 0 1.5rem' }}>
            Visited a calculator but never submitted. Sorted by engagement depth.
          </p>
          {!abandonedList.length && !loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', padding: '32px', textAlign: 'center' }}>
              No abandoned visitors found.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="revops-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Calculator</th>
                    <th>Events Fired</th>
                    <th>Last Seen</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {abandonedList.map((lead) => (
                    <tr key={lead.email}>
                      <td>{lead.email}</td>
                      <td>{lead.name}</td>
                      <td>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} style={{ color: '#00D4AA' }}>
                            {lead.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{formatSource(lead.source)}</td>
                      <td style={{ color: lead.event_count > 3 ? '#D4AF37' : 'inherit' }}>
                        {lead.event_count}
                      </td>
                      <td>{formatDate(lead.last_seen)}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '2px',
                            background:
                              lead.origin === 'abandoned_tracked'
                                ? 'rgba(212,175,55,0.15)'
                                : 'rgba(255,255,255,0.08)',
                            color:
                              lead.origin === 'abandoned_tracked'
                                ? '#D4AF37'
                                : 'rgba(255,255,255,0.4)',
                            border: 'none',
                          }}
                        >
                          {lead.origin === 'abandoned_tracked' ? 'RAN CALC' : 'PAGE VISIT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
