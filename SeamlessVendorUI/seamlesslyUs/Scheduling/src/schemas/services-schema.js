/**
 * Coffee & Conversations Collective - Services Schema
 * Defines available services across all business lines
 */

export const servicesSchema = {
  TableName: 'CoffeeConversationsCollective-Services',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'category', AttributeType: 'S' },
    { AttributeName: 'active', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'Category-Index',
      KeySchema: [
        { AttributeName: 'category', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
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
 * Service Document Structure
 */
export const serviceDocumentStructure = {
  id: 'string', // Primary key - UUID
  name: 'string', // Service name
  category: 'string', // 'massage', 'cafe', 'events', 'podcast'
  duration_options: 'array', // [30, 60, 90] - available durations in minutes
  price: 'number', // Base price
  price_by_duration: 'object', // { 30: 50, 60: 85, 90: 120 }
  points_earned: 'number', // Base loyalty points earned (typically 1 point per $1)
  description: 'string', // Service description
  buffer_time: 'number', // Minutes between appointments
  active: 'boolean', // Is service currently available
  image_url: 'string', // Service image
  requires_staff: 'boolean', // Does this service require staff assignment
  max_advance_booking_days: 'number', // How far in advance can be booked
  cancellation_hours: 'number', // Hours before appointment can be cancelled
  created_at: 'string', // ISO timestamp
  updated_at: 'string' // ISO timestamp
};

/**
 * Sample Service Documents
 */
export const sampleServiceDocuments = [
  // Massage Services
  {
    id: 'service_swedish_massage',
    name: 'Swedish Massage',
    category: 'massage',
    duration_options: [60, 90],
    price: 85,
    price_by_duration: {
      60: 85,
      90: 120
    },
    points_earned: 1, // 1 point per $1 spent
    description: 'Classic relaxation massage using gentle, flowing strokes to ease tension and promote overall well-being.',
    buffer_time: 15,
    active: true,
    image_url: '/images/services/swedish-massage.jpg',
    requires_staff: true,
    max_advance_booking_days: 90,
    cancellation_hours: 24,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'service_deep_tissue',
    name: 'Deep Tissue Massage',
    category: 'massage',
    duration_options: [60, 90],
    price: 95,
    price_by_duration: {
      60: 95,
      90: 135
    },
    points_earned: 1,
    description: 'Therapeutic massage targeting deep muscle layers to relieve chronic tension and pain.',
    buffer_time: 15,
    active: true,
    image_url: '/images/services/deep-tissue.jpg',
    requires_staff: true,
    max_advance_booking_days: 90,
    cancellation_hours: 24,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'service_hot_stone',
    name: 'Hot Stone Massage',
    category: 'massage',
    duration_options: [75, 90],
    price: 110,
    price_by_duration: {
      75: 110,
      90: 140
    },
    points_earned: 1,
    description: 'Luxurious massage using heated stones to melt away tension and promote deep relaxation.',
    buffer_time: 20,
    active: true,
    image_url: '/images/services/hot-stone.jpg',
    requires_staff: true,
    max_advance_booking_days: 90,
    cancellation_hours: 24,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'service_aromatherapy',
    name: 'Aromatherapy Massage',
    category: 'massage',
    duration_options: [60, 90],
    price: 90,
    price_by_duration: {
      60: 90,
      90: 125
    },
    points_earned: 1,
    description: 'Relaxing massage enhanced with essential oils tailored to your wellness needs.',
    buffer_time: 15,
    active: true,
    image_url: '/images/services/aromatherapy.jpg',
    requires_staff: true,
    max_advance_booking_days: 90,
    cancellation_hours: 24,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  // Cafe Reservations
  {
    id: 'service_cafe_table_2',
    name: 'Cafe Table (2 People)',
    category: 'cafe',
    duration_options: [60, 90, 120],
    price: 0, // No reservation fee for cafe
    price_by_duration: {
      60: 0,
      90: 0,
      120: 0
    },
    points_earned: 1, // Points earned on purchases, not reservation
    description: 'Cozy table for two in our artisan cafe.',
    buffer_time: 15,
    active: true,
    image_url: '/images/services/cafe-table-2.jpg',
    requires_staff: false,
    max_advance_booking_days: 14,
    cancellation_hours: 4,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'service_cafe_table_4',
    name: 'Cafe Table (4 People)',
    category: 'cafe',
    duration_options: [60, 90, 120],
    price: 0,
    price_by_duration: {
      60: 0,
      90: 0,
      120: 0
    },
    points_earned: 1,
    description: 'Standard table for four in our cafe space.',
    buffer_time: 15,
    active: true,
    image_url: '/images/services/cafe-table-4.jpg',
    requires_staff: false,
    max_advance_booking_days: 14,
    cancellation_hours: 4,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  // Event Space Rentals
  {
    id: 'service_event_space_half_day',
    name: 'Event Space - Half Day',
    category: 'events',
    duration_options: [240], // 4 hours
    price: 350,
    price_by_duration: {
      240: 350
    },
    points_earned: 1,
    description: 'Private event space rental for meetings, workshops, or small gatherings (4 hours).',
    buffer_time: 60,
    active: true,
    image_url: '/images/services/event-space.jpg',
    requires_staff: false,
    max_advance_booking_days: 180,
    cancellation_hours: 72,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'service_event_space_full_day',
    name: 'Event Space - Full Day',
    category: 'events',
    duration_options: [480], // 8 hours
    price: 600,
    price_by_duration: {
      480: 600
    },
    points_earned: 1,
    description: 'Private event space rental for full-day events, conferences, or celebrations.',
    buffer_time: 60,
    active: true,
    image_url: '/images/services/event-space.jpg',
    requires_staff: false,
    max_advance_booking_days: 180,
    cancellation_hours: 72,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  // Podcast Studio
  {
    id: 'service_podcast_studio_1hr',
    name: 'Podcast Studio - 1 Hour',
    category: 'podcast',
    duration_options: [60],
    price: 75,
    price_by_duration: {
      60: 75
    },
    points_earned: 1,
    description: 'Professional podcast recording studio with equipment and soundproofing.',
    buffer_time: 30,
    active: true,
    image_url: '/images/services/podcast-studio.jpg',
    requires_staff: false,
    max_advance_booking_days: 60,
    cancellation_hours: 24,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'service_podcast_studio_2hr',
    name: 'Podcast Studio - 2 Hours',
    category: 'podcast',
    duration_options: [120],
    price: 140,
    price_by_duration: {
      120: 140
    },
    points_earned: 1,
    description: 'Extended podcast studio session for longer recordings or multiple episodes.',
    buffer_time: 30,
    active: true,
    image_url: '/images/services/podcast-studio.jpg',
    requires_staff: false,
    max_advance_booking_days: 60,
    cancellation_hours: 24,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'service_podcast_production',
    name: 'Podcast Production Package',
    category: 'podcast',
    duration_options: [180],
    price: 250,
    price_by_duration: {
      180: 250
    },
    points_earned: 1,
    description: 'Full production service including recording, editing, and post-production.',
    buffer_time: 30,
    active: true,
    image_url: '/images/services/podcast-production.jpg',
    requires_staff: true,
    max_advance_booking_days: 60,
    cancellation_hours: 48,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

