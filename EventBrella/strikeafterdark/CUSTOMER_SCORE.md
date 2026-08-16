# Strike After Dark — Customer Score

## Tables

### `strikeafterdark` (one row per checkout)
Stores contact + purchase details:
- `customer_name`, `customer_email`, `customer_phone`
- `tier` (ticket type: `ga`, `lane`, `vip`, …)
- `ticket_count`
- `amount_cents`
- `event_name`, `event_date`, `event_slug`
- `purchase_points` (score for this checkout)
- `customer_score` (lifetime score **after** this checkout)

### `strikeafterdark_customers` (one row per email)
Lifetime loyalty profile across all events:
- `total_purchases`, `total_tickets`, `unique_events`
- `lifetime_spend_cents`
- `customer_score`
- `last_tier`, `first_purchase_at`, `last_purchase_at`

## Scoring formula

### Per checkout (`purchase_points`)
```
25
+ (ticket_count × 10)
+ (ticket_count × tier_weight × 5)
+ min(spend_dollars, 100)
```

Tier weights:
| Tier | Weight |
|------|--------|
| ga / basic | 1 |
| lane | 2 |
| vip | 3 |
| vip_bottle | 4 |
| all_access | 5 |

### Lifetime (`customer_score`)
```
sum(purchase_points)
+ (total_purchases - 1) × 20          // repeat-buyer bonus
+ (unique_events - 1) × 15            // multi-event bonus
+ floor(min(lifetime_spend_dollars, 500) × 0.25)
+ total_tickets
```

Frequent purchasers climb faster because every new checkout adds base points **plus** growing frequency / multi-event bonuses.

## Setup

1. Run `supabase-strikeafterdark-scoring.sql` in the Supabase SQL Editor.
2. Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel (needed so the webhook can read history + upsert scores).
3. Redeploy. New Stripe purchases will write contact, ticket type, qty, and score automatically.
