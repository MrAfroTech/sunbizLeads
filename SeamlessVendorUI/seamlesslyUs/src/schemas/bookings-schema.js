/**
 * Coffee & Conversations Collective - Bookings Schema
 * Stores all appointment bookings across services
 */

export const bookingsSchema = {
  TableName: 'CoffeeConversationsCollective-Bookings',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' },
    { AttributeName: 'customer_id', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'customer_id', AttributeType: 'S' },
    { AttributeName: 'staff_id', AttributeType: 'S' },
    { AttributeName: 'booking_date', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'StaffId-BookingDate-Index',
      KeySchema: [
        { AttributeName: 'staff_id', KeyType: 'HASH' },
        { AttributeName: 'booking_date', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'BookingDate-Index',
      KeySchema: [
        { AttributeName: 'booking_date', KeyType: 'HASH' },
        { AttributeName: 'status', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'Status-Index',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'booking_date', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

/**
 * Booking Document Structure
 */
export const bookingDocumentStructure = {
  id: 'string', // Primary key - UUID
  customer_id: 'string', // Foreign key to customers table
  service_type: 'string', // 'massage', 'cafe', 'event_space', 'podcast'
  service_id: 'string', // Foreign key to services table
  staff_id: 'string', // Foreign key to staff table (nullable for table reservations)
  booking_date: 'string', // ISO date string (YYYY-MM-DD)
  start_time: 'string', // ISO time string (HH:MM:SS)
  end_time: 'string', // ISO time string (HH:MM:SS)
  duration: 'number', // Duration in minutes
  status: 'string', // 'confirmed', 'pending', 'cancelled', 'completed', 'no-show'
  price: 'number', // Service price
  discount_applied: 'number', // Discount amount
  loyalty_points_used: 'number', // Points used for discount
  loyalty_points_earned: 'number', // Points earned from this booking
  payment_status: 'string', // 'pending', 'completed', 'refunded', 'failed'
  bot_pos_transaction_id: 'string', // BOT POS transaction ID
  notes: 'string', // Customer notes or preferences
  recurring: 'boolean', // Is this a recurring appointment
  recurring_pattern: 'string', // 'weekly', 'biweekly', 'monthly' (if recurring)
  recurring_until: 'string', // End date for recurring bookings (ISO date)
  reminder_sent: 'boolean', // Has reminder been sent
  created_at: 'string', // ISO timestamp
  updated_at: 'string' // ISO timestamp
};

/**
 * Sample Booking Document
 */
export const sampleBookingDocument = {
  id: 'booking_1234567890abcdef',
  customer_id: 'customer_9876543210fedcba',
  service_type: 'massage',
  service_id: 'service_deep_tissue_60',
  staff_id: 'staff_sarah_thompson',
  booking_date: '2025-11-01',
  start_time: '14:00:00',
  end_time: '15:00:00',
  duration: 60,
  status: 'confirmed',
  price: 95.00,
  discount_applied: 9.50,
  loyalty_points_used: 0,
  loyalty_points_earned: 86, // $85.50 spent after discount (10% off from Gold tier)
  payment_status: 'completed',
  bot_pos_transaction_id: 'botpos_tx_abc123',
  notes: 'Customer prefers medium pressure, focus on lower back',
  recurring: false,
  recurring_pattern: null,
  recurring_until: null,
  reminder_sent: true,
  created_at: '2025-10-15T10:30:00Z',
  updated_at: '2025-10-15T10:30:00Z'
};

