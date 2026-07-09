# Klaviyo Email Subject Line Update

## Required Change

The email subject line for ticket purchase confirmations needs to be updated in your Klaviyo Flow settings.

### Current Subject (if set):
```
Your [Event Name] Tickets - [Event Date]
```

### New Subject:
```
Here On The Farm
```

## How to Update

1. Log into your Klaviyo account
2. Go to **Flows** → Find your "Ticket Purchased" flow
3. Click on the **Email** step in the flow
4. Find the **Subject Line** field
5. Change it to: `Here On The Farm`
6. Save the flow

## Event Name in Email Body

The email body already dynamically displays the correct event name using:
- `{{ event.event_name }}` - This will show the actual tour/harvest name (e.g., "Monthly Farm Tour", "Cassava/Yuca Harvest", "Sugar Cane Harvest")

The event name is automatically passed from the payment metadata, so no manual updates are needed for different events.

## Verification

After updating:
1. Make a test purchase
2. Check the email subject line - it should say "Here On The Farm"
3. Check the email body - it should show the correct event name (e.g., "Monthly Farm Tour" or the specific harvest name)








