/**
 * Lead Priority data layer.
 * Maps to spec endpoints GET /api/lead-priority and PATCH /api/lead-priority/:email/status
 * via Supabase PostgREST (same pattern as other RevOps tabs — no separate API server).
 */
import supabase from './supabaseClient.js';

export const AM_STATUS_OPTIONS = [
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'no_response', label: 'No Response' },
];

const AM_TASK_TYPE = 'am_outreach';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** GET /api/lead-priority */
export async function fetchLeadPriority({ clusterOnly = false } = {}) {
  if (!supabase) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  let query = supabase
    .from('v_lead_priority')
    .select('*')
    .order('priority_score', { ascending: false });

  if (clusterOnly) {
    query = query.eq('is_cluster_signal', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** PATCH /api/lead-priority/:email/status */
export async function updateLeadStatus(email, status) {
  if (!supabase) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('Email is required');

  const now = new Date().toISOString();

  if (status === 'not_contacted') {
    const { data: existing, error: fetchError } = await supabase
      .from('follow_up_tasks')
      .select('id')
      .eq('email', normalized)
      .eq('task_type', AM_TASK_TYPE)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (existing?.id) {
      const { error } = await supabase
        .from('follow_up_tasks')
        .update({ status: 'not_contacted', updated_at: now })
        .eq('id', existing.id);
      if (error) throw error;
    }
    return { email: normalized, status: 'not_contacted' };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('follow_up_tasks')
    .select('id')
    .eq('email', normalized)
    .eq('task_type', AM_TASK_TYPE)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing?.id) {
    const { error } = await supabase
      .from('follow_up_tasks')
      .update({ status, updated_at: now })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('follow_up_tasks').insert({
      email: normalized,
      task_type: AM_TASK_TYPE,
      status,
      created_at: now,
      updated_at: now,
    });
    if (error) throw error;
  }

  return { email: normalized, status };
}

function csvEscape(value) {
  const s = value == null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatExportDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCalculatorLabel(type) {
  if (!type) return '';
  return type
    .replace(/_/g, ' ')
    .replace(/calculator/gi, 'Calc')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function fetchTheirNumbersByEmail(emails) {
  if (!supabase || emails.length === 0) return {};

  const normalized = [...new Set(emails.map((e) => normalizeEmail(e)).filter(Boolean))];
  const [finishedRes, ssceRes] = await Promise.all([
    supabase.from('finished_calc_leads').select('email, calculator_output').in('email', normalized),
    supabase.from('scan_and_scale_click_events').select('email, estimated_loss').in('email', normalized),
  ]);

  if (finishedRes.error) throw finishedRes.error;
  if (ssceRes.error) throw ssceRes.error;

  const map = {};
  for (const row of finishedRes.data || []) {
    const email = normalizeEmail(row.email);
    const output = row.calculator_output || {};
    const loss = output.estimated_loss || output.estimatedLoss;
    if (email && loss) map[email] = String(loss);
  }
  for (const row of ssceRes.data || []) {
    const email = normalizeEmail(row.email);
    if (email && row.estimated_loss && !map[email]) {
      map[email] = String(row.estimated_loss);
    }
  }
  return map;
}

/** Export visible lead priority rows as CSV (respects current sort/filter). */
export async function downloadLeadPriorityCsv(rows) {
  const theirNumbers = await fetchTheirNumbersByEmail(rows.map((row) => row.email));

  const headers = ['Name', 'Email', 'Phone', 'Calculator', 'Date', 'Their Number', 'Cluster POC', 'Suppress Outreach'];
  const lines = [headers.map(csvEscape).join(',')];

  for (const row of rows) {
    const name = row.full_name?.trim() || row.email || '';
    const theirNumber = theirNumbers[normalizeEmail(row.email)] || '';
    lines.push(
      [
        name,
        row.email || '',
        row.phone || '',
        formatCalculatorLabel(row.calculator_type),
        formatExportDate(row.last_activity),
        theirNumber,
        row.cluster_poc_email || '',
        row.suppress_individual_outreach ? 'yes' : 'no',
      ]
        .map(csvEscape)
        .join(','),
    );
  }

  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lead-priority-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
