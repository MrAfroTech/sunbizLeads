# CSV Format Guide for Klaviyo Uploads

## Overview

Three CSV files need to be prepared for Klaviyo list uploads, one for each ticket tier.

## CSV File Structure

### Required Columns

All three CSV files should have the following columns (in this order):

```
email,first_name,last_name,ticket_tier,event_date,qr_code_url,transaction_id
```

### Column Descriptions

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `email` | String | Yes | Customer email address |
| `first_name` | String | No | Customer first name |
| `last_name` | String | No | Customer last name |
| `ticket_tier` | String | Yes | One of: `bi-weekly`, `late-winter`, `early-spring` |
| `event_date` | String | Yes | ISO date format: `YYYY-MM-DD` |
| `qr_code_url` | String | No | Base64 data URL or URL to QR code image |
| `transaction_id` | String | Yes | Unique transaction identifier (e.g., `TXN_ABC123`) |

## CSV File Examples

### CSV 1: Bi-Weekly Farm Tours

```csv
email,first_name,last_name,ticket_tier,event_date,qr_code_url,transaction_id
john.doe@example.com,John,Doe,bi-weekly,2025-01-29,data:image/png;base64,iVBORw0KGgo...,TXN_ABC123
jane.smith@example.com,Jane,Smith,bi-weekly,2025-02-12,data:image/png;base64,iVBORw0KGgo...,TXN_DEF456
```

### CSV 2: Late Winter Harvest Event

```csv
email,first_name,last_name,ticket_tier,event_date,qr_code_url,transaction_id
alice.johnson@example.com,Alice,Johnson,late-winter,2025-02-28,data:image/png;base64,iVBORw0KGgo...,TXN_GHI789
bob.williams@example.com,Bob,Williams,late-winter,2025-03-07,data:image/png;base64,iVBORw0KGgo...,TXN_JKL012
```

### CSV 3: Early Spring Harvest Event

```csv
email,first_name,last_name,ticket_tier,event_date,qr_code_url,transaction_id
carol.brown@example.com,Carol,Brown,early-spring,2025-03-28,data:image/png;base64,iVBORw0KGgo...,TXN_MNO345
david.davis@example.com,David,Davis,early-spring,2025-04-04,data:image/png;base64,iVBORw0KGgo...,TXN_PQR678
```

## Upload Process

### Method 1: Klaviyo Dashboard

1. Log into Klaviyo Dashboard
2. Navigate to **Lists** > Select the appropriate list
3. Click **Import** or **Add Profiles**
4. Upload CSV file
5. Map columns if needed
6. Review and confirm import

### Method 2: Klaviyo API

Use the Klaviyo API to programmatically add profiles:

```javascript
// Example using the klaviyo-sync.js API endpoint
const response = await fetch('/api/farmerBanks/klaviyo-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe',
    tier: 'bi-weekly',
    eventDate: '2025-01-29',
    qrCodeUrl: 'data:image/png;base64,...',
    transactionId: 'TXN_ABC123',
    ticketCount: 1
  })
});
```

## Data Export from Database

If using DynamoDB, export ticket data using this query structure:

```javascript
// Example query to export tickets for CSV
const tickets = await dynamodb.query({
  TableName: 'FarmerBanks-Tickets-prod',
  IndexName: 'TierTypeIndex',
  KeyConditionExpression: 'tier_type = :tier',
  ExpressionAttributeValues: {
    ':tier': 'bi-weekly'
  }
}).promise();

// Convert to CSV format
const csvRows = tickets.Items.map(ticket => ({
  email: ticket.customer_email,
  first_name: ticket.customer_name.split(' ')[0],
  last_name: ticket.customer_name.split(' ').slice(1).join(' '),
  ticket_tier: ticket.tier_type,
  event_date: ticket.event_date,
  qr_code_url: ticket.qr_code_url,
  transaction_id: ticket.transaction_id
}));
```

## Best Practices

1. **Validate Data**: Ensure all emails are valid before upload
2. **Remove Duplicates**: Check for duplicate emails in CSV
3. **Date Format**: Always use ISO date format (YYYY-MM-DD)
4. **QR Code URLs**: Use base64 data URLs for embedded images
5. **Transaction IDs**: Ensure uniqueness across all CSVs
6. **Backup**: Keep original CSV files before upload

## Troubleshooting

### Common Issues

1. **Invalid Email Format**
   - Solution: Validate emails before creating CSV

2. **Missing Required Fields**
   - Solution: Ensure all required columns are present

3. **Date Format Errors**
   - Solution: Use ISO format (YYYY-MM-DD)

4. **QR Code URL Too Long**
   - Solution: Use shortened URLs or store QR codes separately

5. **Duplicate Profiles**
   - Solution: Klaviyo will merge duplicate emails automatically

## Automation

Consider automating CSV generation:

1. Set up scheduled job to export tickets
2. Format data as CSV
3. Upload to Klaviyo via API
4. Send notification on completion

This can be integrated into the ticket purchase flow or run as a batch job.



