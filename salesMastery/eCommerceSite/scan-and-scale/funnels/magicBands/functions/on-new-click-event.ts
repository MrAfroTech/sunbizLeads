import brevoTemplates from '../config/brevo-templates.json' with { type: 'json' };
import settings from '../config/settings.json' with { type: 'json' };
import {
  type BrevoSenderResolved,
  getDefaultSender,
  getTemplateDetail,
  sendTransactionalHtml,
  stripBookingCtaFromEmailOneHtml,
} from './_shared/brevo.ts';
import { requireEnv } from './_shared/env.ts';
import { createAdminClient } from './_shared/supabase-admin.ts';

type ClickPayload = Record<string, unknown>;

function parseWebhookRecord (payload: unknown): ClickPayload | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const obj = payload as Record<string, unknown>;

  if (obj.table === 'scan_and_scale_click_events' && typeof obj.record === 'object' && obj.record !== null) {
    return obj.record as ClickPayload;
  }

  if (typeof obj.record === 'object' && obj.record !== null) {
    return obj.record as ClickPayload;
  }

  /* Manual invoke — body is row itself */
  if ('email' in obj && 'id' in obj) return obj as ClickPayload;

  return null;
}

async function reloadClickRow (id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('scan_and_scale_click_events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as ClickPayload | null;
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

function buildOwnerNotificationHtml (lead: ClickPayload): string {
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
 * Handles Database Webhooks (payload includes `record`) or manual `{ ...row }` posts.
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

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  let recordSummary: Pick<ClickPayload, 'id'> | Record<string, never> | null = null;

  try {
    const payload = await req.json();
    const record = parseWebhookRecord(payload);

    const idRaw = typeof record?.id === 'string' ? record.id.trim() : '';
    const email = coerceText(record?.email);
    recordSummary = idRaw ? { id: record?.id as string } : null;

    if (!idRaw || !email || !record) {
      return new Response(
        JSON.stringify({ error: 'Missing id or email on click event payload' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    const apiKey = requireEnv('BREVO_API_KEY');
    let cachedDefaultSender: BrevoSenderResolved | null = null;
    async function resolveDefaultSender (): Promise<BrevoSenderResolved> {
      if (!cachedDefaultSender) cachedDefaultSender = await getDefaultSender(apiKey);
      return cachedDefaultSender;
    }

    function normalizeSender (s: Partial<BrevoSenderResolved> | null | undefined): BrevoSenderResolved | null {
      const ex = coerceText(typeof s?.email === 'string' ? s.email : '');
      if (!ex) return null;
      const nm = coerceText(typeof s?.name === 'string' ? s.name : '');
      return nm ? {
        email: ex,
        name: nm,
      } : {
        email: ex,
      };
    }

    const admin = createAdminClient();

    /* ---- Step A — owner notification ---------------------------------- */
    {
      let row = await reloadClickRow(idRaw);
      if (!row) throw new Error('Click event row vanished before notification step.');
      const already = row.notification_sent === true;
      if (!already) {
        const displayName = coerceText(row.name);

        await sendTransactionalHtml({
          apiKey,
          sender: await resolveDefaultSender(),
          toEmail: settings.owner_notification_email,
          subject: `🔔 New Scan & Scale Lead: ${displayName ?? email}`,
          htmlBody: buildOwnerNotificationHtml(row),
        });

        const { error } = await admin
          .from('scan_and_scale_click_events')
          .update({
            notification_sent: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', idRaw);

        if (error) throw error;
      }
    }

    /* ---- Step B — Email 1 (strip BOOK YOUR… CTA; send transactional HTML) */
    {
      const row = await reloadClickRow(idRaw);
      if (!row) throw new Error('Click event row vanished before Email 1 step.');
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
          throw new Error(`Brevo template ${tid} missing htmlContent; cannot strip/render Email 1 in runtime.`);
        }

        const modified = stripBookingCtaFromEmailOneHtml(tplHtml);

        let sendSubject = typeof detail.subject === 'string' && detail.subject.trim().length > 0
          ? detail.subject.trim()
          : 'Your concession lines are deciding how much your fans spend.';

        const sendSender =
          normalizeSender(detail.sender) ?? await resolveDefaultSender();

        await sendTransactionalHtml({
          apiKey,
          sender: sendSender,
          toEmail: email,
          toName: coerceText(row.name),
          subject: sendSubject,
          htmlBody: modified,
        });

        const { error } = await admin
          .from('scan_and_scale_click_events')
          .update({
            emails_sent: 1,
            funnel_stage: 'email_1_sent',
            updated_at: new Date().toISOString(),
          })
          .eq('id', idRaw);

        if (error) throw error;
      }
    }

    /* ---- Step D — call task -------------------------------------------- */
    {
      const row = await reloadClickRow(idRaw);
      if (!row) throw new Error('Click event row vanished before follow-up step.');
      if (phonePresent(row.phone) && row.call_task_created !== true) {
        const { error: insErr } = await admin.from('follow_up_tasks').insert({
          click_event_id: idRaw,
          email,
          name: coerceText(row.name),
          phone: coerceText(row.phone),
          company: coerceText(row.company),
          task_type: 'call',
          status: 'pending',
          notes:
            'Lead clicked Scan & Scale link. Phone on file. Call to qualify for DFY consultation.',
        });

        if (insErr) throw insErr;

        const { error } = await admin
          .from('scan_and_scale_click_events')
          .update({
            call_task_created: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', idRaw);

        if (error) throw error;
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : String(err ?? 'unknown error');

    console.error('[on-new-click-event]', message, recordSummary);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
}
