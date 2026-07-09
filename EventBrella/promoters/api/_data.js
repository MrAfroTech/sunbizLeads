const TIERS = [
  {
    id: 't1',
    num: 'Tier 01',
    name: 'General Admission',
    price: '$15',
    desc: "You're in. Simple as that.",
    features: ['Entry 10PM–2AM', 'Mobile ticket, no printing', 'In-app drink ordering'],
  },
  {
    id: 't2',
    num: 'Tier 02',
    name: 'Parking Plus',
    price: '$25',
    desc: 'Skip the lot. Your spot is already yours.',
    features: ['Everything in GA', 'Reserved parking, guaranteed', 'One QR for the gate and the lot'],
  },
  {
    id: 't3',
    num: 'Tier 03',
    name: 'VIP Fast Pass',
    price: '$75',
    desc: 'Walk past the line like you own the place.',
    features: [
      'Everything in Parking Plus',
      'Priority entry, no line',
      'Welcome shot on arrival',
      'Reserved standing section',
    ],
  },
  {
    id: 't4',
    num: 'Tier 04',
    name: 'VIP Booth',
    price: '$450',
    priceNote: '/4',
    desc: 'Your table. Your bottle. Your corner of the room.',
    features: [
      'Everything in Fast Pass ×4',
      'Reserved booth, full night',
      '1 bottle included',
      'Dedicated table service',
    ],
  },
  {
    id: 't5',
    num: 'Tier 05',
    name: 'All-Access',
    price: '$850',
    priceNote: '/4',
    badge: 'Most Flex',
    desc: 'The whole night, handled — nothing to think about but showing up.',
    features: [
      'Everything in VIP Booth',
      'Valet parking included',
      '2 bottles + mixers',
      'Host greets you at the door',
      'We remember your order next time',
    ],
  },
];

const CHECKOUT_PREVIEW = {
  title: 'Tuesday Reset — 6/30',
  subtitle: 'Sayles Orlando · 10PM–2AM',
  lines: [
    { label: 'VIP Fast Pass ×1', value: '$75.00' },
    { label: 'Reserved parking', value: 'Included' },
    { label: 'Service fee', value: '$3.50' },
  ],
  total: '$78.50',
};

module.exports = { TIERS, CHECKOUT_PREVIEW };
