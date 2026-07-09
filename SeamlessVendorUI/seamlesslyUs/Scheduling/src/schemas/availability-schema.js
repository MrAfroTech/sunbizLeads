/**
 * Coffee & Conversations Collective - Availability & Time Off Schemas
 * Manages staff availability rules and time-off requests
 */

// ==================== AVAILABILITY RULES SCHEMA ====================
export const availabilityRulesSchema = {
  TableName: 'CoffeeConversationsCollective-AvailabilityRules',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'staff_id', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'StaffId-Index',
      KeySchema: [
        { AttributeName: 'staff_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

export const availabilityRuleDocumentStructure = {
  id: 'string', // Primary key - UUID
  staff_id: 'string', // Foreign key to staff table
  day_of_week: 'number', // 0 = Sunday, 1 = Monday, etc.
  start_time: 'string', // HH:MM format
  end_time: 'string', // HH:MM format
  recurring: 'boolean', // Is this a recurring rule
  effective_date: 'string', // ISO date when rule starts
  end_date: 'string', // ISO date when rule ends (null for indefinite)
  created_at: 'string', // ISO timestamp
  updated_at: 'string' // ISO timestamp
};

export const sampleAvailabilityRules = [
  {
    id: 'avail_rule_001',
    staff_id: 'staff_sarah_thompson',
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '17:00',
    recurring: true,
    effective_date: '2025-01-01',
    end_date: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'avail_rule_002',
    staff_id: 'staff_sarah_thompson',
    day_of_week: 5, // Friday
    start_time: '09:00',
    end_time: '15:00',
    recurring: true,
    effective_date: '2025-01-01',
    end_date: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// ==================== TIME OFF SCHEMA ====================
export const timeOffSchema = {
  TableName: 'CoffeeConversationsCollective-TimeOff',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'staff_id', AttributeType: 'S' },
    { AttributeName: 'start_date', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'StaffId-StartDate-Index',
      KeySchema: [
        { AttributeName: 'staff_id', KeyType: 'HASH' },
        { AttributeName: 'start_date', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

export const timeOffDocumentStructure = {
  id: 'string', // Primary key - UUID
  staff_id: 'string', // Foreign key to staff table
  start_date: 'string', // ISO date (YYYY-MM-DD)
  end_date: 'string', // ISO date (YYYY-MM-DD)
  reason: 'string', // Reason for time off
  type: 'string', // 'vacation', 'sick', 'personal', 'other'
  approved: 'boolean', // Is time off approved
  created_at: 'string', // ISO timestamp
  updated_at: 'string' // ISO timestamp
};

export const sampleTimeOffDocuments = [
  {
    id: 'timeoff_001',
    staff_id: 'staff_sarah_thompson',
    start_date: '2025-12-20',
    end_date: '2025-12-27',
    reason: 'Holiday vacation',
    type: 'vacation',
    approved: true,
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-02T14:00:00Z'
  },
  {
    id: 'timeoff_002',
    staff_id: 'staff_michael_chen',
    start_date: '2025-11-15',
    end_date: '2025-11-15',
    reason: 'Personal appointment',
    type: 'personal',
    approved: true,
    created_at: '2025-11-01T09:00:00Z',
    updated_at: '2025-11-01T09:30:00Z'
  }
];

// ==================== CUSTOMERS SCHEMA ====================
// Basic customer schema for linking bookings and loyalty
export const customersSchema = {
  TableName: 'CoffeeConversationsCollective-Customers',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' },
    { AttributeName: 'phone', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'Email-Index',
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'Phone-Index',
      KeySchema: [
        { AttributeName: 'phone', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

export const customerDocumentStructure = {
  id: 'string', // Primary key - UUID
  first_name: 'string',
  last_name: 'string',
  email: 'string',
  phone: 'string',
  preferences: 'object', // Massage preferences, allergies, etc.
  marketing_consent: 'boolean',
  created_at: 'string',
  updated_at: 'string'
};

export const sampleCustomerDocument = {
  id: 'customer_9876543210fedcba',
  first_name: 'Emma',
  last_name: 'Johnson',
  email: 'emma.johnson@example.com',
  phone: '555-0199',
  preferences: {
    massage_pressure: 'medium',
    allergies: ['lavender'],
    notes: 'Prefers lower back focus',
    favorite_services: ['Deep Tissue Massage', 'Hot Stone']
  },
  marketing_consent: true,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2025-10-20T10:00:00Z'
};

