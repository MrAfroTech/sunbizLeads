/**
 * Coffee & Conversations Collective - Staff Schema
 * Manages staff members and their availability
 */

export const staffSchema = {
  TableName: 'CoffeeConversationsCollective-Staff',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'active', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'Active-Index',
      KeySchema: [
        { AttributeName: 'active', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

/**
 * Staff Document Structure
 */
export const staffDocumentStructure = {
  id: 'string', // Primary key - UUID
  name: 'string', // Staff member name
  email: 'string', // Contact email
  phone: 'string', // Contact phone
  services: 'array', // Array of service IDs they can perform
  working_hours: 'object', // Weekly schedule
  color_code: 'string', // Hex color for calendar display
  active: 'boolean', // Is staff member currently active
  bio: 'string', // Staff bio/description
  image_url: 'string', // Staff photo
  specialties: 'array', // List of specialties
  years_experience: 'number', // Years of experience
  created_at: 'string', // ISO timestamp
  updated_at: 'string' // ISO timestamp
};

/**
 * Sample Staff Documents
 */
export const sampleStaffDocuments = [
  {
    id: 'staff_sarah_thompson',
    name: 'Sarah Thompson',
    email: 'sarah@coffeeconversations.com',
    phone: '555-0101',
    services: [
      'service_swedish_massage',
      'service_deep_tissue',
      'service_aromatherapy'
    ],
    working_hours: {
      monday: { enabled: true, start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
      tuesday: { enabled: true, start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
      wednesday: { enabled: true, start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
      thursday: { enabled: true, start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
      friday: { enabled: true, start: '09:00', end: '15:00', breaks: [] },
      saturday: { enabled: false, start: null, end: null, breaks: [] },
      sunday: { enabled: false, start: null, end: null, breaks: [] }
    },
    color_code: '#4A90E2',
    active: true,
    bio: 'Licensed massage therapist with 8 years of experience specializing in Swedish and deep tissue techniques.',
    image_url: '/images/staff/sarah-thompson.jpg',
    specialties: ['Swedish Massage', 'Deep Tissue', 'Aromatherapy', 'Prenatal Massage'],
    years_experience: 8,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'staff_michael_chen',
    name: 'Michael Chen',
    email: 'michael@coffeeconversations.com',
    phone: '555-0102',
    services: [
      'service_deep_tissue',
      'service_hot_stone',
      'service_aromatherapy'
    ],
    working_hours: {
      monday: { enabled: false, start: null, end: null, breaks: [] },
      tuesday: { enabled: true, start: '10:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wednesday: { enabled: true, start: '10:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thursday: { enabled: true, start: '10:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      friday: { enabled: true, start: '10:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      saturday: { enabled: true, start: '09:00', end: '16:00', breaks: [{ start: '12:00', end: '13:00' }] },
      sunday: { enabled: true, start: '10:00', end: '15:00', breaks: [] }
    },
    color_code: '#50C878',
    active: true,
    bio: 'Certified massage therapist specializing in hot stone therapy and sports massage.',
    image_url: '/images/staff/michael-chen.jpg',
    specialties: ['Deep Tissue', 'Hot Stone', 'Sports Massage', 'Thai Massage'],
    years_experience: 6,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'staff_jessica_martinez',
    name: 'Jessica Martinez',
    email: 'jessica@coffeeconversations.com',
    phone: '555-0103',
    services: [
      'service_swedish_massage',
      'service_aromatherapy',
      'service_hot_stone'
    ],
    working_hours: {
      monday: { enabled: true, start: '11:00', end: '19:00', breaks: [{ start: '14:00', end: '15:00' }] },
      tuesday: { enabled: true, start: '11:00', end: '19:00', breaks: [{ start: '14:00', end: '15:00' }] },
      wednesday: { enabled: false, start: null, end: null, breaks: [] },
      thursday: { enabled: true, start: '11:00', end: '19:00', breaks: [{ start: '14:00', end: '15:00' }] },
      friday: { enabled: true, start: '11:00', end: '19:00', breaks: [{ start: '14:00', end: '15:00' }] },
      saturday: { enabled: true, start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
      sunday: { enabled: false, start: null, end: null, breaks: [] }
    },
    color_code: '#E94B3C',
    active: true,
    bio: 'Experienced therapist with a passion for relaxation and holistic wellness.',
    image_url: '/images/staff/jessica-martinez.jpg',
    specialties: ['Swedish Massage', 'Aromatherapy', 'Reflexology', 'Hot Stone'],
    years_experience: 5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'staff_alex_podcast_engineer',
    name: 'Alex Rivera',
    email: 'alex@coffeeconversations.com',
    phone: '555-0104',
    services: [
      'service_podcast_production'
    ],
    working_hours: {
      monday: { enabled: true, start: '10:00', end: '18:00', breaks: [] },
      tuesday: { enabled: true, start: '10:00', end: '18:00', breaks: [] },
      wednesday: { enabled: true, start: '10:00', end: '18:00', breaks: [] },
      thursday: { enabled: true, start: '10:00', end: '18:00', breaks: [] },
      friday: { enabled: true, start: '10:00', end: '16:00', breaks: [] },
      saturday: { enabled: false, start: null, end: null, breaks: [] },
      sunday: { enabled: false, start: null, end: null, breaks: [] }
    },
    color_code: '#9B59B6',
    active: true,
    bio: 'Professional audio engineer with 10+ years experience in podcast production and editing.',
    image_url: '/images/staff/alex-rivera.jpg',
    specialties: ['Audio Production', 'Sound Design', 'Podcast Editing', 'Mixing & Mastering'],
    years_experience: 10,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

