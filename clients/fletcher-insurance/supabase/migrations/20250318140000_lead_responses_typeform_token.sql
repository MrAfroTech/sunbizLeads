-- Idempotent Typeform webhooks: one row per form_response.token

alter table public.lead_responses add column if not exists typeform_token text;

create unique index if not exists lead_responses_typeform_token_uidx
  on public.lead_responses (typeform_token)
  where typeform_token is not null;
