/**
 * Company + agent dashboard data from Supabase (anon key) — all fields on public.leads.
 *
 * Metrics use a single paginated `select` + in-memory counts to avoid PostgREST 400s
 * when filters on enum/text columns or `not.is.null` behave differently per project.
 */

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function fetchCompanyMetrics(supabase) {
  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);
  const iso = startOfDayUtc.toISOString();

  const { count: totalLeadsToday, error: e1 } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', iso);

  const { count: totalLeads, error: e2 } = await supabase.from('leads').select('id', { count: 'exact', head: true });

  const err = e1 || e2;
  if (err) throw new Error(err.message);

  /** Pull rows for conversion + tier breakdown (avoids fragile filter chains). */
  const tierBreakdown = { TIER_1_HIGH: 0, TIER_2_MEDIUM: 0, TIER_3_LOW: 0 };
  let withFormSubmit = 0;

  let from = 0;
  const pageSize = 1000;
  for (;;) {
    const { data: page, error: ep } = await supabase
      .from('leads')
      .select('form_submitted_at, urgency_tier')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (ep) throw new Error(ep.message);
    if (!page?.length) break;

    for (const row of page) {
      if (row.form_submitted_at != null && row.form_submitted_at !== '') withFormSubmit += 1;
      const t = row.urgency_tier;
      if (t === 'TIER_1_HIGH') tierBreakdown.TIER_1_HIGH += 1;
      if (t === 'TIER_2_MEDIUM') tierBreakdown.TIER_2_MEDIUM += 1;
      if (t === 'TIER_3_LOW') tierBreakdown.TIER_3_LOW += 1;
    }
    if (page.length < pageSize) break;
    from += pageSize;
  }

  const t = totalLeads == null ? 0 : totalLeads;
  const conversionRatePercent = t === 0 ? 0 : Math.round((withFormSubmit / t) * 1000) / 10;

  return {
    totalLeadsToday: totalLeadsToday ?? 0,
    conversionRatePercent,
    tierBreakdown
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function fetchAgentRows(supabase) {
  const { data: rows, error } = await supabase
    .from('leads')
    .select(
      'id, first_name, last_name, email, phone, urgency_tier, lead_category, lead_score, form_submitted_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  return (rows || []).map((row) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    lead_score: row.lead_score,
    lead_category: row.lead_category,
    urgency_tier: row.urgency_tier,
    date_submitted: row.form_submitted_at || row.updated_at || null
  }));
}
