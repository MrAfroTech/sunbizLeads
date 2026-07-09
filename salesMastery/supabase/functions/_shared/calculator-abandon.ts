import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import {
  ABANDON_ENGINE_VERSION,
  ABANDON_ENROLLMENT_GRACE_HOURS,
  ABANDON_FUNNEL_STAGES,
  CALCULATOR_PAGE_KEYS,
  isActiveAbandonFunnelRow,
  isActiveLeadFunnelRow,
  type ScanScaleRow,
} from './funnelStages.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function coerceText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function normalizeEmail(value: unknown): string | undefined {
  const text = coerceText(value);
  return text ? text.toLowerCase() : undefined;
}

type VisitRow = {
  id: string;
  email: string | null;
  name: string | null;
  page_key: string | null;
  path: string | null;
  created_at: string;
};

export async function fetchScanRowByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<(ScanScaleRow & { id?: string; email?: string }) | null> {
  const { data, error } = await admin
    .from('scan_and_scale_click_events')
    .select('id,email,engine_version,emails_sent,funnel_stage,phone')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function enrollEligibleCalculatorAbandons(
  admin: SupabaseClient,
): Promise<{ enrolled: number; skipped: number }> {
  const graceMs = ABANDON_ENROLLMENT_GRACE_HOURS * 60 * 60 * 1000;
  const graceCutoff = new Date(Date.now() - graceMs).toISOString();

  const { data: visits, error: visitErr } = await admin
    .from('calculator_page_visits')
    .select('id,email,name,page_key,path,created_at')
    .not('email', 'is', null)
    .lte('created_at', graceCutoff)
    .in('page_key', [...CALCULATOR_PAGE_KEYS])
    .order('created_at', { ascending: false });

  if (visitErr) throw visitErr;

  const latestVisitByEmail = new Map<string, VisitRow>();
  for (const visit of (visits ?? []) as VisitRow[]) {
    const email = normalizeEmail(visit.email);
    if (!email || !EMAIL_RE.test(email)) continue;
    if (!latestVisitByEmail.has(email)) {
      latestVisitByEmail.set(email, visit);
    }
  }

  let enrolled = 0;
  let skipped = 0;

  for (const [email, visit] of latestVisitByEmail) {
    const existing = await fetchScanRowByEmail(admin, email);

    if (isActiveLeadFunnelRow(existing)) {
      skipped += 1;
      continue;
    }

    if (isActiveAbandonFunnelRow(existing)) {
      skipped += 1;
      continue;
    }

    if (existing?.engine_version === 'v2') {
      skipped += 1;
      continue;
    }

    if (
      existing?.engine_version === 'v1' &&
      typeof existing.emails_sent === 'number' &&
      existing.emails_sent >= 1
    ) {
      skipped += 1;
      continue;
    }

    const now = new Date().toISOString();
    const enrollPatch = {
      email,
      name: coerceText(visit.name),
      engine_version: ABANDON_ENGINE_VERSION,
      lead_source: visit.page_key ?? 'calculator_abandon',
      last_click_path: coerceText(visit.path)?.slice(0, 2000) ?? null,
      last_click_at: visit.created_at,
      emails_sent: 0,
      funnel_stage: ABANDON_FUNNEL_STAGES.ENROLLED,
      updated_at: now,
    };

    if (existing?.id) {
      const { error: updateErr } = await admin
        .from('scan_and_scale_click_events')
        .update(enrollPatch)
        .eq('id', existing.id);

      if (updateErr) {
        console.warn('[calculator-abandon] enroll update failed', email, updateErr.message);
        skipped += 1;
        continue;
      }

      enrolled += 1;
      continue;
    }

    const { error: insertErr } = await admin.from('scan_and_scale_click_events').insert({
      ...enrollPatch,
      created_at: now,
    });

    if (insertErr) {
      console.warn('[calculator-abandon] enroll insert failed', email, insertErr.message);
      skipped += 1;
      continue;
    }

    enrolled += 1;
  }

  return { enrolled, skipped };
}

/** Payload fields applied when a visitor converts from abandonment to a real lead. */
export function leadCaptureExitAbandonPayload(): Record<string, unknown> {
  return {
    engine_version: 'v2',
    funnel_stage: ABANDON_FUNNEL_STAGES.EXITED,
    emails_sent: 0,
  };
}
