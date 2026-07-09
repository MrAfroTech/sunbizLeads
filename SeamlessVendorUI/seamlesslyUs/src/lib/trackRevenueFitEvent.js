import { getOrCreateSessionId } from './leadEngineStorage';

export async function trackRevenueFitEvent(eventName, attribution = {}, meta = {}) {
  try {
    await fetch('/api/ingest-lead-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        engagement_type: 'interact',
        source: 'revenue_fit_session',
        email: attribution.email,
        session_id: getOrCreateSessionId(),
        meta: {
          ...attribution,
          ...meta,
        },
      }),
      keepalive: true,
    });
  } catch {
    /* fail silently */
  }
}
