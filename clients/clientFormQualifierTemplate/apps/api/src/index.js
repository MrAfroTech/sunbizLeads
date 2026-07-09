import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';

import { getEnv } from './lib/env.js';
import { createSupabaseAdmin } from './lib/supabase.js';
import { sendBrevoEmail } from './providers/email/brevo.js';
import { createSmsProvider } from './providers/sms/index.js';
import { verifyTypeformSignature } from './lib/typeform-verify.js';
import { extractBudgetAndTimeline } from './lib/typeform-extract.js';
import { computeTier } from './lib/scoring.js';

const app = express();
app.use(morgan('tiny'));
app.use(express.json({ limit: '2mb' }));

const supabase = createSupabaseAdmin();
const sms = createSmsProvider();

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/leads/intake', async (req, res) => {
  const { first_name, last_name, email, sms: smsNumber } = req.body ?? {};

  if (!first_name || !last_name) {
    return res.status(400).json({ ok: false, error: 'first_name and last_name are required' });
  }
  if (!email && !smsNumber) {
    return res.status(400).json({ ok: false, error: 'email or sms is required' });
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      first_name,
      last_name,
      email: email || null,
      sms: smsNumber || null
    })
    .select('*')
    .single();

  if (error) return res.status(500).json({ ok: false, error: error.message });

  const typeformUrl = getEnv('TYPEFORM_FORM_URL');

  if (email) {
    await sendBrevoEmail({
      toEmail: email,
      toName: `${first_name} ${last_name}`.trim(),
      subject: 'Quick 2-question follow-up',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
          <p>Hi ${first_name},</p>
          <p>Can you answer two quick questions so we can help faster?</p>
          <p><a href="${typeformUrl}" target="_blank" rel="noreferrer">Open the survey</a></p>
        </div>
      `
    });
  } else if (smsNumber) {
    await sms.sendSms({
      to: smsNumber,
      body: `Quick 2-question survey: ${typeformUrl}`
    });
  }

  return res.json({ ok: true, lead });
});

// We need raw body for Typeform signature verification, so use a custom raw collector for this route.
app.post(
  '/webhooks/typeform',
  express.raw({ type: '*/*', limit: '5mb' }),
  async (req, res) => {
    const secret = getEnv('TYPEFORM_WEBHOOK_SECRET');
    const signature = req.header('Typeform-Signature');
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');

    const valid = verifyTypeformSignature({
      secret,
      rawBodyBuffer: rawBody,
      signatureHeader: signature
    });

    if (!valid) return res.status(401).json({ ok: false });

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).json({ ok: false, error: 'invalid_json' });
    }

    // Associate to a lead:
    // - preferred: pass `lead_id` as a hidden field in Typeform (recommended)
    // - fallback: match on respondent email if present
    const hidden = payload?.form_response?.hidden ?? {};
    const leadIdFromHidden = hidden.lead_id || hidden.leadId || hidden.lead;

    let lead = null;
    if (leadIdFromHidden) {
      const { data, error } = await supabase.from('leads').select('*').eq('id', leadIdFromHidden).single();
      if (error) return res.status(400).json({ ok: false, error: 'lead_not_found' });
      lead = data;
    } else {
      const respondentEmail = payload?.form_response?.hidden?.email || payload?.form_response?.answers?.find((a) => a.type === 'email')?.email;
      if (respondentEmail) {
        const { data } = await supabase
          .from('leads')
          .select('*')
          .eq('email', respondentEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        lead = data ?? null;
      }
      if (!lead) return res.status(400).json({ ok: false, error: 'lead_association_failed' });
    }

    const { budgetRaw, purchaseTimelineRaw } = extractBudgetAndTimeline(payload);
    const { budget, purchaseTimelineNormalized, urgencyTier } = computeTier({
      budgetRaw,
      purchaseTimelineRaw
    });

    const submittedAtIso = payload?.form_response?.submitted_at;

    const { error: respErr } = await supabase.from('lead_responses').insert({
      lead_id: lead.id,
      budget,
      purchase_timeline: purchaseTimelineRaw || purchaseTimelineNormalized,
      urgency_tier: urgencyTier,
      submitted_at: submittedAtIso ? new Date(submittedAtIso).toISOString() : new Date().toISOString(),
      raw_typeform: payload
    });
    if (respErr) return res.status(500).json({ ok: false, error: respErr.message });

    if (urgencyTier === 'TIER_1_HIGH') {
      const salesEmail = getEnv('SALES_ALERT_EMAIL');
      const salesPhone = process.env.SALES_ALERT_PHONE || '';

      const alertHtml = `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 8px 0">Tier 1 High Urgency Lead</h2>
          <p><b>Name:</b> ${lead.first_name} ${lead.last_name}</p>
          <p><b>Email:</b> ${lead.email || ''}</p>
          <p><b>SMS:</b> ${lead.sms || ''}</p>
          <hr/>
          <p><b>Budget:</b> ${budgetRaw || (budget == null ? '' : `$${budget}/mo`)}</p>
          <p><b>Timeline:</b> ${purchaseTimelineRaw || purchaseTimelineNormalized}</p>
          <p><b>Urgency Tier:</b> ${urgencyTier}</p>
        </div>
      `;

      await sendBrevoEmail({
        toEmail: salesEmail,
        toName: 'Sales',
        subject: `Tier 1 Lead: ${lead.first_name} ${lead.last_name}`,
        html: alertHtml
      });

      if (salesPhone) {
        await sms.sendSms({
          to: salesPhone,
          body: `TIER 1 LEAD: ${lead.first_name} ${lead.last_name} | ${lead.email || ''} | ${lead.sms || ''} | Budget: ${budgetRaw || budget || ''} | Timeline: ${purchaseTimelineRaw || purchaseTimelineNormalized}`
        });
      }
    }

    return res.json({ ok: true });
  }
);

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`[api] listening on ${port}`);
});

