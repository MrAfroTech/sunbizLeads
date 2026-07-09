import brevoTemplates from '../config/brevo-templates.json' with { type: 'json' };
import { sendWithTemplate } from './_shared/brevo.ts';
import { requireEnv } from './_shared/env.ts';
import { createAdminClient } from './_shared/supabase-admin.ts';

type LeadRow = {
  id: string;
  email: string | null;
  name: string | null;
  emails_sent?: number | null;
};

function cutoffIsoUtc (elapsedDaysFromCreation: number): string {
  const msPerDay = 24 * 60 * 60 * 1000;
  return new Date(Date.now() - elapsedDaysFromCreation * msPerDay).toISOString();
}

function coerceText (v: string | null | undefined): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s === '' ? undefined : s;
}

/**
 * Sends Emails 2–4 strictly after elapsed days from `created_at`, using `email_N_template_id`.
 * Rows are keyed by `emails_sent` progression (1→2→3→4); no duplicate sends.
 */
export async function handler (req: Request): Promise<Response> {
  const corsHeaders: Record<string, string> = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers':
      'authorization, x-client-info, apikey, content-type',
    'access-control-max-age': '86400',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const apiKey = requireEnv('BREVO_API_KEY');
    const admin = createAdminClient();

    type TemplateKey = keyof typeof brevoTemplates;
    type JobSpec = {
      currentSentCount: number;
      minElapsedDaysFromCreation: number;
      stageLabel: string;
      templateField: TemplateKey;
    };

    const jobs: JobSpec[] = [{
      currentSentCount: 1,
      minElapsedDaysFromCreation: 2,
      stageLabel: 'email_2_sent',
      templateField: 'email_2_template_id',
    }, {
      currentSentCount: 2,
      minElapsedDaysFromCreation: 4,
      stageLabel: 'email_3_sent',
      templateField: 'email_3_template_id',
    }, {
      currentSentCount: 3,
      minElapsedDaysFromCreation: 6,
      stageLabel: 'email_4_sent',
      templateField: 'email_4_template_id',
    }];

    const totals: Record<number, number> = { 2: 0, 3: 0, 4: 0 };

    for (const job of jobs) {
      const cutoff = cutoffIsoUtc(job.minElapsedDaysFromCreation);
      const { data: batch, error: qErr } = await admin
        .from('scan_and_scale_click_events')
        .select('id,email,name,emails_sent,created_at')
        .eq('emails_sent', job.currentSentCount)
        .lte('created_at', cutoff);

      if (qErr) throw qErr;

      const templateIdRaw = Number(brevoTemplates[job.templateField]);
      if (!templateIdRaw || templateIdRaw <= 0) {
        console.warn('[send-followup-emails]', job.templateField, 'not configured; skipping cohort');
        continue;
      }

      for (const row of (batch ?? []) as LeadRow[]) {
        /* Defensive guards — avoids race/retry edge cases against spec. */
        if (typeof row.emails_sent === 'number' && row.emails_sent !== job.currentSentCount) {
          continue;
        }

        const nextCount = job.currentSentCount + 1;
        const email = coerceText(row.email ?? undefined);
        if (!email || !row.id) continue;

        await sendWithTemplate(apiKey, {
          templateId: templateIdRaw,
          leadEmail: email,
          leadName: coerceText(row.name ?? undefined),
        });

        const { error } = await admin
          .from('scan_and_scale_click_events')
          .update({
            emails_sent: nextCount,
            funnel_stage: job.stageLabel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)
          .eq('emails_sent', job.currentSentCount);

        if (error) throw error;

        totals[nextCount] = (totals[nextCount] ?? 0) + 1;
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      sent: totals,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : String(err ?? 'unknown error');

    console.error('[send-followup-emails]', message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
}
