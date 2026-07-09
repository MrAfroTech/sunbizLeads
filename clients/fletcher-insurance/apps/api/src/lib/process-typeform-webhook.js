/**
 * Shared Typeform webhook processing (Express + Vercel standalone handler).
 * Returns { status, json } for HTTP response.
 */

import { getEnv } from './env.js';
import { createSupabaseAdmin } from './supabase.js';
import { sendBrevoEmail } from '../providers/email/brevo.js';
import { verifyTypeformSignature } from './typeform-verify.js';
import { extractBudgetAndTimeline } from './typeform-extract.js';
import { extractLifeInsuranceAnswers } from './typeform-extract-life-insurance.js';
import { computeTier } from './scoring.js';
import { calculateLeadScore } from '../../../../packages/shared/src/lifeInsuranceLeadScore.js';
import { resolveOrCreateLead } from './resolve-lead-from-typeform.js';
import { formatLeadName } from './format-lead-name.js';

const supabase = createSupabaseAdmin();

function webhookDebug() {
  return process.env.WEBHOOK_DEBUG === '1';
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Integer columns — never send non-finite values or stray strings (avoids 22P02). */
function sanitizeLeadScore(score) {
  if (typeof score === 'number' && Number.isFinite(score)) return Math.round(score);
  return null;
}

function sanitizeBudgetForDb(budget) {
  if (typeof budget === 'number' && Number.isFinite(budget)) return Math.round(budget);
  return null;
}

/**
 * `normalizePurchaseTimeline` may return the literal "unknown" — do not persist that if the DB
 * column is integer, and prefer null when we have no real answer.
 */
function sanitizePurchaseTimelineForDb(purchaseTimelineRaw, purchaseTimelineNormalized) {
  const raw = typeof purchaseTimelineRaw === 'string' ? purchaseTimelineRaw.trim() : '';
  if (raw) return raw;
  const n = purchaseTimelineNormalized;
  if (n == null || n === '' || n === 'unknown') return null;
  return String(n);
}

/**
 * @param {object} opts
 * @param {Buffer} opts.rawBodyBuffer
 * @param {string} [opts.signatureHeader] Typeform-Signature header value
 * @returns {Promise<{ status: number; json: object }>}
 */
export async function runTypeformWebhook({ rawBodyBuffer, signatureHeader }) {
  const secret = process.env.TYPEFORM_WEBHOOK_SECRET ?? '';
  const skipVerify =
    process.env.TYPEFORM_SKIP_SIGNATURE_VERIFY === '1' ||
    (process.env.NODE_ENV !== 'production' && secret === '');

  if (!skipVerify && !secret) {
    getEnv('TYPEFORM_WEBHOOK_SECRET');
  }

  const valid =
    skipVerify ||
    verifyTypeformSignature({
      secret,
      rawBodyBuffer,
      signatureHeader
    });

  if (!valid) {
    console.error('[webhook] signature verification failed');
    return { status: 401, json: { ok: false, error: 'invalid_signature' } };
  }

  let payload;
  try {
    payload = JSON.parse(rawBodyBuffer.toString('utf8'));
  } catch {
    return { status: 400, json: { ok: false, error: 'invalid_json' } };
  }

  const typeformToken = payload?.form_response?.token ?? null;
  if (typeformToken) {
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('typeform_token', typeformToken)
      .maybeSingle();
    if (existingLead) {
      console.warn(
        '[webhook] duplicate typeform_token — exiting early (no email, no DB write). Resubmit with a new submission or clear token.'
      );
      return {
        status: 200,
        json: {
          ok: true,
          duplicate: true,
          reason: 'typeform_token_already_processed',
          ...(webhookDebug() && {
            _debug: { email: 'skipped_duplicate_submission', lead_id: existingLead.id }
          })
        }
      };
    }
  }

  let lead;
  try {
    lead = await resolveOrCreateLead(payload, supabase);
  } catch (resolveErr) {
    console.error('[webhook] resolveOrCreateLead', resolveErr);
    return {
      status: 500,
      json: { ok: false, error: resolveErr.message || 'lead_resolve_failed' }
    };
  }

  const { budgetRaw, purchaseTimelineRaw } = extractBudgetAndTimeline(payload);
  const { budget, purchaseTimelineNormalized, urgencyTier } = computeTier({
    budgetRaw,
    purchaseTimelineRaw
  });

  const submittedAtIso = payload?.form_response?.submitted_at;
  const submittedAt = submittedAtIso
    ? new Date(submittedAtIso).toISOString()
    : new Date().toISOString();

  const liAnswers = extractLifeInsuranceAnswers(payload);
  const r = calculateLeadScore(liAnswers);
  const liScore = r.score;
  const liCategory = r.category;

  const { data: updatedLead, error: leadUpErr } = await supabase
    .from('leads')
    .update({
      lead_score: sanitizeLeadScore(liScore),
      lead_category: liCategory,
      budget: sanitizeBudgetForDb(budget),
      purchase_timeline: sanitizePurchaseTimelineForDb(
        purchaseTimelineRaw,
        purchaseTimelineNormalized
      ),
      urgency_tier: urgencyTier,
      raw_typeform: payload,
      typeform_token: typeformToken,
      form_submitted_at: submittedAt,
      updated_at: submittedAt
    })
    .eq('id', lead.id)
    .select('*')
    .single();

  if (leadUpErr) {
    if (String(leadUpErr.message || '').includes('duplicate') || String(leadUpErr.code) === '23505') {
      return { status: 200, json: { ok: true, duplicate: true, reason: 'unique_typeform_token' } };
    }
    console.error('[webhook] lead update failed', leadUpErr);
    return { status: 500, json: { ok: false, error: leadUpErr.message } };
  }

  lead = updatedLead;

  console.log('[webhook] lead saved', {
    lead_id: lead.id,
    has_sales_email: !!(process.env.SALES_ALERT_EMAIL || '').trim(),
    has_brevo_key: !!process.env.BREVO_API_KEY,
    has_brevo_from: !!process.env.BREVO_FROM_EMAIL
  });

  const salesEmail = (process.env.SALES_ALERT_EMAIL || '').trim();

  const leadSummaryInner = `
          <p><b>Name:</b> ${esc(formatLeadName(lead))}</p>
          <p><b>Email:</b> ${esc(lead.email || '')}</p>
          <p><b>Phone:</b> ${esc(lead.phone || '')}</p>
          <hr/>
          <p><b>Score:</b> ${esc(String(liScore))} · <b>Category:</b> ${esc(liCategory)}</p>
          <p><b>Budget:</b> ${esc(budgetRaw || (budget == null ? '' : `$${budget}/mo`))}</p>
          <p><b>Timeline:</b> ${esc(String(purchaseTimelineRaw || purchaseTimelineNormalized || ''))}</p>
          <p><b>Urgency tier:</b> ${esc(urgencyTier)}</p>
      `;

  /** @type {'sent'|'skipped_no_recipient'|'failed'} */
  let emailStatus = 'skipped_no_recipient';
  /** @type {string | null} */
  let brevoMessageId = null;

  const ccEmail = (process.env.SALES_ALERT_CC || '').trim();
  const cc = ccEmail ? [{ email: ccEmail, name: 'CC' }] : undefined;

  if (!salesEmail) {
    console.error(
      '[webhook] EMAIL NOT SENT: SALES_ALERT_EMAIL is empty. Add it under Vercel → Settings → Environment Variables → Production, then redeploy.'
    );
  } else {
    try {
      console.log(
        '[webhook] sending Brevo email to',
        salesEmail.replace(/@.*/, '@…'),
        ccEmail ? `(CC: ${ccEmail.replace(/@.*/, '@…')})` : ''
      );
      const brevoResult = await sendBrevoEmail({
        toEmail: salesEmail,
        toName: 'Sales',
        subject: `New lead: ${formatLeadName(lead) || 'Lead'}`,
        html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 8px 0">New Typeform submission</h2>
          ${leadSummaryInner}
        </div>
      `,
        cc
      });
      emailStatus = 'sent';
      brevoMessageId =
        typeof brevoResult?.messageId === 'string' ? brevoResult.messageId : null;
      console.log(
        '[webhook] Brevo accepted — search this id in Brevo → Transactional → Logs:',
        brevoMessageId || '(no messageId in response)'
      );
    } catch (alertErr) {
      emailStatus = 'failed';
      console.error('[webhook] Brevo send failed — check BREVO_API_KEY, BREVO_FROM_EMAIL (verified sender), and Brevo logs.', alertErr);
    }
  }

  return {
    status: 200,
    json: {
      ok: true,
      ...(webhookDebug() && {
        _debug: {
          lead_id: lead.id,
          email: emailStatus,
          brevo_message_id: brevoMessageId
        }
      })
    }
  };
}

