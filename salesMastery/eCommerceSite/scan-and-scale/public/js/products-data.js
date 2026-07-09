/** Shared catalog for index + products pages (no secrets). */
const CONTACT_EMAIL = 'hello@seamlessly.us';
const CONTACT_SUBJECT = 'Scan%20%26%20Scale%20%E2%80%94%20Get%20Started';
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${CONTACT_SUBJECT}`;

const COLLECTIONS = [
  'Stadium Systems',
  'Event & Festival Kits',
  'Bars',
  'Quick Service Restaurants',
  'Districts',
  'Food Truck Systems',
  'Wristbands & Add-ons',
];

const PRODUCTS = [
  {
    slug: 'seatflow',
    collection: 'Stadium Systems',
    name: 'SeatFlow™ for Stadiums',
    startingPrice: '$299',
    cta: 'Launch SeatFlow™',
    imageLabel: 'Stadium QR Mockup',
    description:
      'A complete in-seat and concourse deployment that allows fans to order food and drinks without leaving their seats. Reduces concession lines and increases per-cap revenue.',
    includes: [
      'Seat-back QR system',
      'Section-based routing (A/B/C logic)',
      'Concourse QR towers',
      'Suite + VIP ordering flow',
      'Backend setup (included free)',
    ],
    tiers: [
      { id: 'sf-pilot', label: 'Pilot Section (100–300 seats)', priceLabel: '$299', kind: 'stripe', stripePriceKey: 'seatflow-pilot' },
      { id: 'sf-single', label: 'Single Section Deployment', priceLabel: '$799', kind: 'stripe', stripePriceKey: 'seatflow-single' },
      { id: 'sf-multi', label: 'Multi-Section Rollout', priceLabel: '$2,000', kind: 'stripe', stripePriceKey: 'seatflow-multi' },
      { id: 'sf-full', label: 'Full Stadium License', priceLabel: 'Contact for pricing', kind: 'contact' },
    ],
  },
  {
    slug: 'crowdflow',
    collection: 'Event & Festival Kits',
    name: 'CrowdFlow™ for Festivals',
    startingPrice: '$499',
    cta: 'Launch CrowdFlow™',
    imageLabel: 'Festival QR Usage',
    description:
      'A multi-vendor deployment for festivals and events that converts long lines into mobile ordering channels.',
    includes: [
      'Vendor QR ordering kits',
      'Queue-line conversion signage',
      'Ground decals',
      'Unified ordering system',
      'Event onboarding + setup',
    ],
    tiers: [
      { id: 'cf-small', label: 'Small Event (5–10 vendors)', priceLabel: '$499', kind: 'stripe', stripePriceKey: 'crowdflow-small' },
      { id: 'cf-mid', label: 'Mid Event (10–30 vendors)', priceLabel: '$999', kind: 'stripe', stripePriceKey: 'crowdflow-mid' },
      { id: 'cf-large', label: 'Large Festival Deployment', priceLabel: '$3,000', kind: 'stripe', stripePriceKey: 'crowdflow-large' },
      { id: 'cf-enterprise', label: 'Enterprise / Rolling Loud-scale', priceLabel: 'Contact for pricing', kind: 'contact' },
    ],
  },
  {
    slug: 'tabflow',
    collection: 'Bars',
    name: 'TabFlow™ for Bars',
    startingPrice: '$199',
    cta: 'Launch TabFlow™',
    imageLabel: 'Bar Tab QR',
    description:
      'An in-establishment deployment for bars that lets customers open a tab, order drinks and food, and reorder from their seat or barstool — without waiting for a server.',
    includes: [
      'Table tent QR kits',
      'Bar top QR signage',
      'Tab-based ordering flow',
      'Backend setup (included free)',
    ],
    tiers: [
      { id: 'tf-starter', label: 'Starter Kit (1 location)', priceLabel: '$199', kind: 'stripe', stripePriceKey: 'tabflow-starter' },
      { id: 'tf-multi', label: 'Multi-Room / Patio Expansion', priceLabel: '$399', kind: 'stripe', stripePriceKey: 'tabflow-multi-room' },
      { id: 'tf-full', label: 'Full Bar Deployment', priceLabel: '$799', kind: 'stripe', stripePriceKey: 'tabflow-full' },
      { id: 'tf-saas', label: 'SaaS Analytics Add-On', priceLabel: '$49/month', kind: 'stripe', stripePriceKey: 'tabflow-saas-addon' },
    ],
  },
  {
    slug: 'counterflow',
    collection: 'Quick Service Restaurants',
    name: 'CounterFlow™ for QSRs',
    startingPrice: '$199',
    cta: 'Launch CounterFlow™',
    imageLabel: 'QSR Counter QR',
    description:
      'An in-establishment deployment for quick service restaurants that allows customers to scan and order at the counter, window, or door — skipping the line and increasing throughput during peak hours.',
    includes: [
      'Counter QR signage',
      'Door and window ordering decals',
      'Line-skip ordering flow',
      'Backend setup (included free)',
    ],
    tiers: [
      { id: 'co-starter', label: 'Starter Kit (1 location)', priceLabel: '$199', kind: 'stripe', stripePriceKey: 'counterflow-starter' },
      { id: 'co-multi', label: 'Multi-Station Deployment', priceLabel: '$399', kind: 'stripe', stripePriceKey: 'counterflow-multi-station' },
      { id: 'co-full', label: 'Full Location Deployment', priceLabel: '$799', kind: 'stripe', stripePriceKey: 'counterflow-full' },
      { id: 'co-saas', label: 'SaaS Analytics Add-On', priceLabel: '$49/month', kind: 'stripe', stripePriceKey: 'counterflow-saas-addon' },
    ],
  },
  {
    slug: 'districtflow',
    collection: 'Districts',
    name: 'DistrictFlow™ for Downtowns & Districts',
    startingPrice: '$199',
    cta: 'Launch DistrictFlow™',
    imageLabel: 'District Street QR',
    description:
      'An outdoor street-level QR network for walkable districts. Converts foot traffic into orders via signage on light poles, street signs, sidewalk decals, and public spaces — driving customers into nearby venues before they walk through the door.',
    includes: [
      'Street-level QR signage',
      'Light pole and directional signage',
      'Sidewalk and ground decals',
      'Cross-venue unified ordering flow',
      'Main Street cluster network linking',
      'Unified backend dashboard',
      'Free onboarding for anchor venues',
    ],
    tiers: [
      { id: 'df-starter', label: 'Single Venue Starter', priceLabel: '$199', kind: 'stripe', stripePriceKey: 'districtflow-starter' },
      { id: 'df-cluster', label: '3–5 Venue Cluster', priceLabel: '$799', kind: 'stripe', stripePriceKey: 'districtflow-cluster' },
      { id: 'df-full', label: 'Full District Deployment', priceLabel: '$2,000', kind: 'stripe', stripePriceKey: 'districtflow-full' },
      { id: 'df-saas', label: 'SaaS Analytics Add-On', priceLabel: '$49/month per venue', kind: 'stripe', stripePriceKey: 'districtflow-saas-addon' },
    ],
  },
  {
    slug: 'mobileserve',
    collection: 'Food Truck Systems',
    name: 'MobileServe™ for Food Trucks',
    startingPrice: '$79',
    cta: 'Launch MobileServe™',
    imageLabel: 'Food Truck QR Panel',
    description:
      'A mobile deployment for food trucks that allows customers to order before reaching the window, reducing wait times and increasing order volume.',
    includes: [
      'Truck-side QR ordering panel',
      'Window ordering system',
      'Ground queue conversion decals',
      'Portable rapid deployment kit',
      'Backend setup (included free)',
    ],
    tiers: [
      { id: 'ms-single', label: 'Single Truck Kit', priceLabel: '$79', kind: 'stripe', stripePriceKey: 'mobileserve-single' },
      { id: 'ms-event', label: 'Event Ready Kit', priceLabel: '$199', kind: 'stripe', stripePriceKey: 'mobileserve-event' },
      { id: 'ms-multi', label: 'Multi-Truck Bundle (3–5 trucks)', priceLabel: '$499', kind: 'stripe', stripePriceKey: 'mobileserve-multi' },
    ],
  },
  {
    slug: 'scanband',
    collection: 'Wristbands & Add-ons',
    name: 'ScanBand™ for Events',
    startingPrice: '$79',
    cta: 'Launch ScanBand™',
    imageLabel: 'Wristband Scan',
    description:
      'QR-enabled wristbands that allow attendees to order from anywhere in a venue or event. Ideal for VIP access, fast lanes, and repeat ordering.',
    includes: [
      'Custom QR wristbands (vinyl or fabric)',
      'Tier-based routing (VIP optional)',
      'Backend integration',
    ],
    tiers: [
      { id: 'sb-100', label: '100 Wristbands', priceLabel: '$79', kind: 'stripe', stripePriceKey: 'scanband-100' },
      { id: 'sb-500', label: '500 Wristbands', priceLabel: '$249', kind: 'stripe', stripePriceKey: 'scanband-500' },
      { id: 'sb-1000', label: '1,000+ Event Pack', priceLabel: '$499', kind: 'stripe', stripePriceKey: 'scanband-1000' },
      { id: 'sb-vip', label: 'VIP Segmentation Add-On', priceLabel: '$50', kind: 'stripe', stripePriceKey: 'scanband-vip' },
    ],
  },
];
