import { useCallback, useEffect, useRef } from 'react';
import { getOrCreateSessionId, getStoredLeadEmail } from './leadEngineStorage';
import { getStoredCalculatorVisitId } from './seamlesslyContactCapture';
import { mergeStoredIdentity, resolveKnownLeadIdentity } from './leadIdentity';

/**
 * Read current URL search params in the browser (Brevo merge tags land here).
 * @returns {URLSearchParams|null}
 */
function currentSearchParams() {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search || '');
  } catch {
    return null;
  }
}

/**
 * Unified lead event tracker — POST /api/ingest-lead-event
 * @param {string} source lead magnet id, e.g. 'sports_calculator'
 */
export function useLeadEventTracker(source) {
  const viewFiredRef = useRef(false);

  const fire = useCallback(
    async (eventName, engagementType, meta = {}) => {
      if (!source || !eventName || !engagementType) return;
      const metaEmail =
        typeof meta.email === 'string' && meta.email.trim()
          ? meta.email.trim().toLowerCase()
          : null;
      const metaName =
        typeof meta.name === 'string' && meta.name.trim() ? meta.name.trim() : null;
      const metaPhone =
        typeof meta.phone === 'string' && meta.phone.trim() ? meta.phone.trim() : null;
      const visitId =
        typeof meta.visit_id === 'string' && meta.visit_id.trim()
          ? meta.visit_id.trim()
          : typeof meta.calculator_visit_id === 'string' && meta.calculator_visit_id.trim()
          ? meta.calculator_visit_id.trim()
          : undefined;

      // Leak 1 fix: resolve Brevo/URL identity at fire time (same source as CPV),
      // not only from localStorage — calculator_viewed often fires before storage is set.
      const urlIdentity = resolveKnownLeadIdentity(currentSearchParams()) || {};
      const identity = mergeStoredIdentity({
        email: metaEmail || urlIdentity.email || getStoredLeadEmail() || undefined,
        name: metaName || urlIdentity.name || undefined,
        phone: metaPhone || urlIdentity.phone || urlIdentity.phone_number || undefined,
      });
      const visitIdResolved =
        visitId ||
        getStoredCalculatorVisitId() ||
        undefined;
      try {
        await fetch('/api/ingest-lead-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: eventName,
            engagement_type: engagementType,
            source,
            email: identity.email || undefined,
            name: identity.name || undefined,
            phone: identity.phone || undefined,
            visit_id: visitIdResolved,
            ab_variant: meta.ab_variant || undefined,
            persona: meta.persona || undefined,
            ordering_method: meta.ordering_method || undefined,
            lead_score:
              meta.lead_score != null && Number.isFinite(Number(meta.lead_score))
                ? Math.round(Number(meta.lead_score))
                : undefined,
            session_id: getOrCreateSessionId(),
            meta,
          }),
          keepalive: true,
        });
      } catch {
        /* fail silently */
      }
    },
    [source],
  );

  useEffect(() => {
    if (!source || viewFiredRef.current) return;
    viewFiredRef.current = true;
    void fire('calculator_viewed', 'view');
  }, [source, fire]);

  const trackStartedOnce = useCallback(() => {
    void fire('calculator_started', 'interact');
  }, [fire]);

  const startedInputProps = useCallback(
    () => ({
      onFocus: trackStartedOnce,
      onChange: trackStartedOnce,
    }),
    [trackStartedOnce],
  );

  return { fire, trackStartedOnce, startedInputProps };
}
