import {
  getDefaultSender,
  getTemplateDetail,
  sendTransactionalHtml,
  sendWithTemplate,
  stripBookingCtaFromEmailOneHtml,
  type BrevoSenderResolved,
} from '../_shared/brevo.ts';
import { requireEnv } from '../_shared/env.ts';
import {
  calculatorFieldsFromRow,
  calculatorOutputFromRow,
  toBrevoContactAttributes,
} from '../_shared/lead-calculator-fields.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

const OWNER_EMAIL = 'team@seamlessly.us';
const EMAIL_1_TEMPLATE_ID = 137;
const DOWNLOAD_TEMPLATE_ID = 194;

const corsHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-max-age': '86400',
};

type LeadPayload = Record<string, unknown>;

function parsePayload(payload: unknown): {
  leadId: string;
  email: string;
  name?: string;
  phone?: string;
  source?: string;
  sessionId?: string;
} | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const obj = payload as Record<string, unknown>;

  let record: LeadPayload | null = null;
  if (obj.table === 'scan_and_scale_click_events' && typeof obj.record === 'object' && obj.record !== null) {
    record = obj.record as LeadPayload;
  } else if (typeof obj.record === 'object' && obj.record !== null) {
    record = obj.record as LeadPayload;
  } else if ('lead_id' in obj || 'id' in obj) {
    record = obj as LeadPayload;
  }

  if (!record) return null;

  const leadIdRaw = typeof record.lead_id === 'string'
    ? record.lead_id.trim()
    : typeof record.id === 'string'
    ? record.id.trim()
    : '';
  const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';
  if (!leadIdRaw || !email) return null;

  const name = typeof record.name === 'string' ? record.name.trim() : undefined;
  const phone = typeof record.phone === 'string' ? record.phone.trim() : undefined;
  const source = typeof record.source === 'string'
    ? record.source.trim()
    : typeof record.lead_source === 'string'
    ? record.lead_source.trim()
    : undefined;

  const sessionId = typeof record.session_id === 'string'
    ? record.session_id.trim()
    : typeof (payload as Record<string, unknown>).session_id === 'string'
    ? String((payload as Record<string, unknown>).session_id).trim()
    : undefined;

  return { leadId: leadIdRaw, email, name, phone, source, sessionId };
}

function coerceText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t === '' ? undefined : t;
}

function phonePresent(phone: unknown): boolean {
  return typeof phone === 'string' && phone.trim().length > 0;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;' }[c] ?? c
  ));
}

function buildOwnerNotificationHtml(lead: LeadPayload): string {
  const name = coerceText(lead.name);
  const email = coerceText(lead.email) ?? '';
  const phone = coerceText(lead.phone);
  const campaign = coerceText(lead.last_click_campaign) ?? coerceText(lead.lead_source);
  const created = typeof lead.created_at === 'string' ? lead.created_at : new Date().toISOString();

  const prominentPhone = phone
    ? `<div style="font-size:20px;font-weight:700;color:#111;margin:14px 0;padding:14px;background:#fef9e7;border-radius:8px;">
      Phone: <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>
    </div>`
    : '<p style="margin:14px 0;color:#444;">Phone: <em>(not on file)</em></p>';

  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#222;">
  <h2>New Seamlessly lead</h2>
  ${name ? `<p><strong>Name:</strong> ${escapeHtml(name)}</p>` : ''}
  <p><strong>Email:</strong> ${escapeHtml(email)}</p>
  ${prominentPhone}
  <p><strong>Source:</strong> ${campaign ? escapeHtml(campaign) : '<em>n/a</em>'}</p>
  <p><strong>Timestamp:</strong> ${escapeHtml(created)}</p>
</body></html>`;
}

async function linkOrphanLeadEvents(
  admin: ReturnType<typeof createAdminClient>,
  leadId: string,
  email: string,
  sessionId?: string,
): Promise<void> {
  if (sessionId) {
    const { error: sessionErr } = await admin
      .from('lead_events')
      .update({ lead_id: leadId, email })
      .eq('session_id', sessionId)
      .is('lead_id', null);
    if (sessionErr) throw sessionErr;
  }

  const { error: emailErr } = await admin
    .from('lead_events')
    .update({ lead_id: leadId })
    .eq('email', email)
    .is('lead_id', null);
  if (emailErr) throw emailErr;
}

async function callScoreLead(leadId: string): Promise<{ intent_score: number; intent_tier: string }> {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(`${supabaseUrl}/functions/v1/score-lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ lead_id: leadId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : res.statusText);
  }
  return {
    intent_score: typeof body.intent_score === 'number' ? body.intent_score : 0,
    intent_tier: typeof body.intent_tier === 'string' ? body.intent_tier : 'COLD',
  };
}

