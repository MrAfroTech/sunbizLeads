function getSupabaseUrl() {
  return (
    process.env.REACT_APP_SUPABASE_URL_SALES_MASTERY ||
    process.env.VITE_SUPABASE_URL_SALES_MASTERY ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  );
}

function getAnonKey() {
  return (
    process.env.REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY ||
    process.env.VITE_SUPABASE_ANON_KEY_SALES_MASTERY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  );
}

/**
 * Invoke unified lead orchestrator Edge Function.
 */
export async function invokeOnLeadSubmit({ lead_id, email, name, phone, source, session_id }) {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl || !lead_id || !email) {
    return { ok: false, error: 'not_configured' };
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    const anonKey = getAnonKey();
    if (anonKey) {
      headers.Authorization = `Bearer ${anonKey}`;
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/on-lead-submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ lead_id, email, name, phone, source, session_id }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return { ok: false, error: body?.error || res.statusText };
    }
    return {
      ok: true,
      intent_tier: body.intent_tier ?? null,
      skipped: body.skipped === true,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err ?? 'invoke failed'),
    };
  }
}
