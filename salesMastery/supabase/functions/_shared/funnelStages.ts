/** Unified funnel stage labels — lead sequence + calculator abandonment sequence. */

export const LEAD_FUNNEL_STAGES = {
  NEW_LEAD: 'new_lead',
  EMAIL_1_SENT: 'email_1_sent',
  GUIDE_SENT: 'guide_sent',
  EMAIL_2_SENT: 'email_2_sent',
  EMAIL_3_SENT: 'email_3_sent',
  EMAIL_4_SENT: 'email_4_sent',
  REVENUE_FIT_REQUESTED: 'revenue_fit_requested',
  REVENUE_FIT_SCHEDULED: 'revenue_fit_scheduled',
  REVENUE_FIT_COMPLETED: 'revenue_fit_completed',
  QUALIFIED: 'qualified',
  PROPOSAL_SENT: 'proposal_sent',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
} as const;

export const ABANDON_FUNNEL_STAGES = {
  ENROLLED: 'abandon_enrolled',
  EMAIL_1_SENT: 'abandon_email_1_sent',
  EMAIL_2_SENT: 'abandon_email_2_sent',
  EMAIL_3_SENT: 'abandon_email_3_sent',
  EMAIL_4_SENT: 'abandon_email_4_sent',
  COMPLETED: 'abandon_completed',
  EXITED: 'abandon_exited',
} as const;

export const ABANDON_ENGINE_VERSION = 'v2_abandon';
export const LEAD_ENGINE_VERSION = 'v2';

export const ABANDON_TEMPLATE_IDS = {
  email_1: 195,
  email_2: 196,
  email_3: 197,
  email_4: 198,
} as const;

/** Hours after a calculator visit before enrolling in abandonment (allows form completion). */
export const ABANDON_ENROLLMENT_GRACE_HOURS = 2;

export const CALCULATOR_PAGE_KEYS = [
  'sports_calculator',
  'sports_results',
  'sports_turnover_results',
  'staff_turnover_calculator',
  'staff_burnout_results',
  'magic_bands_calculator',
  'magic_bands_results',
  'wait_calculator',
  'restaurants_calculator',
  'hotels_calculator',
  'districts_calculator',
] as const;

const LEAD_FUNNEL_STAGE_PREFIXES = ['email_', 'guide_sent'];

export function isLeadFunnelStage(stage: unknown): boolean {
  if (typeof stage !== 'string') return false;
  if (stage === LEAD_FUNNEL_STAGES.GUIDE_SENT) return true;
  return LEAD_FUNNEL_STAGE_PREFIXES.some((prefix) => stage.startsWith(prefix));
}

export function isAbandonFunnelStage(stage: unknown): boolean {
  return typeof stage === 'string' && stage.startsWith('abandon_');
}

export type ScanScaleRow = {
  engine_version?: string | null;
  emails_sent?: number | null;
  funnel_stage?: string | null;
  phone?: string | null;
};

/** True when contact is on (or completed) the personalized lead email sequence (137–140). */
export function isActiveLeadFunnelRow(row: ScanScaleRow | null | undefined): boolean {
  if (!row) return false;
  if (row.engine_version === ABANDON_ENGINE_VERSION) return false;
  if (row.engine_version === LEAD_ENGINE_VERSION) {
    if (typeof row.phone === 'string' && row.phone.trim().length > 0) return true;
    if (typeof row.emails_sent === 'number' && row.emails_sent >= 1) return true;
    if (isLeadFunnelStage(row.funnel_stage)) return true;
  }
  if (row.engine_version === 'v1' && typeof row.emails_sent === 'number' && row.emails_sent >= 1) {
    return true;
  }
  return false;
}

export function isActiveAbandonFunnelRow(row: ScanScaleRow | null | undefined): boolean {
  if (!row) return false;
  if (row.engine_version !== ABANDON_ENGINE_VERSION) return false;
  if (row.funnel_stage === ABANDON_FUNNEL_STAGES.EXITED) return false;
  if (row.funnel_stage === ABANDON_FUNNEL_STAGES.COMPLETED) return false;
  return true;
}
