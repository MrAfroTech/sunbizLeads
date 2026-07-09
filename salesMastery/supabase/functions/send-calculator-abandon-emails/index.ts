import { sendWithTemplate } from '../_shared/brevo.ts';
import { enrollEligibleCalculatorAbandons } from '../_shared/calculator-abandon.ts';
import { requireEnv } from '../_shared/env.ts';
import {
  ABANDON_ENGINE_VERSION,
  ABANDON_FUNNEL_STAGES,
  ABANDON_TEMPLATE_IDS,
  isActiveLeadFunnelRow,
} from '../_shared/funnelStages.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

const corsHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-max-age': '86400',
};

type AbandonRow = {
  id: string;
  email: string | null;
  name: string | null;
  emails_sent?: number | null;
  funnel_stage?: string | null;
  engine_version?: string | null;
  phone?: string | null;
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
  finalStage?: string;
};

const JOBS: JobSpec[] = [
  {
    currentSentCount: 0,
    minElapsedDaysFromCreation: 0,
    stageLabel: ABANDON_FUNNEL_STAGES.EMAIL_1_SENT,
    templateId: ABANDON_TEMPLATE_IDS.email_1,
  },
  {
    currentSentCount: 1,
    minElapsedDaysFromCreation: 2,
    stageLabel: ABANDON_FUNNEL_STAGES.EMAIL_2_SENT,
    templateId: ABANDON_TEMPLATE_IDS.email_2,
  },
  {
    currentSentCount: 2,
    minElapsedDaysFromCreation: 4,
    stageLabel: ABANDON_FUNNEL_STAGES.EMAIL_3_SENT,
    templateId: ABANDON_TEMPLATE_IDS.email_3,
  },
  {
    currentSentCount: 3,
    minElapsedDaysFromCreation: 6,
    stageLabel: ABANDON_FUNNEL_STAGES.EMAIL_4_SENT,
    templateId: ABANDON_TEMPLATE_IDS.email_4,
    finalStage: ABANDON_FUNNEL_STAGES.COMPLETED,
  },
];

async function processAbandonSends(
  apiKey: string,
): Promise<{ sent: Record<number, number>; cancelled: number }> {
  const admin = createAdminClient();
  const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let cancelled = 0;

  for (const job of JOBS) {
    const cutoff = cutoffIsoUtc(job.minElapsedDaysFromCreation);
    const { data: batch, error: qErr } = await admin
      .from('scan_and_scale_click_events')
      .select('id,email,name,emails_sent,created_at,funnel_stage,engine_version,phone')
      .eq('engine_version', ABANDON_ENGINE_VERSION)
      .eq('emails_sent', job.currentSentCount)
      .lte('created_at', cutoff);

    if (qErr) throw qErr;

    for (const row of (batch ?? []) as AbandonRow[]) {
      if (typeof row.emails_sent === 'number' && row.emails_sent !== job.currentSentCount) {
        continue;
      }

      const email = coerceText(row.email ?? undefined);
      if (!email || !row.id) continue;

      const { data: fresh, error: freshErr } = await admin
        .from('scan_and_scale_click_events')
        .select('id,engine_version,emails_sent,funnel_stage,phone')
        .eq('id', row.id)
        .maybeSingle();

      if (freshErr) throw freshErr;

      if (
        !fresh ||
        fresh.engine_version !== ABANDON_ENGINE_VERSION ||
        (typeof fresh.phone === 'string' && fresh.phone.trim().length > 0) ||
        isActiveLeadFunnelRow(fresh)
      ) {
        if (fresh?.id && fresh.engine_version === ABANDON_ENGINE_VERSION) {
          await admin
            .from('scan_and_scale_click_events')
            .update({
              engine_version: 'v2',
              funnel_stage: ABANDON_FUNNEL_STAGES.EXITED,
              updated_at: new Date().toISOString(),
            })
            .eq('id', fresh.id);
        }
        cancelled += 1;
        continue;
      }

      const nextCount = job.currentSentCount + 1;

      await sendWithTemplate(apiKey, {
        templateId: job.templateId,
        leadEmail: email,
        leadName: coerceText(row.name ?? undefined),
      });

      const nextStage = job.finalStage ?? job.stageLabel;
      const { error } = await admin
        .from('scan_and_scale_click_events')
        .update({
          emails_sent: nextCount,
          funnel_stage: nextStage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .eq('emails_sent', job.currentSentCount)
        .eq('engine_version', ABANDON_ENGINE_VERSION);

      if (error) throw error;
      totals[nextCount] = (totals[nextCount] ?? 0) + 1;
    }
  }

  return { sent: totals, cancelled };
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
    const admin = createAdminClient();

    const enrollment = await enrollEligibleCalculatorAbandons(admin);
    const sends = await processAbandonSends(apiKey);

    return new Response(
      JSON.stringify({
        ok: true,
        enrollment,
        sent: sends.sent,
        cancelled: sends.cancelled,
      }),
      { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'unknown error');
    console.error('[send-calculator-abandon-emails]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
