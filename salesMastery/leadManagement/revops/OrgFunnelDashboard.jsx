import { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from './src/supabaseClient.js';
import './src/OrgFunnelDashboard.css';

const CALENDLY_BASE =
  'https://calendly.com/staying-ahead-of-the-game/seamless-chat-clone';

const DISPOSITIONS = [
  { id: 'booked', label: 'Booked', className: 'disp-booked' },
  { id: 'not_interested', label: 'Not Interested', className: 'disp-ni' },
  { id: 'voicemail', label: 'VM', className: 'disp-vm' },
  { id: 'no_answer', label: 'No Ans', className: 'disp-na' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSource(source) {
  if (!source) return 'Calculator';
  return source
    .replace(/_/g, ' ')
    .replace(/calculator/gi, 'Calc')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isExcludedEmail(email) {
  if (!email) return true;
  const lower = email.toLowerCase();
  return (
    lower.includes('test') ||
    lower.includes('seamlessly') ||
    lower === 'maurice@mauricethefirst.com'
  );
}

function calcFieldsFromOutput(output) {
  if (!output || typeof output !== 'object') return null;
  const estimated_loss = output.estimated_loss || output.estimatedLoss;
  const avg_wait_time = output.avg_wait_time || output.avgWaitTime;
  const primary_friction_zone = output.primary_friction_zone || output.primaryFrictionZone;
  if (!estimated_loss) return null;
  return {
    estimated_loss: String(estimated_loss),
    avg_wait_time: avg_wait_time ? String(avg_wait_time) : null,
    primary_friction_zone: primary_friction_zone ? String(primary_friction_zone) : null,
  };
}

function buildTalkTrack(fields) {
  if (!fields?.estimated_loss) return null;
  const loss = fields.estimated_loss;
  const wait = fields.avg_wait_time || 'your wait times';
  const zone = fields.primary_friction_zone || 'checkout friction';
  return `I saw you ran our calculator — it showed about ${loss} in lost revenue, with ${wait} average wait, mostly around "${zone}". Wanted to see if we could walk through what that looks like at your venue.`;
}

function buildCalendlyUrl(name, email) {
  const params = new URLSearchParams();
  if (name && name !== '—') params.set('name', name);
  if (email) params.set('email', email);
  const qs = params.toString();
  return `${CALENDLY_BASE}${qs ? `?${qs}` : ''}`;
}

function buildUnifiedList(newLeads, taskLeads, journeyLeads, calcByEmail) {
  const seen = new Set();
  const list = [];

  const enrich = (row) => {
    const calc =
      calcByEmail[row.email] ||
      calcFieldsFromOutput(row.calculator_output) ||
      null;
    return { ...row, calc };
  };

  for (const lead of newLeads || []) {
    if (isExcludedEmail(lead.email) || seen.has(lead.email)) continue;
    seen.add(lead.email);
    list.push(
      enrich({
        email: lead.email,
        name: lead.name || '—',
        phone: lead.phone || null,
        source: lead.lead_source,
        submitted: lead.created_at,
        calculator_output: lead.calculator_output,
      }),
    );
  }

  for (const task of taskLeads || []) {
    if (isExcludedEmail(task.email) || seen.has(task.email)) continue;
    seen.add(task.email);
    list.push(
      enrich({
        email: task.email,
        name: task.name || '—',
        phone: task.phone || null,
        source: task.lead_source,
        submitted: task.submitted_at,
      }),
    );
  }

  for (const journey of journeyLeads || []) {
    if (isExcludedEmail(journey.email) || seen.has(journey.email)) continue;
    seen.add(journey.email);
    list.push(
      enrich({
        email: journey.email,
        name: journey.full_name || '—',
        phone: journey.phone || null,
        source: journey.persona || 'calculator',
        submitted: journey.created_at,
      }),
    );
  }

  return list.sort((a, b) => {
    const phoneA = a.phone ? 1 : 0;
    const phoneB = b.phone ? 1 : 0;
    if (phoneB !== phoneA) return phoneB - phoneA;
    const calcA = a.calc?.estimated_loss ? 1 : 0;
    const calcB = b.calc?.estimated_loss ? 1 : 0;
    if (calcB !== calcA) return calcB - calcA;
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

  const clickIds = [...new Set(tasks.map((t) => t.click_event_id).filter(Boolean))];
  let clickById = {};
  if (clickIds.length) {
    const { data: clicks, error: clickError } = await client
      .from('scan_and_scale_click_events')
      .select('id, email, name, phone, lead_source, created_at, estimated_loss, avg_wait_time, primary_friction_zone')
      .in('id', clickIds);
    if (clickError) throw clickError;
    clickById = Object.fromEntries((clicks ?? []).map((r) => [r.id, r]));
  }

  return tasks.map((task) => {
    const click = task.click_event_id ? clickById[task.click_event_id] : null;
    return {
      email: click?.email ?? task.email,
      name: click?.name ?? task.name,
      phone: click?.phone ?? task.phone,
      lead_source: click?.lead_source ?? null,
      submitted_at: click?.created_at ?? task.created_at,
      estimated_loss: click?.estimated_loss,
      avg_wait_time: click?.avg_wait_time,
      primary_friction_zone: click?.primary_friction_zone,
    };
  });
}

async function fetchCalcByEmail(client, emails) {
  if (!emails.length) return {};
  const { data, error } = await client
    .from('scan_and_scale_click_events')
    .select('email, estimated_loss, avg_wait_time, primary_friction_zone')
    .in('email', emails);
  if (error) throw error;

  const map = {};
  for (const row of data ?? []) {
    if (!row.email || map[row.email]) continue;
    const fields = calcFieldsFromOutput({
      estimated_loss: row.estimated_loss,
      avg_wait_time: row.avg_wait_time,
      primary_friction_zone: row.primary_friction_zone,
    });
    if (fields) map[row.email] = fields;
  }
  return map;
}

function DollarCell({ calc }) {
  if (!calc?.estimated_loss) return <td className="setter-loss">—</td>;
  const talk = buildTalkTrack(calc);
  return (
    <td className="setter-loss">
      <span className="setter-loss-amount" title={talk ?? undefined}>
        {calc.estimated_loss}
      </span>
      {talk ? <div className="setter-talktrack">{talk}</div> : null}
    </td>
  );
}

export default function OrgFunnelDashboard() {
  const [leads, setLeads] = useState([]);
  const [dispositions, setDispositions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingEmail, setSavingEmail] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!supabase) {
      setError('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [newLeadsResult, taskLeads, journeyLeadsResult, dispositionsResult] =
        await Promise.all([
          supabase
            .from('finished_calc_leads')
            .select('email, name, phone, lead_source, created_at, calculator_output')
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
          supabase.from('setter_dispositions').select('*'),
        ]);

      if (newLeadsResult.error) throw newLeadsResult.error;
      if (journeyLeadsResult.error) throw journeyLeadsResult.error;
      if (dispositionsResult.error) throw dispositionsResult.error;

      const draft = buildUnifiedList(
        newLeadsResult.data,
        taskLeads,
        journeyLeadsResult.data,
        {},
      );

      const emails = draft.map((l) => l.email);
      const calcByEmail = await fetchCalcByEmail(supabase, emails);

      for (const task of taskLeads) {
        if (!task.email) continue;
        const fields = calcFieldsFromOutput({
          estimated_loss: task.estimated_loss,
          avg_wait_time: task.avg_wait_time,
          primary_friction_zone: task.primary_friction_zone,
        });
        if (fields && !calcByEmail[task.email]) calcByEmail[task.email] = fields;
      }

      setLeads(buildUnifiedList(newLeadsResult.data, taskLeads, journeyLeadsResult.data, calcByEmail));

      const dispMap = {};
      for (const row of dispositionsResult.data ?? []) {
        dispMap[row.email.toLowerCase()] = row;
      }
      setDispositions(dispMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      const d = dispositions[lead.email.toLowerCase()];
      if (!d) return true;
      return d.disposition !== 'booked' && d.disposition !== 'not_interested';
    });
  }, [leads, dispositions]);

  const handleDisposition = useCallback(
    async (lead, disposition) => {
      if (!supabase) return;

      const key = lead.email.toLowerCase();
      const existing = dispositions[key];
      const isAttempt = disposition === 'voicemail' || disposition === 'no_answer';
      const attempt_count = isAttempt
        ? (existing?.attempt_count ?? 0) + 1
        : (existing?.attempt_count ?? 0);

      const payload = {
        email: lead.email.toLowerCase(),
        disposition,
        attempt_count,
        updated_at: new Date().toISOString(),
      };

      setSavingEmail(lead.email);
      setDispositions((prev) => ({ ...prev, [key]: { ...payload, id: existing?.id } }));

      const { data, error: upsertError } = await supabase
        .from('setter_dispositions')
        .upsert(payload, { onConflict: 'email' })
        .select()
        .single();

      setSavingEmail(null);

      if (upsertError) {
        setError(upsertError.message);
        fetchAll();
        return;
      }

      if (data) {
        setDispositions((prev) => ({ ...prev, [key]: data }));
      }
    },
    [dispositions, fetchAll],
  );

  if (!supabase) {
    return <p className="empty-state">Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY</p>;
  }

  return (
    <div className="revops-dashboard setter-dashboard">
      <header className="revops-header setter-header">
        <span>CALL LIST</span>
        <span className="setter-count">{visibleLeads.length} leads</span>
      </header>

      <div className="revops-toolbar setter-toolbar">
        <button type="button" className="revops-btn-refresh" onClick={fetchAll} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <p className="revops-error">{error}</p> : null}

      {!visibleLeads.length && !loading ? (
        <div className="setter-empty">No leads to call right now.</div>
      ) : (
        <div className="table-wrap">
          <table className="revops-table setter-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Their Number</th>
                <th>Calc</th>
                <th>Date</th>
                <th>Tries</th>
                <th>Log</th>
                <th>Book</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map((lead) => {
                const d = dispositions[lead.email.toLowerCase()];
                const attempts = d?.attempt_count ?? 0;
                const dimmed = attempts >= 3 && d?.disposition === 'no_answer';

                return (
                  <tr
                    key={lead.email}
                    className={dimmed ? 'setter-row-dimmed' : undefined}
                  >
                    <td className="setter-name">{lead.name}</td>
                    <td>
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="setter-phone">
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="setter-no-phone">—</span>
                      )}
                    </td>
                    <DollarCell calc={lead.calc} />
                    <td className="setter-calc">{formatSource(lead.source)}</td>
                    <td>{formatDate(lead.submitted)}</td>
                    <td className="setter-tries">{attempts > 0 ? `${attempts}×` : '—'}</td>
                    <td>
                      <div className="setter-disp-group">
                        {DISPOSITIONS.map((disp) => (
                          <button
                            key={disp.id}
                            type="button"
                            className={`setter-disp-btn ${disp.className}${
                              d?.disposition === disp.id ? ' setter-disp-active' : ''
                            }`}
                            disabled={savingEmail === lead.email}
                            onClick={() => handleDisposition(lead, disp.id)}
                          >
                            {disp.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <a
                        href={buildCalendlyUrl(lead.name, lead.email)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="setter-book-btn"
                      >
                        Book
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
