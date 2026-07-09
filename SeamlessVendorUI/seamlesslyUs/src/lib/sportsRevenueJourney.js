import { supabase } from './supabaseClient';
import { contactForSupabase } from './journeyContactHelpers';

function warnNoSupabase() {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(
      '[sports journey] Supabase (Sales Mastery) not configured. Set REACT_APP_SUPABASE_URL_SALES_MASTERY and REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY on Vercel / .env.local'
    );
  }
}

/**
 * Inserts a row when the user clicks Calculate on /calculator/sports.
 * Page views are logged separately in calculator_page_visits.
 * @returns {Promise<string|null>} new row id, or null if skipped / failed
 */
export async function recordSportsJourneyCalculate({
  contact,
  totalFans,
  averageOrderValue,
  percentNeverOrdered,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
}) {
  if (!supabase) {
    warnNoSupabase();
    return null;
  }

  const row = {
    ...contactForSupabase(contact),
    clicked_calculate: true,
    last_total_fans: totalFans,
    last_average_order_value: averageOrderValue,
    last_percent_never_ordered: percentNeverOrdered,
  };

  if (abVariant === 'a' || abVariant === 'b') row.ab_variant = abVariant;
  if (persona) row.persona = String(persona).trim().slice(0, 100);
  if (orderingMethod) row.ordering_method = String(orderingMethod).trim().slice(0, 100);
  if (leadScore != null && Number.isFinite(leadScore)) row.lead_score = Math.round(leadScore);

  const { data, error } = await supabase
    .from('sports_revenue_game_journeys')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[sports journey] insert failed:', error.message);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Marks Schedule a Demo for the same session row (after Calculate).
 */
export async function recordSportsJourneyScheduleDemo(journeyId) {
  if (!supabase || !journeyId) return;

  const { error } = await supabase
    .from('sports_revenue_game_journeys')
    .update({ clicked_schedule_demo: true })
    .eq('id', journeyId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[sports journey] schedule demo update failed:', error.message);
  }
}
