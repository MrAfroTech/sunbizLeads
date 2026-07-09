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

const TRACKER_ENDPOINT_SUFFIX = '/functions/v1/track-calculator-event';

/**
 * POST a row to calculator_engagement_events via the track-calculator-event Edge Function.
 * @param {string} calculatorName e.g. "wait", "sports", "staffturnover", "districts"
 * @param {string} eventType
 * @param {Record<string, unknown>} [metadata]
 */
export async function fireCalculatorEngagementEvent(calculatorName, eventType, metadata = {}) {
  const url = getSupabaseUrl();
  const anonKey = getAnonKey();
  if (!url || !anonKey || !calculatorName || !eventType) return;

  let sessionId = null;
  try {
    sessionId = sessionStorage.getItem('calc_tracker_session_id');
    if (!sessionId) {
      sessionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sess-${Date.now()}`;
      sessionStorage.setItem('calc_tracker_session_id', sessionId);
    }
  } catch {
    sessionId = `sess-${Date.now()}`;
  }

  const payload = {
    session_id: sessionId,
    event_type: eventType,
    calculator_name: calculatorName,
    page: typeof window !== 'undefined' ? window.location.pathname : null,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    ...metadata,
  };

  try {
    await fetch(`${url}${TRACKER_ENDPOINT_SUFFIX}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* fail silently */
  }

  try {
    window.CalcTracker?.fire?.(eventType, metadata);
  } catch {
    /* optional parallel tracker */
  }
}
