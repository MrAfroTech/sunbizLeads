import { sendWithTemplate } from '../_shared/brevo.ts';
import { requireEnv } from '../_shared/env.ts';
import {
  calculatorFieldsFromRow,
  toBrevoContactAttributes,
} from '../_shared/lead-calculator-fields.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

const corsHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-max-age': '86400',
};

const TEMPLATE_IDS = {
  email_2: 138,
  email_3: 139,
  email_4: 140,
} as const;

type LeadRow = {
  id: string;
  email: string | null;
  name: string | null;
  emails_sent?: number | null;
  estimated_loss?: string | null;
  avg_wait_time?: string | null;
  primary_friction_zone?: string | null;
};

function cutoffIsoUtc(elapsedDaysFromCreation: number): string {
  const msPerDay = 24 * 60 * 60 * 1000;
  return new Date(Date.now() - elapsedDaysFromCreation * msPerDay).toISOString();
}

function coerceText(v: string | null | undefined): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s === '' ? undefined : s;
}

type JobSpec = {
  currentSentCount: number;
  minElapsedDaysFromCreation: number;
  stageLabel: string;
  templateId: number;
};

const JOBS: JobSpec[] = [
  { currentSentCount: 1, minElapsedDaysFromCreation: 2, stageLabel: 'email_2_sent', templateId: TEMPLATE_IDS.email_2 },
  { currentSentCount: 2, minElapsedDaysFromCreation: 4, stageLabel: 'email_3_sent', templateId: TEMPLATE_IDS.email_3 },
  { currentSentCount: 3, minElapsedDaysFromCreation: 6, stageLabel: 'email_4_sent', templateId: TEMPLATE_IDS.email_4 },
];

async function fetchLeadForSend(admin: ReturnType<typeof createAdminClient>, leadId: string) {
  const { data, error } = await admin
    .from('scan_and_scale_click_events')
    .select('id,email,name,emails_sent,estimated_loss,avg_wait_time,primary_friction_zone')
    .eq('id', leadId)
    .maybeSingle();

  if (error) throw error;
  return data as LeadRow | null;
}

async function processCohort(
  engineVersion: 'v1' | 'v2',
  apiKey: string,
): Promise<{ sent: Record<number, number>; deferred: number }> {
  const admin = createAdminClient();
  const totals: Record<number, number> = { 2: 0, 3: 0, 4: 0 };
  let deferred = 0;

  for (const job of JOBS) {
    const cutoff = cutoffIsoUtc(job.minElapsedDaysFromCreation);
    const { data: batch, error: qErr } = await admin
      .from('scan_and_scale_click_events')
      .select('id,email,name,emails_sent,created_at')
      .eq('engine_version', engineVersion)
      .eq('emails_sent', job.currentSentCount)
      .lte('created_at', cutoff);

    if (qErr) throw qErr;

    for (const row of (batch ?? []) as LeadRow[]) {
      if (typeof row.emails_sent === 'number' && row.emails_sent !== job.currentSentCount) {
        continue;
      }

      const nextCount = job.currentSentCount + 1;
      const email = coerceText(row.email ?? undefined);
      if (!email || !row.id) continue;

      const lead = await fetchLeadForSend(admin, row.id);
      if (!lead) continue;

      const calculatorFields = calculatorFieldsFromRow(lead);
      if (!calculatorFields) {
        console.warn(
          '[send-followup-emails] deferring send — missing calculator fields',
          { leadId: row.id, templateId: job.templateId },
        );
        deferred += 1;
        continue;
      }

      const contactAttributes = toBrevoContactAttributes(
        calculatorFields,
        coerceText(lead.name ?? undefined),
      );

      await sendWithTemplate(apiKey, {
        templateId: job.templateId,
        leadEmail: email,
        leadName: coerceText(lead.name ?? undefined),
        contactAttributes,
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

  return { sent: totals, deferred };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const apiKey = requireEnv('BREVO_API_KEY');
    const v1 = await processCohort('v1', apiKey);
    const v2 = await processCohort('v2', apiKey);

    return new Response(
      JSON.stringify({
        ok: true,
        sent: { v1: v1.sent, v2: v2.sent },
        deferred: { v1: v1.deferred, v2: v2.deferred },
      }),
      { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'unknown error');
    console.error('[send-followup-emails]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
