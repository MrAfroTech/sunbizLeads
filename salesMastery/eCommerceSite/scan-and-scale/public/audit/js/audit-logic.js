(function (global) {
  const STORAGE_KEY = 'sns_qr_audit';
  const PURCHASE_KEY = 'sns_qr_audit_purchased';

  const VENUE_TYPES = [
    'Stadium / Arena',
    'Bar',
    'Quick Service Restaurant',
    'Food Truck',
    'Festival or Event',
    'District or Main Street',
  ];

  const IDLE_ZONES = [
  { id: 'queue', label: 'Waiting in line', weight: 0.28 },
  { id: 'seating', label: 'Seated at tables', weight: 0.22 },
  { id: 'bar', label: 'Standing at bar', weight: 0.18 },
  { id: 'concourse', label: 'Walking concourse or common areas', weight: 0.2 },
  { id: 'pickup', label: 'Waiting at pickup counter', weight: 0.12 },
  ];

  const VENUE_DEPLOYMENT_BASE = {
    'Stadium / Arena': [
      { zone: 'seating', label: 'In-seat ordering (sections & suites)' },
      { zone: 'concourse', label: 'Concourse high-traffic zones' },
      { zone: 'queue', label: 'Concession stand queue lines' },
      { zone: 'entry', label: 'Entry gates & fan plaza' },
      { zone: 'pickup', label: 'Pickup counters & express lanes' },
    ],
    Bar: [
      { zone: 'bar', label: 'Bar rail & standing zones' },
      { zone: 'seating', label: 'Table and booth seating' },
      { zone: 'queue', label: 'Peak-hour entry & bar lines' },
      { zone: 'pickup', label: 'Food pickup window' },
      { zone: 'concourse', label: 'Patio & overflow areas' },
    ],
    'Quick Service Restaurant': [
      { zone: 'queue', label: 'Order line & menu boards' },
      { zone: 'pickup', label: 'Pickup counter & mobile order shelf' },
      { zone: 'seating', label: 'Dining room tables' },
      { zone: 'entry', label: 'Entry & drive-thru handoff' },
      { zone: 'concourse', label: 'Lobby & waiting area' },
    ],
    'Food Truck': [
      { zone: 'queue', label: 'Service window queue' },
      { zone: 'entry', label: 'Approach & signage zone' },
      { zone: 'pickup', label: 'Order pickup window' },
      { zone: 'seating', label: 'Nearby seating clusters' },
      { zone: 'concourse', label: 'Event foot-traffic paths' },
    ],
    'Festival or Event': [
      { zone: 'concourse', label: 'Vendor row & common areas' },
      { zone: 'queue', label: 'Vendor queue lines' },
      { zone: 'entry', label: 'Gates & wristband checkpoints' },
      { zone: 'seating', label: 'Lawn & seating zones' },
      { zone: 'pickup', label: 'Express pickup stations' },
    ],
    'District or Main Street': [
      { zone: 'entry', label: 'Sidewalk & storefront entry' },
      { zone: 'concourse', label: 'Walkable district corridors' },
      { zone: 'seating', label: 'Outdoor dining & patios' },
      { zone: 'queue', label: 'Peak-hour lines at anchor venues' },
      { zone: 'pickup', label: 'Shared pickup hubs' },
    ],
  };

  const IDLE_TO_ZONE = {
    'Waiting in line': 'queue',
    'Seated at tables': 'seating',
    'Standing at bar': 'bar',
    'Walking concourse or common areas': 'concourse',
    'Waiting at pickup counter': 'pickup',
  };

  const QUESTIONS = [
    {
      id: 'venueType',
      text: 'What type of venue do you operate?',
      type: 'single',
      options: VENUE_TYPES,
    },
    {
      id: 'dailyGuests',
      text: 'How many guests do you serve on a typical day?',
      type: 'number',
      min: 1,
      placeholder: 'e.g. 250',
    },
    {
      id: 'avgOrderValue',
      text: 'What is your average order or transaction value per guest?',
      type: 'currency',
      min: 0.01,
      placeholder: 'e.g. 18.50',
    },
    {
      id: 'hoursOpen',
      text: 'How many hours per day is your venue open or operational?',
      type: 'number',
      min: 1,
      max: 24,
      placeholder: 'e.g. 10',
    },
    {
      id: 'qrDeployed',
      text: 'Do you currently have any form of QR ordering deployed?',
      type: 'single',
      options: [
        'No — never tried it',
        'Yes — but guests rarely scan',
        'Yes — and it works okay',
        'Yes — and it works well',
      ],
    },
    {
      id: 'idleZones',
      text: 'Where do your guests spend the most idle time?',
      type: 'multi',
      options: IDLE_ZONES.map((z) => z.label),
    },
    {
      id: 'contactCapture',
      text: 'Do you currently capture guest contact information at the point of sale?',
      type: 'single',
      options: ['Never', 'Sometimes', 'Always'],
    },
    {
      id: 'returnRate',
      text: 'How often do guests return to your venue?',
      type: 'single',
      options: ['First-time visits mostly', 'Some regulars', 'Mostly regulars'],
    },
    {
      id: 'followUpMarketing',
      text: 'Do you currently run any follow-up marketing to past guests?',
      type: 'single',
      options: ['No', 'Occasionally', 'Yes — regularly'],
    },
    {
      id: 'biggestChallenge',
      text: 'What is your biggest operational challenge right now?',
      type: 'single',
      options: [
        'Long lines or wait times',
        'Low order volume',
        'Staff bandwidth',
        'Low repeat visit rate',
        'No guest data',
      ],
    },
  ];

  function formatCurrency(n) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  }

  function markPurchased(sessionId) {
    try {
      sessionStorage.setItem(PURCHASE_KEY, sessionId || '1');
    } catch (_) {
      /* ignore */
    }
  }

  function hasPurchased() {
    try {
      return Boolean(sessionStorage.getItem(PURCHASE_KEY));
    } catch (_) {
      return false;
    }
  }

  function saveAnswers(answers) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch (_) {
      /* ignore */
    }
  }

  function loadAnswers() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function computeRevenueLeak(answers) {
    const guests = Number(answers.dailyGuests) || 0;
    const aov = Number(answers.avgOrderValue) || 0;
    return guests * aov * 0.2 * 365;
  }

  function computeDeploymentChecklist(answers) {
    const venueType = answers.venueType || VENUE_TYPES[0];
    const base = VENUE_DEPLOYMENT_BASE[venueType] || VENUE_DEPLOYMENT_BASE['Bar'];
    const selectedZones = new Set(
      (answers.idleZones || []).map((label) => IDLE_TO_ZONE[label]).filter(Boolean)
    );

    const ranked = [...base].sort((a, b) => {
      const aHit = selectedZones.has(a.zone) ? 0 : 1;
      const bHit = selectedZones.has(b.zone) ? 0 : 1;
      if (aHit !== bHit) return aHit - bHit;
      return base.indexOf(a) - base.indexOf(b);
    });

    return ranked.map((item, i) => ({
      rank: i + 1,
      label: item.label,
      highlighted: selectedZones.has(item.zone),
    }));
  }

  function computeZoneBreakdown(answers, totalLeak) {
    const selected = answers.idleZones || [];
    if (!selected.length) {
      return IDLE_ZONES.map((z) => ({
        label: z.label,
        percent: Math.round(z.weight * 100),
        amount: totalLeak * z.weight,
      }));
    }

    const weights = selected.map((label) => {
      const zone = IDLE_ZONES.find((z) => z.label === label);
      return { label, weight: zone ? zone.weight : 1 / selected.length };
    });
    const sum = weights.reduce((s, w) => s + w.weight, 0);

    return weights.map((w) => {
      const share = w.weight / sum;
      return {
        label: w.label,
        percent: Math.round(share * 100),
        amount: totalLeak * share,
      };
    });
  }

  function computeLoyaltyGap(answers) {
    const contactMap = { Never: 3, Sometimes: 2, Always: 1 };
    const returnMap = {
      'First-time visits mostly': 3,
      'Some regulars': 2,
      'Mostly regulars': 1,
    };
    const followMap = { No: 4, Occasionally: 2, 'Yes — regularly': 1 };

    const raw =
      (contactMap[answers.contactCapture] || 2) +
      (returnMap[answers.returnRate] || 2) +
      (followMap[answers.followUpMarketing] || 2);

    const score = Math.max(1, Math.min(10, Math.round(((raw - 3) / 7) * 9 + 1)));

    let explanation = 'Moderate guest-data gaps are limiting repeat revenue.';
    if (score >= 8) {
      explanation =
        'You are leaving significant repeat revenue on the table without guest capture and follow-up.';
    } else if (score >= 5) {
      explanation =
        'Partial data capture means you cannot reliably re-engage guests after they leave.';
    } else {
      explanation =
        'Your guest data and follow-up foundation is solid — focus on deployment zones next.';
    }

    return { score, explanation };
  }

  function computeResults(answers) {
    const revenueLeak = computeRevenueLeak(answers);
    const dailyLeak = revenueLeak / 365;
    return {
      revenueLeak,
      revenueLeakFormatted: formatCurrency(revenueLeak),
      dailyLeak,
      dailyLeakFormatted: formatCurrency(dailyLeak),
      deploymentChecklist: computeDeploymentChecklist(answers),
      zoneBreakdown: computeZoneBreakdown(answers, revenueLeak),
      loyaltyGap: computeLoyaltyGap(answers),
      answers,
    };
  }

  global.AuditLogic = {
    STORAGE_KEY,
    PURCHASE_KEY,
    QUESTIONS,
    VENUE_TYPES,
    formatCurrency,
    markPurchased,
    hasPurchased,
    saveAnswers,
    loadAnswers,
    computeResults,
  };
})(typeof window !== 'undefined' ? window : globalThis);
