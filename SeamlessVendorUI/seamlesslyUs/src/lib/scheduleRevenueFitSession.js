import { buildCalendlyBookingUrl } from './revenueFitAttribution';
import { trackRevenueFitEvent } from './trackRevenueFitEvent';

/**
 * One-click Revenue Fit Session — log intent (best-effort) then redirect to Calendly.
 */
export async function scheduleRevenueFitSession({ name, email, phone, attribution = {} }) {
  const fallbackUrl = buildCalendlyBookingUrl({ name, email, attribution });

  void trackRevenueFitEvent('revenue_fit_session_booking_started', attribution, {
    name,
    phone,
  });

  try {
    const res = await fetch('/api/book-revenue-fit-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, attribution }),
      keepalive: true,
    });
    const data = await res.json().catch(() => ({}));
    const redirectUrl =
      typeof data.redirectUrl === 'string' && data.redirectUrl.startsWith('http')
        ? data.redirectUrl
        : fallbackUrl;

    void trackRevenueFitEvent('revenue_fit_session_booked', attribution, {
      status: 'queued',
      redirectUrl,
    });

    window.location.href = redirectUrl;
  } catch {
    window.location.href = fallbackUrl;
  }
}
