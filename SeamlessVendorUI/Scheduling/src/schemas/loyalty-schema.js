/**
 * Coffee & Conversations Collective - Loyalty Program Schemas
 * Complete loyalty rewards system with tiers, points, and referrals
 */

// ==================== LOYALTY ACCOUNTS SCHEMA ====================
export const loyaltyAccountsSchema = {
  TableName: 'CoffeeConversationsCollective-LoyaltyAccounts',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'customer_id', AttributeType: 'S' },
    { AttributeName: 'tier_level', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CustomerId-Index',
      KeySchema: [
        { AttributeName: 'customer_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'TierLevel-Index',
      KeySchema: [
        { AttributeName: 'tier_level', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

export const loyaltyAccountDocumentStructure = {
  id: 'string', // Primary key - UUID
  customer_id: 'string', // Foreign key to customers table
  points_balance: 'number', // Current points balance
  lifetime_points_earned: 'number', // Total points ever earned
  tier_level: 'string', // 'bronze', 'silver', 'gold', 'platinum'
  tier_start_date: 'string', // ISO date when current tier was achieved
  referral_code: 'string', // Unique referral code for this customer
  total_referrals: 'number', // Count of successful referrals
  birthday: 'string', // ISO date (YYYY-MM-DD)
  birthday_reward_claimed_year: 'number', // Year (e.g., 2025)
  created_at: 'string', // ISO timestamp
  updated_at: 'string' // ISO timestamp
};

// ==================== LOYALTY TRANSACTIONS SCHEMA ====================
export const loyaltyTransactionsSchema = {
  TableName: 'CoffeeConversationsCollective-LoyaltyTransactions',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'customer_id', AttributeType: 'S' },
    { AttributeName: 'created_at', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CustomerId-CreatedAt-Index',
      KeySchema: [
        { AttributeName: 'customer_id', KeyType: 'HASH' },
        { AttributeName: 'created_at', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

export const loyaltyTransactionDocumentStructure = {
  id: 'string', // Primary key - UUID
  customer_id: 'string', // Foreign key to customers table
  transaction_type: 'string', // 'earned', 'redeemed', 'bonus', 'referral', 'birthday', 'expired'
  points: 'number', // Points amount (positive for earned, negative for redeemed)
  booking_id: 'string', // Related booking ID (if applicable)
  description: 'string', // Transaction description
  balance_after: 'number', // Points balance after transaction
  created_at: 'string' // ISO timestamp
};

// ==================== LOYALTY TIERS SCHEMA ====================
export const loyaltyTiersSchema = {
  TableName: 'CoffeeConversationsCollective-LoyaltyTiers',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

export const loyaltyTierDocumentStructure = {
  id: 'string', // Primary key - tier name (bronze, silver, gold, platinum)
  name: 'string', // Display name
  min_points_required: 'number', // Minimum lifetime points for tier
  benefits: 'object', // Tier benefits
  color_code: 'string', // Hex color for UI
  icon: 'string', // Icon URL or name
  created_at: 'string', // ISO timestamp
  updated_at: 'string' // ISO timestamp
};

export const sampleLoyaltyTiers = [
  {
    id: 'bronze',
    name: 'Bronze',
    min_points_required: 0,
    benefits: {
      discount_percentage: 5,
      points_multiplier: 1.0,
      priority_booking: false,
      free_upgrades: false,
      birthday_bonus_points: 100,
      early_access: false
    },
    color_code: '#CD7F32',
    icon: 'bronze-medal',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'silver',
    name: 'Silver',
    min_points_required: 1000,
    benefits: {
      discount_percentage: 10,
      points_multiplier: 1.1,
      priority_booking: true,
      free_upgrades: false,
      birthday_bonus_points: 250,
      early_access: false
    },
    color_code: '#C0C0C0',
    icon: 'silver-medal',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'gold',
    name: 'Gold',
    min_points_required: 2500,
    benefits: {
      discount_percentage: 15,
      points_multiplier: 1.25,
      priority_booking: true,
      free_upgrades: true,
      birthday_bonus_points: 500,
      early_access: true
    },
    color_code: '#FFD700',
    icon: 'gold-medal',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    min_points_required: 5000,
    benefits: {
      discount_percentage: 20,
      points_multiplier: 1.5,
      priority_booking: true,
      free_upgrades: true,
      birthday_bonus_points: 1000,
      early_access: true,
      vip_perks: true,
      complimentary_services: true
    },
    color_code: '#E5E4E2',
    icon: 'platinum-medal',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// ==================== LOYALTY REWARDS SCHEMA ====================
export const loyaltyRewardsSchema = {
  TableName: 'CoffeeConversationsCollective-LoyaltyRewards',
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

export const loyaltyRewardDocumentStructure = {
  id: 'string', // Primary key - UUID
  name: 'string', // Reward name
  description: 'string', // Reward description
  points_cost: 'number', // Points required to redeem
  reward_type: 'string', // 'discount', 'free_service', 'upgrade', 'merchandise'
  reward_value: 'number', // Dollar value or percentage
  tier_required: 'string', // Minimum tier (null for all tiers)
  active: 'boolean', // Is reward currently available
  image_url: 'string', // Reward image
  terms: 'string', // Terms and conditions
  expiration_days: 'number', // Days until reward expires after redemption
  created_at: 'string', // ISO timestamp
  updated_at: 'string' // ISO timestamp
};

export const sampleLoyaltyRewards = [
  {
    id: 'reward_discount_5',
    name: '$5 Off Any Service',
    description: 'Redeem for $5 off your next service booking.',
    points_cost: 500,
    reward_type: 'discount',
    reward_value: 5,
    tier_required: null,
    active: true,
    image_url: '/images/rewards/discount-5.jpg',
    terms: 'Valid on any service. Cannot be combined with other offers.',
    expiration_days: 90,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'reward_massage_upgrade',
    name: 'Free 30-Min Massage Upgrade',
    description: 'Upgrade any 60-minute massage to 90 minutes at no extra cost.',
    points_cost: 1000,
    reward_type: 'upgrade',
    reward_value: 30,
    tier_required: null,
    active: true,
    image_url: '/images/rewards/massage-upgrade.jpg',
    terms: 'Valid on Swedish, Deep Tissue, or Aromatherapy massages.',
    expiration_days: 60,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'reward_free_coffee',
    name: 'Free Cafe Item',
    description: 'Complimentary coffee, tea, or pastry with your next service.',
    points_cost: 2000,
    reward_type: 'free_service',
    reward_value: 8,
    tier_required: null,
    active: true,
    image_url: '/images/rewards/free-coffee.jpg',
    terms: 'Must be redeemed in conjunction with a paid service booking.',
    expiration_days: 30,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'reward_free_massage_90',
    name: 'Free 90-Min Massage',
    description: 'Complimentary 90-minute Swedish or Aromatherapy massage.',
    points_cost: 5000,
    reward_type: 'free_service',
    reward_value: 120,
    tier_required: 'gold',
    active: true,
    image_url: '/images/rewards/free-massage.jpg',
    terms: 'Subject to availability. Must book at least 48 hours in advance.',
    expiration_days: 180,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'reward_podcast_session',
    name: 'Free Podcast Studio Hour',
    description: 'One hour of free podcast studio time.',
    points_cost: 3500,
    reward_type: 'free_service',
    reward_value: 75,
    tier_required: 'silver',
    active: true,
    image_url: '/images/rewards/podcast-studio.jpg',
    terms: 'Equipment provided. Does not include production services.',
    expiration_days: 90,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// ==================== REFERRALS SCHEMA ====================
export const referralsSchema = {
  TableName: 'CoffeeConversationsCollective-Referrals',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'referrer_id', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ReferrerId-Index',
      KeySchema: [
        { AttributeName: 'referrer_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'Status-Index',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

export const referralDocumentStructure = {
  id: 'string', // Primary key - UUID
  referrer_id: 'string', // Customer who made the referral
  referred_id: 'string', // New customer who was referred
  referral_code: 'string', // Referral code used
  status: 'string', // 'pending', 'completed', 'expired'
  points_awarded: 'number', // Points given to referrer
  referred_points_awarded: 'number', // Points given to new customer
  created_at: 'string', // ISO timestamp
  completed_at: 'string' // ISO timestamp when referral completed
};

export const sampleReferralDocument = {
  id: 'referral_abc123',
  referrer_id: 'customer_existing_001',
  referred_id: 'customer_new_002',
  referral_code: 'SARAH2025',
  status: 'completed',
  points_awarded: 500,
  referred_points_awarded: 250,
  created_at: '2025-10-01T10:00:00Z',
  completed_at: '2025-10-15T14:30:00Z'
};

// ==================== SAMPLE LOYALTY ACCOUNT ====================
export const sampleLoyaltyAccount = {
  id: 'loyalty_account_001',
  customer_id: 'customer_9876543210fedcba',
  points_balance: 3250,
  lifetime_points_earned: 7850,
  tier_level: 'gold',
  tier_start_date: '2025-06-15',
  referral_code: 'SARAH2025',
  total_referrals: 3,
  birthday: '1988-07-22',
  birthday_reward_claimed_year: 2024,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2025-10-20T15:30:00Z'
};

