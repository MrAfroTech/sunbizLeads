/**
 * Sends the events calculator lead magnet PDF to the user's inbox.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function sendEventsHeyyouPdf({
  name,
  email,
  venueName,
  leftOnTable,
}) {
  const trimmedEmail = String(email || '').trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { ok: false, error: 'invalid_email' };
  }

  try {
    const siteUrl =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : undefined;

    const res = await fetch('/api/send-events-heyyou-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || 'there',
        email: trimmedEmail,
        venueName: venueName || '',
        leftOnTable: Number(leftOnTable) || 0,
        siteUrl,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      const serverMessage = data.message || data.error || res.statusText;
      return {
        ok: false,
        error: serverMessage || 'send_failed',
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'send_failed',
    };
  }
}
