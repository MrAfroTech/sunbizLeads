const STORAGE_KEY = 'chaos_mastery_welcome_modal_state';

export function isChaosMasteryWelcomeModalDismissed() {
  if (typeof window === 'undefined') return true;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'dismissed' || value === 'subscribed';
  } catch {
    return false;
  }
}

export function markChaosMasteryWelcomeModalDismissed() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, 'dismissed');
  } catch {
    /* ignore */
  }
}

export function markChaosMasteryWelcomeModalSubscribed() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, 'subscribed');
  } catch {
    /* ignore */
  }
}
