export const CONTACT_CAPTURED_KEY = 'seamlessly_contact_captured';
export const VISIT_ID_KEY = 'seamlessly_calculator_visit_id';
export const CONTACT_EMAIL_KEY = 'seamlessly_contact_email';

export function isContactCaptured() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CONTACT_CAPTURED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markContactCaptured() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONTACT_CAPTURED_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export function persistCalculatorVisitId(id) {
  if (typeof window === 'undefined' || !id) return;
  try {
    window.localStorage.setItem(VISIT_ID_KEY, String(id));
  } catch {
    /* ignore */
  }
}

export function getStoredCalculatorVisitId() {
  if (typeof window === 'undefined') return null;
  try {
    const id = window.localStorage.getItem(VISIT_ID_KEY);
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

export function persistContactEmail(email) {
  if (typeof window === 'undefined' || !email) return;
  try {
    window.localStorage.setItem(CONTACT_EMAIL_KEY, String(email).trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

export function getStoredContactEmail() {
  if (typeof window === 'undefined') return null;
  try {
    const email = window.localStorage.getItem(CONTACT_EMAIL_KEY);
    return email && email.trim() ? email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}