async function reloadLeadRow(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('scan_and_scale_click_events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as LeadPayload | null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const parsed = parsePayload(payload);
    if (!parsed) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const { leadId, email } = parsed;

    let row = await reloadLeadRow(leadId);
    if (!row) throw new Error('Lead row not found');

    if (row.engine_version !== 'v2') {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: row.engine_version === 'v2_abandon' ? 'abandon_funnel_row' : 'not_v2_lead',
        }),
        { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    const admin = createAdminClient();
    const apiKey = requireEnv('BREVO_API_KEY');

    await linkOrphanLeadEvents(admin, leadId, email, parsed.sessionId);

    let cachedSender: BrevoSenderResolved | null = null;
    async function resolveSender(): Promise<BrevoSenderResolved> {
      if (!cachedSender) cachedSender = await getDefaultSender(apiKey);
      return cachedSender;
    }

    const scoreResult = await callScoreLead(leadId);

    row = await reloadLeadRow(leadId);
    if (!row) throw new Error('Lead row not found');

    if (row.notification_sent !== true) {
      const displayName = coerceText(row.name) ?? parsed.name;
      await sendTransactionalHtml({
        apiKey,
        sender: await resolveSender(),
        toEmail: OWNER_EMAIL,
        subject: `🔔 New Seamlessly Lead: ${displayName ?? email}`,
        htmlBody: buildOwnerNotificationHtml(row),
      });
      await admin
        .from('scan_and_scale_click_events')
        .update({ notification_sent: true, updated_at: new Date().toISOString() })
        .eq('id', leadId);
    }

    row = await reloadLeadRow(leadId);
    if (!row) throw new Error('Lead row vanished after notification');

    const calculatorFields = calculatorFieldsFromRow(row);
    if (!calculatorFields) {
      console.warn('[on-lead-submit] missing calculator fields; deferring Brevo sends', leadId);
      return new Response(
        JSON.stringify({
          success: true,
          intent_tier: scoreResult.intent_tier,
          deferred: true,
          reason: 'missing_calculator_fields',
        }),
        { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    const contactAttributes = toBrevoContactAttributes(
      calculatorFields,
      coerceText(row.name) ?? parsed.name,
    );

    const sentCount = typeof row.emails_sent === 'number' ? row.emails_sent : 0;
    if (sentCount < 1) {
      const detail = await getTemplateDetail(apiKey, EMAIL_1_TEMPLATE_ID);
      const tplHtml = typeof detail.htmlContent === 'string' ? detail.htmlContent : '';
      if (!tplHtml) {
        throw new Error(`Brevo template ${EMAIL_1_TEMPLATE_ID} missing htmlContent`);
      }
      const modified = stripBookingCtaFromEmailOneHtml(tplHtml);
      const subject = detail.subject?.trim() || 'Your concession lines are deciding how much your fans spend.';

      let sender: BrevoSenderResolved = await resolveSender();
      if (detail.sender) {
        sender = detail.sender;
      }

      await sendTransactionalHtml({
        apiKey,
        sender,
        toEmail: email,
        toName: coerceText(row.name) ?? parsed.name,
        subject,
        htmlBody: modified,
        contactAttributes,
      });

      await admin
        .from('scan_and_scale_click_events')
        .update({
          emails_sent: 1,
          funnel_stage: 'email_1_sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    }

    const displayName = coerceText(row.name) ?? parsed.name ?? '';
    await sendWithTemplate(apiKey, {
      templateId: DOWNLOAD_TEMPLATE_ID,
      leadEmail: email,
      leadName: displayName,
      templateParams: {
        FIRSTNAME: displayName,
      },
      contactAttributes,
    });

    row = await reloadLeadRow(leadId);
    if (!row) throw new Error('Lead row vanished before call task');

    const phone = coerceText(row.phone) ?? parsed.phone;
    if (phonePresent(phone) && row.call_task_created !== true) {
      const { error: insErr } = await admin.from('follow_up_tasks').insert({
        click_event_id: leadId,
        email,
        name: coerceText(row.name) ?? parsed.name,
        phone,
        company: coerceText(row.company),
        task_type: 'call',
        status: 'pending',
        notes: `Unified lead engine submit (${parsed.source ?? 'unknown source'}). Phone on file.`,
      });
      if (insErr) throw insErr;

      await admin
        .from('scan_and_scale_click_events')
        .update({ call_task_created: true, updated_at: new Date().toISOString() })
        .eq('id', leadId);
    }

    row = await reloadLeadRow(leadId);
    if (row) {
      const { error: finishedErr } = await admin.from('finished_calc_leads').upsert(
        {
          email: email,
          name: coerceText(row.name) ?? parsed.name,
          phone: coerceText(row.phone) ?? parsed.phone,
          lead_source: coerceText(row.lead_source) ?? parsed.source,
          calculator_output: calculatorOutputFromRow(row as Record<string, unknown>),
          ab_variant: coerceText(row.ab_variant) ?? undefined,
          persona: coerceText(row.persona) ?? undefined,
          ordering_method: coerceText(row.ordering_method) ?? undefined,
          lead_score:
            typeof row.lead_score === 'number' && Number.isFinite(row.lead_score)
              ? row.lead_score
              : undefined,
          intent_score: scoreResult.intent_score,
          intent_tier: scoreResult.intent_tier,
          funnel_stage: coerceText(row.funnel_stage) ?? 'email_1_sent',
          emails_sent: typeof row.emails_sent === 'number' ? row.emails_sent : 0,
          call_task_created: row.call_task_created === true,
          click_event_id: row.id,
          last_activity_at: new Date().toISOString(),
        },
        { onConflict: 'click_event_id' },
      );
      if (finishedErr) throw finishedErr;
    }

    return new Response(
      JSON.stringify({ success: true, intent_tier: scoreResult.intent_tier }),
      { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'unknown error');
    console.error('[on-lead-submit]', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
