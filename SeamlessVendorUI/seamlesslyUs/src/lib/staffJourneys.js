import { supabase } from './supabaseClient';
import { contactForSupabase } from './journeyContactHelpers';

function logErr(context, error) {
  // eslint-disable-next-line no-console
  console.error(`[staff journey] ${context}:`, error?.message || error);
}

/** Primary Calculate on staff turnover calculator */
export async function recordStaffTurnoverPrimary({ contact, turnoverPerMonth }) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('staff_turnover_calculator_journeys')
    .insert({
      ...contactForSupabase(contact),
      clicked_primary_calculate: true,
      last_turnover_per_month: turnoverPerMonth,
    })
    .select('id')
    .single();

  if (error) {
    logErr('turnover primary insert', error);
    return null;
  }
  return data?.id ?? null;
}

/** Secondary Calculate — updates same row */
export async function recordStaffTurnoverSecondary({ journeyId, contact, tenureDays }) {
  if (!supabase || !journeyId) return;

  const { error } = await supabase
    .from('staff_turnover_calculator_journeys')
    .update({
      ...contactForSupabase(contact),
      clicked_secondary_calculate: true,
      last_tenure_days: tenureDays,
    })
    .eq('id', journeyId);

  if (error) logErr('turnover secondary update', error);
}

/** Staff burnout results — Back to calculator */
export async function recordStaffBurnoutBackClick({ contact, queryParams }) {
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[staff journey] Supabase not configured; skipping burnout insert');
    }
    return true;
  }

  const { error } = await supabase.from('staff_burnout_results_journeys').insert({
    ...contactForSupabase(contact),
    clicked_back_to_calculator: true,
    query_params: queryParams && typeof queryParams === 'object' ? queryParams : null,
  });

  if (error) {
    logErr('burnout results insert', error);
    return false;
  }
  return true;
}
