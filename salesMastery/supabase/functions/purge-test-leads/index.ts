import { createAdminClient } from '../_shared/supabase-admin.ts';

const TEST_LEAD_OR =
  'email.ilike.%test%,email.ilike.%seamlessly%,email.ilike.%user%,email.eq.maurice@mauricethefirst.com,name.ilike.%test%,name.ilike.%user%';

const TEST_EMAIL_OR =
  'email.ilike.%test%,email.ilike.%seamlessly%,email.ilike.%user%,email.eq.maurice@mauricethefirst.com';

const AGE_DAYS = 7;

function cutoffIso(): string {
  return new Date(Date.now() - AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

Deno.serve(async () => {
  try {
    const admin = createAdminClient();
    const cutoff = cutoffIso();

    const { data: leads, error: leadsErr } = await admin
      .from('scan_and_scale_click_events')
      .select('id')
      .or(TEST_LEAD_OR)
      .lt('created_at', cutoff);

    if (leadsErr) throw leadsErr;

    const leadIds = (leads ?? []).map((row) => row.id);

    const { data: testVisits, error: visitsErr } = await admin
      .from('calculator_page_visits')
      .select('id')
      .or(TEST_EMAIL_OR)
      .lt('created_at', cutoff);

    if (visitsErr) throw visitsErr;

    const visitIds = (testVisits ?? []).map((row) => row.id);

    if (leadIds.length > 0 || visitIds.length > 0) {
      if (leadIds.length > 0 && visitIds.length > 0) {
        const { error: followUpErr } = await admin
          .from('follow_up_tasks')
          .delete()
          .or(
            `click_event_id.in.(${leadIds.join(',')}),calculator_visit_id.in.(${visitIds.join(',')})`,
          );
        if (followUpErr) throw followUpErr;
      } else if (leadIds.length > 0) {
        const { error: followUpErr } = await admin
          .from('follow_up_tasks')
          .delete()
          .in('click_event_id', leadIds);
        if (followUpErr) throw followUpErr;
      } else {
        const { error: followUpErr } = await admin
          .from('follow_up_tasks')
          .delete()
          .in('calculator_visit_id', visitIds);
        if (followUpErr) throw followUpErr;
      }

      if (leadIds.length > 0) {
        const { error: leadEventsByLeadErr } = await admin
          .from('lead_events')
          .delete()
          .in('lead_id', leadIds);
        if (leadEventsByLeadErr) throw leadEventsByLeadErr;
      }
    }

    for (const table of [
      'lead_events',
      'calculator_page_visits',
      'calculator_engagement_events',
      'sports_revenue_game_journeys',
    ] as const) {
      const { error } = await admin.from(table).delete().or(TEST_EMAIL_OR).lt('created_at', cutoff);
      if (error) throw error;
    }

    if (leadIds.length > 0) {
      const { error: canonErr } = await admin
        .from('scan_and_scale_click_events')
        .delete()
        .in('id', leadIds);
      if (canonErr) throw canonErr;
    }

    return new Response(
      JSON.stringify({ purged: leadIds.length, cutoff }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
});
