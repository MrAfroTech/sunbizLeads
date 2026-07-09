/**
 * Checkout catalog — same pattern as seamlesslyUs calculator-plus-checkout:
 * Secret keys via lib/stripe-config.js (STRIPE_TEST_SECRET_KEY / STRIPE_LIVE_SECRET_KEY).
 * Optional STRIPE_PRICE_* env overrides use Dashboard Price IDs when set.
 */

const PRODUCTS = [
  {
    key: 'qr-revenue-audit',
    envVar: 'STRIPE_PRICE_QR_REVENUE_AUDIT',
    amountCents: 1700,
    currency: 'usd',
    productName: 'QR Revenue Audit',
    productDescription:
      '10-question guided venue assessment, revenue leak estimate, deployment checklist, and branded PDF report.',
    mode: 'payment',
  },
  {
    key: 'magic-bands-deployment-blueprint',
    envVar: 'STRIPE_PRICE_MAGIC_BANDS_DEPLOYMENT_BLUEPRINT',
    amountCents: 1700,
    currency: 'usd',
    productName: 'MagicBands Deployment Blueprint',
    productDescription:
      'Your Venue Is Losing Revenue In Line — A venue-specific roadmap showing where guest friction destroys spending behavior and how MagicBand infrastructure recovers it through door flow, access control, and POS-linked service points.',
    mode: 'payment',
  },
  {
    key: 'district-retention-playbook',
    envVar: 'STRIPE_PRICE_DISTRICT_RETENTION_PLAYBOOK',
    amountCents: 1700,
    currency: 'usd',
    productName: 'District Retention Playbook',
    productDescription:
      'A step-by-step Main Street framework for turning foot traffic into loyal regulars — visitor capture without friction, corridor return loops, and city-council-ready numbers.',
    mode: 'payment',
  },
  {
    key: 'seatflow-pilot',
    envVar: 'STRIPE_PRICE_SEATFLOW_PILOT',
    amountCents: 29900,
    productName: 'SeatFlow™ — Pilot Section (100–300 seats)',
    mode: 'payment',
  },
  {
    key: 'seatflow-single',
    envVar: 'STRIPE_PRICE_SEATFLOW_SINGLE',
    amountCents: 79900,
    productName: 'SeatFlow™ — Single Section Deployment',
    mode: 'payment',
  },
  {
    key: 'seatflow-multi',
    envVar: 'STRIPE_PRICE_SEATFLOW_MULTI',
    amountCents: 200000,
    productName: 'SeatFlow™ — Multi-Section Rollout',
    mode: 'payment',
  },
  {
    key: 'crowdflow-small',
    envVar: 'STRIPE_PRICE_CROWDFLOW_SMALL',
    amountCents: 49900,
    productName: 'CrowdFlow™ — Small Event (5–10 vendors)',
    mode: 'payment',
  },
  {
    key: 'crowdflow-mid',
    envVar: 'STRIPE_PRICE_CROWDFLOW_MID',
    amountCents: 99900,
    productName: 'CrowdFlow™ — Mid Event (10–30 vendors)',
    mode: 'payment',
  },
  {
    key: 'crowdflow-large',
    envVar: 'STRIPE_PRICE_CROWDFLOW_LARGE',
    amountCents: 300000,
    productName: 'CrowdFlow™ — Large Festival Deployment',
    mode: 'payment',
  },
  {
    key: 'districtflow-starter',
    envVar: 'STRIPE_PRICE_DISTRICTFLOW_STARTER',
    amountCents: 19900,
    productName: 'DistrictFlow™ — Single Venue Starter',
    mode: 'payment',
  },
  {
    key: 'districtflow-cluster',
    envVar: 'STRIPE_PRICE_DISTRICTFLOW_CLUSTER',
    amountCents: 79900,
    productName: 'DistrictFlow™ — 3–5 Venue Cluster',
    mode: 'payment',
  },
  {
    key: 'districtflow-full',
    envVar: 'STRIPE_PRICE_DISTRICTFLOW_FULL',
    amountCents: 200000,
    productName: 'DistrictFlow™ — Full District Deployment',
    mode: 'payment',
  },
  {
    key: 'districtflow-saas-addon',
    envVar: 'STRIPE_PRICE_DISTRICTFLOW_SAAS_ADDON',
    amountCents: 4900,
    productName: 'DistrictFlow™ — SaaS Analytics Add-On',
    mode: 'subscription',
  },
  {
    key: 'tabflow-starter',
    envVar: 'STRIPE_PRICE_TABFLOW_STARTER',
    amountCents: 19900,
    productName: 'TabFlow™ — Starter Kit (1 location)',
    mode: 'payment',
  },
  {
    key: 'tabflow-multi-room',
    envVar: 'STRIPE_PRICE_TABFLOW_MULTI_ROOM',
    amountCents: 39900,
    productName: 'TabFlow™ — Multi-Room / Patio Expansion',
    mode: 'payment',
  },
  {
    key: 'tabflow-full',
    envVar: 'STRIPE_PRICE_TABFLOW_FULL',
    amountCents: 79900,
    productName: 'TabFlow™ — Full Bar Deployment',
    mode: 'payment',
  },
  {
    key: 'tabflow-saas-addon',
    envVar: 'STRIPE_PRICE_TABFLOW_SAAS_ADDON',
    amountCents: 4900,
    productName: 'TabFlow™ — SaaS Analytics Add-On',
    mode: 'subscription',
  },
  {
    key: 'counterflow-starter',
    envVar: 'STRIPE_PRICE_COUNTERFLOW_STARTER',
    amountCents: 19900,
    productName: 'CounterFlow™ — Starter Kit (1 location)',
    mode: 'payment',
  },
  {
    key: 'counterflow-multi-station',
    envVar: 'STRIPE_PRICE_COUNTERFLOW_MULTI_STATION',
    amountCents: 39900,
    productName: 'CounterFlow™ — Multi-Station Deployment',
    mode: 'payment',
  },
  {
    key: 'counterflow-full',
    envVar: 'STRIPE_PRICE_COUNTERFLOW_FULL',
    amountCents: 79900,
    productName: 'CounterFlow™ — Full Location Deployment',
    mode: 'payment',
  },
  {
    key: 'counterflow-saas-addon',
    envVar: 'STRIPE_PRICE_COUNTERFLOW_SAAS_ADDON',
    amountCents: 4900,
    productName: 'CounterFlow™ — SaaS Analytics Add-On',
    mode: 'subscription',
  },
  {
    key: 'mobileserve-single',
    envVar: 'STRIPE_PRICE_MOBILESERVE_SINGLE',
    amountCents: 7900,
    productName: 'MobileServe™ — Single Truck Kit',
    mode: 'payment',
  },
  {
    key: 'mobileserve-event',
    envVar: 'STRIPE_PRICE_MOBILESERVE_EVENT',
    amountCents: 19900,
    productName: 'MobileServe™ — Event Ready Kit',
    mode: 'payment',
  },
  {
    key: 'mobileserve-multi',
    envVar: 'STRIPE_PRICE_MOBILESERVE_MULTI',
    amountCents: 49900,
    productName: 'MobileServe™ — Multi-Truck Bundle',
    mode: 'payment',
  },
  {
    key: 'scanband-100',
    envVar: 'STRIPE_PRICE_SCANBAND_100',
    amountCents: 7900,
    productName: 'ScanBand™ — 100 Wristbands',
    mode: 'payment',
  },
  {
    key: 'scanband-500',
    envVar: 'STRIPE_PRICE_SCANBAND_500',
    amountCents: 24900,
    productName: 'ScanBand™ — 500 Wristbands',
    mode: 'payment',
  },
  {
    key: 'scanband-1000',
    envVar: 'STRIPE_PRICE_SCANBAND_1000',
    amountCents: 49900,
    productName: 'ScanBand™ — 1,000+ Event Pack',
    mode: 'payment',
  },
  {
    key: 'scanband-vip',
    envVar: 'STRIPE_PRICE_SCANBAND_VIP',
    amountCents: 5000,
    productName: 'ScanBand™ — VIP Segmentation Add-On',
    mode: 'payment',
  },
];

const byKey = new Map(PRODUCTS.map((p) => [p.key, p]));

function resolveStripePriceId(product) {
  if (!product?.envVar) return '';
  return process.env[product.envVar]?.trim() || '';
}

function getProduct(requested) {
  const trimmed = typeof requested === 'string' ? requested.trim() : '';
  if (!trimmed) return null;
  return byKey.get(trimmed) || null;
}

function buildLineItem(product) {
  const configuredPriceId = resolveStripePriceId(product);
  if (configuredPriceId) {
    return { price: configuredPriceId, quantity: 1 };
  }

  const priceData = {
    currency: product.currency || 'usd',
    unit_amount: product.amountCents,
    product_data: {
      name: product.productName,
      ...(product.productDescription
        ? { description: product.productDescription }
        : {}),
    },
  };

  if (product.mode === 'subscription') {
    priceData.recurring = { interval: 'month' };
  }

  return { price_data: priceData, quantity: 1 };
}

module.exports = { PRODUCTS, getProduct, buildLineItem, resolveStripePriceId };
