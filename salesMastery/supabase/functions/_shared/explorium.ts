import { requireEnv } from './env.ts';

const DEFAULT_BASE_URL = 'https://api.explorium.ai';

export type ExploriumMatchInput = {
  email?: string;
  full_name?: string;
  company_name?: string;
  phone_number?: string;
  linkedin?: string;
};

export type ExploriumProfile = {
  prospect_id: string;
  full_name?: string;
  job_title?: string;
  seniority_level?: string;
  linkedin_url?: string;
  company_name?: string;
};

function exploriumBaseUrl(): string {
  // Accept either https://api.explorium.ai or .../v1 — paths already include /v1/...
  return (Deno.env.get('EXPLORIUM_API_BASE_URL') || DEFAULT_BASE_URL)
    .replace(/\/$/, '')
    .replace(/\/v1$/i, '');
}

function exploriumHeaders(): HeadersInit {
  const key = requireEnv('EXPLORIUM_API_KEY');
  // Docs accept API_KEY; some clients use api_key — send both.
  return {
    API_KEY: key,
    api_key: key,
    'Content-Type': 'application/json',
  };
}

export async function matchProspect(input: ExploriumMatchInput): Promise<string | null> {
  const body = {
    request_context: {},
    prospects_to_match: [input],
  };

  const res = await fetch(`${exploriumBaseUrl()}/v1/prospects/match`, {
    method: 'POST',
    headers: exploriumHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Explorium match failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const matched = json?.matched_prospects?.[0];
  const prospectId = typeof matched?.prospect_id === 'string' ? matched.prospect_id.trim() : '';
  return prospectId || null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeSeniority(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Pull professional profile fields for a matched prospect_id. */
export async function enrichProspectProfile(prospectId: string): Promise<ExploriumProfile> {
  const res = await fetch(`${exploriumBaseUrl()}/v1/prospects/profiles/enrich`, {
    method: 'POST',
    headers: exploriumHeaders(),
    body: JSON.stringify({ prospect_id: prospectId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Explorium profiles enrich failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const data = json?.data ?? json?.profile ?? json?.prospect ?? json;

  return {
    prospect_id: prospectId,
    full_name: pickString(data?.full_name, data?.name),
    job_title: pickString(data?.job_title, data?.title),
    seniority_level: normalizeSeniority(
      pickString(data?.job_seniority_level, data?.seniority_level, data?.seniority),
    ),
    linkedin_url: pickString(data?.linkedin_url, data?.linkedin),
    company_name: pickString(data?.company_name, data?.company),
  };
}

export const POC_SENIORITY_LEVELS = new Set([
  'c-suite',
  'c_suite',
  'csuite',
  'president',
  'vp',
  'vice-president',
  'vice_president',
  'director',
]);

export function isPocSeniority(level: string | undefined): boolean {
  if (!level) return false;
  const normalized = level.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  if (POC_SENIORITY_LEVELS.has(normalized)) return true;
  return /\b(vp|vice president|director|president|c-suite|chief)\b/i.test(level);
}

export function enrichmentPriorityThreshold(): number {
  const raw = Deno.env.get('ENRICHMENT_PRIORITY_THRESHOLD');
  const parsed = raw ? Number(raw) : 3;
  return Number.isFinite(parsed) ? parsed : 3;
}

export function enrichmentDailyCreditCap(): number | null {
  const raw = Deno.env.get('ENRICHMENT_DAILY_CREDIT_CAP');
  if (!raw || raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
