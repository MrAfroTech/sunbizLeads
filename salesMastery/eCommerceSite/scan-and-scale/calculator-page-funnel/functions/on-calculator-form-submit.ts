import brevoTemplates from '../config/brevo-templates.json' with { type: 'json' };
import settings from '../config/settings.json' with { type: 'json' };
import {
  type BrevoSenderResolved,
  getDefaultSender,
  getTemplateDetail,
  sendTransactionalHtml,
} from './_shared/brevo.ts';
import { requireEnv } from './_shared/env.ts';
import { createAdminClient } from './_shared/supabase-admin.ts';

type VisitPayload = Record<string, unknown>;

function parseWebhookRecord (payload: unknown): VisitPayload | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const obj = payload as Record<string, unknown>;

  if (obj.table === 'calculator_page_visits' && typeof obj.record === 'object' && obj.record !== null) {
    return obj.record as VisitPayload;
  }

  if (typeof obj.record === 'object' && obj.record !== null) {
    return obj.record as VisitPayload;
  }

  /* Manual invoke — body is row itself */
  if ('email' in obj && 'id' in obj) return obj as VisitPayload;

  return null;
}

async function reloadVisitRow (id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('calculator_page_visits')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as VisitPayload | null;
}

function coerceText (value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t === '' ? undefined : t;
}

function isoFromRow (createdAt: unknown): string {
  if (typeof createdAt === 'string' && createdAt.trim()) return createdAt;
  return new Date().toISOString();
}

function buildOwnerNotificationHtml (lead: VisitPayload): string {
  const name = coerceText(lead.name);
  const email = coerceText(lead.email) ?? '';
  const phone = coerceText(lead.phone);
  const company = coerceText(lead.company);
  const campaign = coerceText(lead.last_click_campaign);
  const created = isoFromRow(lead.created_at);

  const prominentPhone = phone
    ? `
    <div style="font-size:20px;font-weight:700;color:#111;margin:14px 0;padding:14px;background:#fef9e7;border-radius:8px;">
      📞 Phone (on file): <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>
    </div>
    <p style="margin:16px 0;font-size:16px;font-weight:700;color:#0a6847;">
      📞 CALL TASK CREATED — phone number on file
    </p>`
    : '<p style="margin:14px 0;color:#444;">📞 Phone: <em>(not on file)</em></p>';

  return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#222;">
  <h2>New Scan &amp; Scale lead notification</h2>
  ${name ? `<p><strong>Name:</strong> ${escapeHtml(name)}</p>` : ''}
  <p><strong>Email:</strong> ${escapeHtml(email)}</p>
  ${prominentPhone}
  ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ''}
  <p><strong>Campaign:</strong> ${campaign ? escapeHtml(campaign) : '<em>n/a</em>'}</p>
  <p><strong>Lead record timestamp:</strong> ${escapeHtml(created)}</p>
