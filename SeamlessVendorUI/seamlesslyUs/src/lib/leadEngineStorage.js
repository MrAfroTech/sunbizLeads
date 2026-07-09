const LEAD_EMAIL_KEY = 'seamlessly_lead_email';
const SESSION_KEY = 'seamlessly_session_id';

export function getStoredLeadEmail() {
  if (typeof window === 'undefined') return null;
  try {
    const email = window.localStorage.getItem(LEAD_EMAIL_KEY);
    return email && email.trim() ? email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export function persistLeadEmail(email) {
  if (typeof window === 'undefined' || !email) return;
  try {
    window.localStorage.setItem(LEAD_EMAIL_KEY, String(email).trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return null;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `sess-${Date.now()}`;
  }
}
