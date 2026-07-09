/** Mirrors salesMastery/supabase/functions/_shared/funnelStages.ts for frontend use */

export const FUNNEL_STAGES = {
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
};

export const ABANDON_FUNNEL_STAGES = {
  ENROLLED: 'abandon_enrolled',
  EMAIL_1_SENT: 'abandon_email_1_sent',
  EMAIL_2_SENT: 'abandon_email_2_sent',
  EMAIL_3_SENT: 'abandon_email_3_sent',
  EMAIL_4_SENT: 'abandon_email_4_sent',
  COMPLETED: 'abandon_completed',
  EXITED: 'abandon_exited',
};

export const ABANDON_ENGINE_VERSION = 'v2_abandon';
