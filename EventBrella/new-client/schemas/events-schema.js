/**
 * DynamoDB Schema for Events Table (white-label template)
 * Stores event information and availability
 */

module.exports = {
  tableName: process.env.EVENTS_TABLE || 'new_client_events',
  
  schema: {
    // Primary Key
    event_id: {
      type: 'String',
      keyType: 'HASH', // Partition key
      description: 'Unique event identifier (evt_xxxxx)'
    },
    
    // Attributes
    event_type: {
      type: 'String',
      description: 'Event type: bi-weekly, late-winter, early-spring',
      index: 'GSI1'
    },
    
    event_date: {
      type: 'String',
      description: 'ISO date string of the event',
      index: 'GSI1' // Range key for GSI1
    },
    
    event_time: {
      type: 'String',
      description: 'Event start time (e.g., "14:00:00")'
    },
    
    available_slots: {
      type: 'Number',
      description: 'Total available slots for this event'
    },
    
    booked_slots: {
      type: 'Number',
      description: 'Number of slots already booked',
      default: 0
    },
    
    price: {
      type: 'Number',
      description: 'Price per ticket in cents'
    },
    
    status: {
      type: 'String',
      description: 'Event status: active, full, cancelled, completed',
      default: 'active',
      index: 'GSI2'
    },
    
    title: {
      type: 'String',
      description: 'Event title'
    },
    
    description: {
      type: 'String',
      description: 'Event description'
    },
    
    activities: {
      type: 'List',
      description: 'Array of activities included in this event'
    },
    
    location: {
      type: 'String',
      description: 'Event location (farm address)'
    },
    
    duration_minutes: {
      type: 'Number',
      description: 'Event duration in minutes'
    },
    
    special_notes: {
      type: 'String',
      description: 'Special notes or instructions for attendees'
    },
    
    created_at: {
      type: 'String',
      description: 'ISO timestamp of event creation'
    },
    
    updated_at: {
      type: 'String',
      description: 'ISO timestamp of last update'
    }
  },
  
  // Global Secondary Indexes
  indexes: {
    GSI1: {
      name: 'EventTypeDateIndex',
      keySchema: [
        { AttributeName: 'event_type', KeyType: 'HASH' },
        { AttributeName: 'event_date', KeyType: 'RANGE' }
      ],
      projection: { ProjectionType: 'ALL' }
    },
    GSI2: {
      name: 'StatusIndex',
      keySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'event_date', KeyType: 'RANGE' }
      ],
      projection: { ProjectionType: 'ALL' }
    }
  },
  
  // Example event data structure
  example: {
    event_id: 'evt_biweekly_20250129',
    event_type: 'bi-weekly',
    event_date: '2025-01-29',
    event_time: '14:00:00',
    available_slots: 30,
    booked_slots: 5,
    price: 1000, // $10.00 in cents
    status: 'active',
    title: 'Bi-Weekly Harvest Experience',
    description: 'Join us for a guided tour of our farm. Learn to grow groceries, pick and eat from trees, and walk through our food forest.',
    activities: [
      'Learn To Grow Your Own Groceries',
      'Pick and Eat Right Off Our Trees',
      'Walk in a Food Forest',
      'Breathe Fresh Farm Air'
    ],
    location: process.env.CLIENT_ADDRESS_LINE1 && process.env.CLIENT_ADDRESS_LINE2 ? `${process.env.CLIENT_ADDRESS_LINE1}, ${process.env.CLIENT_ADDRESS_LINE2}` : '—',
    duration_minutes: 90,
    special_notes: 'Kids free! Please wear comfortable walking shoes.',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  },
  
  // Helper function to generate bi-weekly tour dates
  generateBiWeeklyDates: (startDate, monthsAhead = 6) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + monthsAhead);
    
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 14); // Add 2 weeks
    }
    
    return dates;
  }
};

