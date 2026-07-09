import { supabase, isSupabaseConfigured } from './supabaseClient';

const TABLE = 'prospecting_weeks';

/** Form state keys (camelCase) → DB columns (snake_case) */
const TO_DB = {
  s1Date: 's1_date',
  s1Requests: 's1_requests',
  s1Accepted: 's1_accepted',
  s1Responses: 's1_responses',
  s1Contact: 's1_contact',
  s1FollowUpMessages: 's1_follow_up_messages',
  s1Demos: 's1_demos',
  s1Sales: 's1_sales',
  s1Revenue: 's1_revenue',
  s1Rating: 's1_rating',
  s1Journal: 's1_journal',
  s2Calls: 's2_calls',
  s2Positive: 's2_positive',
  s2Demos: 's2_demos',
  s2Sales: 's2_sales',
  s2Rating: 's2_rating',
  s2Journal: 's2_journal',
  s3Walkins: 's3_walkins',
  s3Contact: 's3_contact',
  s3Demos: 's3_demos',
  s3Sales: 's3_sales',
  s3Rating: 's3_rating',
  s3Journal: 's3_journal',
  s4Weekof: 's4_weekof',
  s4Events: 's4_events',
  s4Contacts: 's4_contacts',
  s4Followups: 's4_followups',
  s4Demos: 's4_demos',
  s4Sales: 's4_sales',
  s4Rating: 's4_rating',
  s4Journal: 's4_journal',
  s5Emails: 's5_emails',
  s5Replies: 's5_replies',
  s5Demos: 's5_demos',
  s5Sales: 's5_sales',
  s5Rating: 's5_rating',
  s5Journal: 's5_journal',
};

function formStateToRow(weekKey, formState) {
  const row = { week_key: weekKey };
  for (const [key, col] of Object.entries(TO_DB)) {
    const v = formState[key];
    row[col] = v === undefined || v === null ? '' : String(v);
  }
  return row;
}

function rowToFormState(row) {
  if (!row) return null;
  const state = {};
  for (const [key, col] of Object.entries(TO_DB)) {
    const v = row[col];
    state[key] = v == null ? '' : String(v);
  }
  return state;
}

/**
 * @param {string} weekKey
 * @param {object} formState
 */
export async function saveWeekDataToSupabase(weekKey, formState) {
  if (!isSupabaseConfigured() || !weekKey) return;
  const row = formStateToRow(weekKey, formState);
  await supabase.from(TABLE).upsert(row, { onConflict: 'week_key' });
}

/**
 * @param {string} weekKey
 * @returns {Promise<object | null>}
 */
export async function loadWeekDataFromSupabase(weekKey) {
  if (!isSupabaseConfigured() || !weekKey) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('week_key', weekKey)
    .maybeSingle();
  if (error) return null;
  return rowToFormState(data);
}

/**
 * @param {string[]} weekKeys
 * @returns {Promise<object[]>} form states in same order as weekKeys; empty form state for missing rows
 */
export async function loadMultipleWeeksFromSupabase(weekKeys) {
  if (!isSupabaseConfigured() || !weekKeys || weekKeys.length === 0) return [];
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('week_key', weekKeys);
  if (error) return weekKeys.map(() => ({}));
  const byKey = {};
  for (const row of rows || []) {
    const key = row?.week_key;
    if (key) byKey[key] = rowToFormState(row);
  }
  return weekKeys.map((key) => byKey[key] || {});
}
