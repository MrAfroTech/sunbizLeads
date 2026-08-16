-- Atomic purchase + contact total update for repeat buyers (same email).
-- Callable by the webhook even with the anon key.

CREATE OR REPLACE FUNCTION public.record_strikeafterdark_purchase(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text DEFAULT NULL,
  p_transaction_id text DEFAULT NULL,
  p_event_name text DEFAULT NULL,
  p_event_date date DEFAULT NULL,
  p_event_slug text DEFAULT NULL,
  p_tier text DEFAULT 'ga',
  p_ticket_count integer DEFAULT 1,
  p_amount_cents integer DEFAULT 0,
  p_purchase_points integer DEFAULT 0,
  p_purchase_date timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_customer_email));
  v_count integer := GREATEST(COALESCE(p_ticket_count, 1), 1);
  v_cents integer := GREATEST(COALESCE(p_amount_cents, 0), 0);
  v_points integer := GREATEST(COALESCE(p_purchase_points, 0), 0);
  v_tier text := lower(COALESCE(NULLIF(trim(p_tier), ''), 'ga'));
  v_existing_customer jsonb;
  v_total_purchases integer;
  v_total_tickets integer;
  v_lifetime_spend integer;
  v_unique_events integer;
  v_points_sum integer;
  v_score integer;
  v_first_purchase timestamptz;
BEGIN
  IF v_email IS NULL OR v_email = '' OR p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'customer_name and customer_email are required';
  END IF;

  -- Idempotent on transaction_id: do not double-count webhook retries
  IF p_transaction_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.strikeafterdark
      WHERE transaction_id = p_transaction_id
    ) THEN
      SELECT to_jsonb(c)
      INTO v_existing_customer
      FROM public.strikeafterdark_customers c
      WHERE c.customer_email = v_email;

      RETURN jsonb_build_object(
        'skipped', true,
        'reason', 'transaction_already_recorded',
        'customer', COALESCE(v_existing_customer, '{}'::jsonb)
      );
    END IF;
  END IF;

  -- Insert this checkout as a purchase row
  INSERT INTO public.strikeafterdark (
    customer_name,
    customer_email,
    customer_phone,
    transaction_id,
    event_name,
    event_date,
    event_slug,
    tier,
    ticket_count,
    amount_cents,
    purchase_points,
    customer_score,
    purchase_date
  ) VALUES (
    p_customer_name,
    v_email,
    NULLIF(p_customer_phone, ''),
    p_transaction_id,
    COALESCE(p_event_name, 'Bosses & Bowling'),
    p_event_date,
    p_event_slug,
    v_tier,
    v_count,
    v_cents,
    v_points,
    0,
    COALESCE(p_purchase_date, now())
  );

  -- Recompute lifetime totals from all purchase rows for this email
  SELECT
    COUNT(*)::integer,
    COALESCE(SUM(ticket_count), 0)::integer,
    COALESCE(SUM(amount_cents), 0)::integer,
    GREATEST(COUNT(DISTINCT event_date), 1)::integer,
    COALESCE(SUM(purchase_points), 0)::integer,
    MIN(purchase_date)
  INTO
    v_total_purchases,
    v_total_tickets,
    v_lifetime_spend,
    v_unique_events,
    v_points_sum,
    v_first_purchase
  FROM public.strikeafterdark
  WHERE customer_email = v_email;

  -- Lifetime score: purchase points + repeat + multi-event + spend + ticket volume
  v_score :=
    v_points_sum
    + CASE WHEN v_total_purchases > 1 THEN (v_total_purchases - 1) * 20 ELSE 0 END
    + CASE WHEN v_unique_events > 1 THEN (v_unique_events - 1) * 15 ELSE 0 END
    + FLOOR(LEAST(FLOOR(v_lifetime_spend / 100.0), 500) * 0.25)::integer
    + v_total_tickets;

  -- Stamp score on the purchase we just inserted
  UPDATE public.strikeafterdark
  SET customer_score = v_score
  WHERE transaction_id IS NOT DISTINCT FROM p_transaction_id
    AND customer_email = v_email;

  -- Upsert the single contacts / loyalty row for this email
  INSERT INTO public.strikeafterdark_customers (
    customer_email,
    customer_name,
    customer_phone,
    total_purchases,
    total_tickets,
    lifetime_spend_cents,
    unique_events,
    customer_score,
    last_tier,
    first_purchase_at,
    last_purchase_at,
    updated_at
  ) VALUES (
    v_email,
    p_customer_name,
    NULLIF(p_customer_phone, ''),
    v_total_purchases,
    v_total_tickets,
    v_lifetime_spend,
    v_unique_events,
    v_score,
    v_tier,
    COALESCE(v_first_purchase, COALESCE(p_purchase_date, now())),
    COALESCE(p_purchase_date, now()),
    now()
  )
  ON CONFLICT (customer_email) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    customer_phone = COALESCE(EXCLUDED.customer_phone, public.strikeafterdark_customers.customer_phone),
    total_purchases = EXCLUDED.total_purchases,
    total_tickets = EXCLUDED.total_tickets,
    lifetime_spend_cents = EXCLUDED.lifetime_spend_cents,
    unique_events = EXCLUDED.unique_events,
    customer_score = EXCLUDED.customer_score,
    last_tier = EXCLUDED.last_tier,
    first_purchase_at = COALESCE(public.strikeafterdark_customers.first_purchase_at, EXCLUDED.first_purchase_at),
    last_purchase_at = EXCLUDED.last_purchase_at,
    updated_at = now();

  RETURN jsonb_build_object(
    'skipped', false,
    'customer_email', v_email,
    'ticket_count_this_purchase', v_count,
    'total_purchases', v_total_purchases,
    'total_tickets', v_total_tickets,
    'unique_events', v_unique_events,
    'customer_score', v_score,
    'lifetime_spend_cents', v_lifetime_spend,
    'tier', v_tier
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_strikeafterdark_purchase(
  text, text, text, text, text, date, text, text, integer, integer, integer, timestamptz
) TO anon, authenticated, service_role;

-- Helpful unique index so webhook retries don't create duplicate purchase rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_strikeafterdark_transaction_id_unique
  ON public.strikeafterdark (transaction_id)
  WHERE transaction_id IS NOT NULL;
