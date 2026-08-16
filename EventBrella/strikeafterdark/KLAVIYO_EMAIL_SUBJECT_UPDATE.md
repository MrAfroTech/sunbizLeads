# Klaviyo Email Subject Line Update

## Required Change

The email subject line for ticket purchase confirmations needs to be updated in your Klaviyo Flow settings.

### Subject:
```
Strike After Dark — Bosses & Bowling
```

### Title / preview text:
```
Strike After Dark
Bosses & Bowling
```

## How to Update

1. Log into your Klaviyo account
2. Go to **Flows** → Find your ticket confirmation flow (`ticket.purchased` / Ticket Purchased)
3. Click on the **Email** step in the flow
4. Set **Subject Line** to: `Strike After Dark — Bosses & Bowling`
5. Optionally set preview text to: `Your Bosses & Bowling pass is confirmed`
6. Save the flow

## Event Name in Email Body

The email body already dynamically displays the event name using:
- `{{ event.event_name }}` → Bosses & Bowling
- `{{ event.organizer_name }}` → Strike After Dark

## Verification

After updating:
1. Make a test purchase (or curl a `ticket.purchased` event)
2. Subject should read: **Strike After Dark — Bosses & Bowling**
3. Body header should show Strike After Dark / Bosses & Bowling