</body></html>`;
}

function escapeHtml (s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;' }[c] ?? c));
}

function phonePresent (phone: unknown): boolean {
  return typeof phone === 'string' && phone.trim().length > 0;
}

/**
 * Skip legacy 149–152 automation when unified v2 owns the lead, or when legacy is disabled.
 * In-flight legacy sequences (emails_sent 1–3) continue via send-calculator-followup-emails cron only.
 */
async function shouldSkipLegacyCalculatorAutomation (
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<{ skip: boolean; reason?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: v2Lead, error } = await admin
    .from('scan_and_scale_click_events')
    .select('id')
    .eq('email', normalizedEmail)
    .eq('engine_version', 'v2')
    .limit(1)
    .maybeSingle();

  if (!error && v2Lead?.id) {
    return { skip: true, reason: 'unified_v2_lead_active' };
  }

  if (Deno.env.get('LEGACY_CALCULATOR_AUTOMATION_ENABLED') !== 'true') {
    return { skip: true, reason: 'legacy_calculator_automation_disabled' };
  }

  return { skip: false };
}

/**
 * Calculator form POST → load existing calculator_page_visits row by id → automation → follow_up_tasks.
 */
export async function handler (req: Request): Promise<Response> {
  const corsHeaders: Record<string, string> = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers':
      'authorization, x-client-info, apikey, content-type',
    'access-control-max-age': '86400',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  let visitIdSummary: string | null = null;
  let followUpTaskId: string | null = null;

  try {
    const payload = await req.json();
    const record = parseWebhookRecord(payload);

    const idRaw = typeof record?.id === 'string' ? record.id.trim() : '';
    const email = coerceText(record?.email);
    visitIdSummary = idRaw || null;

    if (!idRaw || !email || !record) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing id or email on calculator page visit payload' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    const apiKey = requireEnv('BREVO_API_KEY');
    const admin = createAdminClient();

    let cachedDefaultSender: BrevoSenderResolved | null = null;
    async function resolveDefaultSender (): Promise<BrevoSenderResolved> {
      if (!cachedDefaultSender) cachedDefaultSender = await getDefaultSender(apiKey);
      return cachedDefaultSender;
    }

    function normalizeSender (s: Partial<BrevoSenderResolved> | null | undefined): BrevoSenderResolved | null {
      const ex = coerceText(typeof s?.email === 'string' ? s.email : '');
      if (!ex) return null;
      const nm = coerceText(typeof s?.name === 'string' ? s.name : '');
      return nm ? { email: ex, name: nm } : { email: ex };
    }

    const existing = await reloadVisitRow(idRaw);
    if (!existing) {
      return new Response(
        JSON.stringify({ success: false, error: `Calculator page visit not found: ${idRaw}` }),
        { status: 404, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    const legacySkip = await shouldSkipLegacyCalculatorAutomation(admin, email);
    if (legacySkip.skip) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: legacySkip.reason,
          click_event_id: idRaw,
        }),
        { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    /* ---- Step A — owner notification ---------------------------------- */
    {
      let row = await reloadVisitRow(idRaw);
      if (!row) throw new Error('Calculator page visit row vanished before notification step.');
      if (row.notification_sent !== true) {
        const displayName = coerceText(row.name);

        await sendTransactionalHtml({
          apiKey,
          sender: await resolveDefaultSender(),
          toEmail: settings.owner_notification_email,
          subject: `🔔 New Scan & Scale Lead: ${displayName ?? email}`,
          htmlBody: buildOwnerNotificationHtml(row),
        });

        const { error } = await admin
          .from('calculator_page_visits')
          .update({
            notification_sent: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', idRaw);

        if (error) throw error;
      }
    }

    /* ---- Step B — Email 1 (send transactional HTML as-is) */
    {
      const row = await reloadVisitRow(idRaw);
      if (!row) throw new Error('Calculator page visit row vanished before Email 1 step.');
      const sentCount = typeof row.emails_sent === 'number' ? row.emails_sent : 0;
      if (sentCount < 1) {
        const tid = Number(brevoTemplates.email_1_template_id);
        if (!tid || tid === 0) {
          throw new Error('Configure email_1_template_id in config/brevo-templates.json');
        }

        const detail = await getTemplateDetail(apiKey, tid);
        const tplHtml =
          typeof detail.htmlContent === 'string' && detail.htmlContent.trim().length > 0
            ? detail.htmlContent
            : '';

        if (!tplHtml) {
          throw new Error(`Brevo template ${tid} missing htmlContent; cannot render Email 1 in runtime.`);
        }

        const sendSubject =
          typeof detail.subject === 'string' && detail.subject.trim().length > 0
            ? detail.subject.trim()
            : 'Your concession lines are deciding how much your fans spend.';

        await sendTransactionalHtml({
          apiKey,
          sender: normalizeSender(detail.sender) ?? await resolveDefaultSender(),
          toEmail: email,
          toName: coerceText(row.name),
          subject: sendSubject,
          htmlBody: tplHtml,
        });

        const { error } = await admin
          .from('calculator_page_visits')
          .update({
            emails_sent: 1,
            funnel_stage: 'email_1_sent',
            updated_at: new Date().toISOString(),
          })
          .eq('id', idRaw);

        if (error) throw error;
      }
    }

    /* ---- Step C — follow_up_tasks ------------------------------------- */
    {
      const row = await reloadVisitRow(idRaw);
      if (!row) throw new Error('Calculator page visit row vanished before follow-up task step.');

      if (phonePresent(row.phone) && row.call_task_created !== true) {
        console.log('[on-calculator-form-submit] creating follow up task', {
          calculator_page_visit_id: idRaw,
        });

        const { data: taskRow, error: insErr } = await admin
          .from('follow_up_tasks')
          .insert({
            calculator_visit_id: idRaw,
            email,
            name: coerceText(row.name),
            phone: coerceText(row.phone),
            company: coerceText(row.company),
            task_type: 'call',
            status: 'pending',
            notes:
              'Calculator form submission. Phone on file. Call to qualify for DFY consultation.',
          })
          .select('id')
          .single();

        if (insErr) {
          console.error('[on-calculator-form-submit] follow up task insert failed', {
            calculator_page_visit_id: idRaw,
            error: insErr.message,
            code: insErr.code,
          });
          throw insErr;
        }

        followUpTaskId = taskRow?.id != null ? String(taskRow.id) : null;

        console.log('[on-calculator-form-submit] follow up task created', {
          calculator_page_visit_id: idRaw,
          follow_up_task_id: followUpTaskId,
        });

        const { error: flagErr } = await admin
          .from('calculator_page_visits')
          .update({
            call_task_created: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', idRaw);

        if (flagErr) throw flagErr;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        click_event_id: idRaw,
        follow_up_task_id: followUpTaskId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      },
    );
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object'
        ? JSON.stringify(err)
        : String(err ?? 'unknown error');

    console.error('[on-calculator-form-submit]', message, {
      calculator_page_visit_id: visitIdSummary,
    });

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      },
    );
  }
}
