/**
 * Ingestion-level validation for lead emails.
 * Quarantine junk before it lands in source tables that feed v_lead_priority.
 */

export type QuarantineReason =
  | 'unresolved_merge_tag'
  | 'test_domain'
  | 'invalid_email';

const TEST_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'team.us',
  'team.com',
  'test.com',
  'mailinator.com',
  'guerrillamail.com',
]);

const INTERNAL_TEST_EMAILS = new Set([
  'maurice@mauricethefirst.com',
]);

export function isUnresolvedMergeTag(value: string | null | undefined): boolean {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return false;
  if (trimmed.includes('{{') || trimmed.includes('}}')) return true;
  if (trimmed.includes('*|') || trimmed.includes('|*')) return true;
  if (/%\w+%/.test(trimmed)) return true;
  if (/\[\[[\w.]+\]\]/.test(trimmed)) return true;
  return false;
}

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase();
}

export function isTestDomain(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return true;
  if (TEST_DOMAINS.has(domain)) return true;
  if (domain.endsWith('.example.com') || domain.endsWith('.test')) return true;
  if (domain.includes('seamlessly')) return true;
  return false;
}

export function isInternalTestEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  if (INTERNAL_TEST_EMAILS.has(lower)) return true;
  if (lower.includes('test') || lower.includes('user')) return true;
  return false;
}

export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns quarantine reason, or null if email is acceptable (including null/empty). */
export function quarantineReasonForEmail(
  email: string | null | undefined,
): QuarantineReason | null {
  if (email == null || String(email).trim() === '') return null;
  const trimmed = String(email).trim();
  if (isUnresolvedMergeTag(trimmed)) return 'unresolved_merge_tag';
  const lower = trimmed.toLowerCase();
  if (!looksLikeEmail(lower)) return 'invalid_email';
  if (isTestDomain(lower) || isInternalTestEmail(lower)) return 'test_domain';
  return null;
}

export async function logIngestionReject(
  // deno-lint-ignore no-explicit-any
  admin: { from: (table: string) => any },
  opts: {
    email: string | null;
    sourceTable: string;
    reason: QuarantineReason;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await admin.from('lead_ingestion_rejects').insert({
      email: opts.email,
      source_table: opts.sourceTable,
      reason: opts.reason,
      payload: opts.payload ?? {},
      rejected_at: new Date().toISOString(),
    });
  } catch {
    /* never block ingest on quarantine logging */
  }
}
