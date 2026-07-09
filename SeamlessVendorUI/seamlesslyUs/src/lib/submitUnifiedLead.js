import { isCompleteCalculatorEmailFields } from './calculatorEmailPersonalization';
import { recordScanAndScaleLeadCapture } from './scanAndScaleClickEvent';
import { updateCalculatorPageVisitContact } from './calculatorPageVisits';
import { persistLeadEmail, getOrCreateSessionId } from './leadEngineStorage';
import { persistContactEmail } from './seamlesslyContactCapture';
import { invokeOnLeadSubmit } from './invokeOnLeadSubmit';
import { ingestLeadEvent } from './ingestLeadEvent';

/**
 * Unified lead submit — canonical v2 row + on-lead-submit orchestrator.
 * Visit rows receive identity + attribution together (v2 lead row is created first
 * so the legacy calculator_page_visits webhook no-ops).
 */
export async function submitUnifiedLead({
  email,
  name,
  phone,
  source,
  campaign,
  visitId,
  visitContact,
  calculatorEmailFields,
}) {
  try {
    // eslint-disable-next-line no-console
    console.log('[submitUnifiedLead] starting', { email, source });

    if (!isCompleteCalculatorEmailFields(calculatorEmailFields)) {
      // eslint-disable-next-line no-console
      console.error('[submitUnifiedLead] missing calculator fields');
      return { ok: false, error: 'missing_calculator_fields' };
    }

    const capture = await recordScanAndScaleLeadCapture({
      email,
      name,
      phone,
      campaign,
      source,
      calculatorEmailFields,
      abVariant: visitContact?.abVariant,
      persona: visitContact?.persona,
      orderingMethod: visitContact?.orderingMethod,
      leadScore: visitContact?.leadScore,
    });

    // eslint-disable-next-line no-console
    console.log('[submitUnifiedLead] lead row created', {
      leadId: capture.lead_id,
      inserted: capture.inserted,
    });

    if (!capture.ok || !capture.lead_id) {
      // eslint-disable-next-line no-console
      console.error('[submitUnifiedLead] no leadId returned — insert failed', capture.error);
      return { ok: false, error: capture.error || 'lead_capture_failed' };
    }

    persistLeadEmail(email);
    persistContactEmail(email);

    const orchestrator = await invokeOnLeadSubmit({
      lead_id: capture.lead_id,
      email,
      name,
      phone,
      source,
      session_id: getOrCreateSessionId(),
    });

    if (!orchestrator.ok) {
      // Lead row exists; orchestrator may be unavailable in local dev.
      if (orchestrator.error === 'not_configured' && capture.lead_id) {
        return {
          ok: true,
          lead_id: capture.lead_id,
          intent_tier: null,
          orchestrator_skipped: true,
        };
      }
      // eslint-disable-next-line no-console
      console.error('[submitUnifiedLead] orchestrator failed', orchestrator.error);
      return { ok: false, error: orchestrator.error };
    }

    // eslint-disable-next-line no-console
    console.log('[submitUnifiedLead] on-lead-submit invoked', {
      intent_tier: orchestrator.intent_tier,
    });

    await ingestLeadEvent({
      eventName: 'lead_submitted',
      engagementType: 'submit',
      source,
      email,
      name,
      phone,
      visitId,
      abVariant: visitContact?.abVariant,
      persona: visitContact?.persona,
      orderingMethod: visitContact?.orderingMethod,
      leadScore: visitContact?.leadScore,
    });

    if (visitId) {
      await updateCalculatorPageVisitContact({
        id: visitId,
        name: visitContact?.name ?? name,
        email: visitContact?.email ?? email,
        phone: visitContact?.phone ?? phone,
        lastClickCampaign: visitContact?.lastClickCampaign ?? campaign,
        abVariant: visitContact?.abVariant,
        persona: visitContact?.persona,
        orderingMethod: visitContact?.orderingMethod,
        leadScore: visitContact?.leadScore,
      });
    }

    return {
      ok: true,
      lead_id: capture.lead_id,
      intent_tier: orchestrator.intent_tier,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[submitUnifiedLead] FAILED:', err);
    throw err;
  }
}
