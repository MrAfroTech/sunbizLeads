/**
 * DynamoDB Schema for Tickets Table (white-label template)
 * Stores ticket purchase information with QR codes
 */

module.exports = {
  tableName: process.env.TICKETS_TABLE || 'CLIENT_TICKETS_TABLE',
  
  schema: {
    // Primary Key
    ticket_id: {
      type: 'String',
      keyType: 'HASH', // Partition key
      description: 'Unique ticket identifier (tkt_xxxxx)'
    },
    
    // Attributes
    transaction_id: {
      type: 'String',
      description: 'Stripe transaction/payment intent ID',
      index: 'GSI1' // Global Secondary Index for lookups
    },
    
    tier_type: {
      type: 'String',
      description: 'Ticket tier: bi-weekly, late-winter, early-spring',
      index: 'GSI2'
    },
    
    customer_email: {
      type: 'String',
      description: 'Customer email address',
      index: 'GSI3'
    },
    
    customer_name: {
      type: 'String',
      description: 'Customer full name'
    },
    
    customer_phone: {
      type: 'String',
      description: 'Customer phone number (optional)'
    },
    
    purchase_date: {
      type: 'String',
      description: 'ISO date string of purchase'
    },
    
    event_date: {
      type: 'String',
      description: 'ISO date string of the event'
    },
    
    qr_code_url: {
      type: 'String',
      description: 'URL or base64 data URL of QR code image'
    },
    
    qr_code_data: {
      type: 'Map',
      description: 'JSON object containing QR code encoded data'
    },
    
    ticket_count: {
      type: 'Number',
      description: 'Number of tickets in this purchase'
    },
    
    total_amount: {
      type: 'Number',
      description: 'Total amount paid in cents'
    },
    
    stripe_payment_id: {
      type: 'String',
      description: 'Stripe payment intent ID'
    },
    
    stripe_customer_id: {
      type: 'String',
      description: 'Stripe customer ID'
    },
    
    status: {
      type: 'String',
      description: 'Ticket status: active, used, cancelled, refunded',
      default: 'active'
    },
    
    checked_in: {
      type: 'Boolean',
      description: 'Whether ticket has been checked in at event',
      default: false
    },
    
    checked_in_at: {
      type: 'String',
      description: 'ISO timestamp of check-in (if checked in)'
    },
    
    klaviyo_profile_id: {
      type: 'String',
      description: 'Klaviyo profile ID for email marketing'
    },
    
    klaviyo_list_id: {
      type: 'String',
      description: 'Klaviyo list ID this customer was added to'
    },
    
    created_at: {
      type: 'String',
      description: 'ISO timestamp of ticket creation'
    },
    
    updated_at: {
      type: 'String',
      description: 'ISO timestamp of last update'
    }
  },
  
  // Global Secondary Indexes
  indexes: {
    GSI1: {
      name: 'TransactionIdIndex',
      keySchema: [
        { AttributeName: 'transaction_id', KeyType: 'HASH' }
      ],
      projection: { ProjectionType: 'ALL' }
    },
    GSI2: {
      name: 'TierTypeIndex',
      keySchema: [
        { AttributeName: 'tier_type', KeyType: 'HASH' },
        { AttributeName: 'event_date', KeyType: 'RANGE' }
      ],
      projection: { ProjectionType: 'ALL' }
    },
    GSI3: {
      name: 'CustomerEmailIndex',
      keySchema: [
        { AttributeName: 'customer_email', KeyType: 'HASH' },
        { AttributeName: 'purchase_date', KeyType: 'RANGE' }
      ],
      projection: { ProjectionType: 'ALL' }
    }
  },
  
  // Example ticket data structure
  example: {
    ticket_id: 'tkt_abc123def456',
    transaction_id: 'TXN_xyz789',
    tier_type: 'bi-weekly',
    customer_email: 'customer@example.com',
    customer_name: 'John Doe',
    customer_phone: '+1234567890',
    purchase_date: '2025-01-15T10:30:00Z',
    event_date: '2025-01-29T14:00:00Z',
    qr_code_url: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
    qr_code_data: {
      ticketId: 'tkt_abc123def456',
      transactionId: 'TXN_xyz789',
      tier: 'bi-weekly',
      purchaseDate: '2025-01-15',
      customerName: 'John Doe',
      ticketCount: 2
    },
    ticket_count: 2,
    total_amount: 2000, // $20.00 in cents
    stripe_payment_id: 'pi_1234567890',
    stripe_customer_id: 'cus_1234567890',
    status: 'active',
    checked_in: false,
    klaviyo_profile_id: '01HXXXXXXX',
    klaviyo_list_id: 'ABC123',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  }
};



