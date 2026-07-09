/**
 * Calculator engagement tracker — drop into any calculator page via <script>.
 *
 * INTEGRATION
 * -----------
 * 1. Host this file (e.g. /calculator-tracker.js) and add before </body>:
 *
 *    <script
 *      src="/calculator-tracker.js"
 *      data-calculator-name="scan-and-scale"
 *    ></script>
 *
 *    data-calculator-name is required for per-calculator reporting (e.g. "staff-burnout",
 *    "sports", "magic-bands"). Use a short kebab-case label.
 *
 * 2. Custom events from page logic:
 *
 *    CalcTracker.fire('calculator_started');
 *    CalcTracker.fire('calculator_completed');
 *    CalcTracker.fire('cta_clicked');
 *
 * 3. Example — fire on form submit:
 *
 *    document.getElementById('calculator-form').addEventListener('submit', function () {
 *      CalcTracker.fire('calculator_completed');
 *    });
 *
 * 4. Update TRACKER_ENDPOINT below after deploying the track-calculator-event Edge Function.
 *
 * 5. React SPA routes — call CalcTracker.init('wait') on mount (see useCalculatorEngagementTracker).
 *
 * Automatic events: page_load on init; scroll_depth at 25%, 50%, 75%, and 100% (once each).
 */
(function () {
  'use strict';

  var TRACKER_ENDPOINT =
    'https://smqwemfobrqxnpcooigd.supabase.co/functions/v1/track-calculator-event';

  var SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcXdlbWZvYnJxeG5wY29vaWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDU0NTksImV4cCI6MjA4ODQ4MTQ1OX0.RUORYM3XXRj8PXsjWiS9UOpzvhLcJmVlIh-QDWQF6FI';

  var SESSION_KEY = 'calc_tracker_session_id';
  var SCROLL_THRESHOLDS = [25, 50, 75, 100];
  var SCROLL_THROTTLE_MS = 200;

  var scriptEl = document.currentScript;
  var defaultCalculatorName =
    (scriptEl && scriptEl.getAttribute('data-calculator-name')
      ? scriptEl.getAttribute('data-calculator-name').trim()
      : null) ||
    (typeof window !== 'undefined' && window.CALC_TRACKER_NAME
      ? String(window.CALC_TRACKER_NAME).trim()
      : null);

  function getCalculatorName() {
    if (typeof window !== 'undefined' && window.CALC_TRACKER_NAME) {
      var live = String(window.CALC_TRACKER_NAME).trim();
      if (live) return live;
    }
    return defaultCalculatorName;
  }

  var sessionId = (function () {
    try {
      var existing = sessionStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      var id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_KEY, id);
      return id;
    } catch (_e) {
      return 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }
  })();

  var firedScrollDepths = {};
  var attributionContext = {};

  function decodeQueryParam(raw) {
    if (raw == null || raw === '') return '';
    try {
      return decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim();
    } catch (_e) {
      return String(raw).trim();
    }
  }

  /** Keep in sync with journeyContactHelpers.sanitizeContactFieldValue */
  function isUnresolvedMergeTag(value) {
    var trimmed = String(value == null ? '' : value).trim();
    if (!trimmed) return false;
    if (/\{\{[\s\S]*?\}\}/.test(trimmed)) return true;
    if (/\*\|[^|]+\|\*/.test(trimmed)) return true;
    if (/%\w+%/.test(trimmed)) return true;
    if (/\[\[[\w.]+\]\]/.test(trimmed)) return true;
    if (/^\{[A-Z0-9_]+\}$/.test(trimmed)) return true;
    if (trimmed.indexOf('{{') !== -1 || trimmed.indexOf('}}') !== -1) return true;
    if (trimmed.indexOf('*|') !== -1 || trimmed.indexOf('|*') !== -1) return true;
    return false;
  }

  function sanitizeContactFieldValue(value) {
    var trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed || isUnresolvedMergeTag(trimmed)) return '';
    return trimmed;
  }

  /** Mirrors journeyContactHelpers — email, contact, name, firstName, lastName, phone */
  function getContactFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var email = sanitizeContactFieldValue(decodeQueryParam(params.get('email')));
    if (!email || email.indexOf('@') === -1) {
      email = sanitizeContactFieldValue(decodeQueryParam(params.get('contact')));
    }
    if (!email || email.indexOf('@') === -1) email = '';
    else email = email.toLowerCase();

    var firstName = sanitizeContactFieldValue(
      decodeQueryParam(params.get('firstName')) || decodeQueryParam(params.get('first_name'))
    );
    var lastName = sanitizeContactFieldValue(
      decodeQueryParam(params.get('lastName')) || decodeQueryParam(params.get('last_name'))
    );
    var name = sanitizeContactFieldValue(decodeQueryParam(params.get('name')));

    if (!firstName && name) {
      firstName = name.split(/\s+/)[0] || '';
    }
    if (!lastName && name) {
      var nameParts = name.split(/\s+/);
      if (nameParts.length > 1) lastName = nameParts.slice(1).join(' ');
    }
    if (!name && (firstName || lastName)) {
      name = [firstName, lastName].filter(Boolean).join(' ');
    }

    var phone = sanitizeContactFieldValue(decodeQueryParam(params.get('phone')));
    var venueName = sanitizeContactFieldValue(
      decodeQueryParam(params.get('venueName')) ||
        decodeQueryParam(params.get('venue_name')) ||
        decodeQueryParam(params.get('venue')) ||
        decodeQueryParam(params.get('company')) ||
        decodeQueryParam(params.get('organization'))
    );
    var out = {};
    if (firstName) out.first_name = firstName;
    if (lastName) out.last_name = lastName;
    if (name) out.name = name;
    if (email) out.email = email;
    if (phone) {
      out.phone = phone;
      out.phone_number = phone;
    }
    if (venueName) out.venue_name = venueName;

    var persona = decodeQueryParam(params.get('persona'));
    var orderingMethod =
      decodeQueryParam(params.get('orderingMethod')) ||
      decodeQueryParam(params.get('ordering_method'));
    var peakNightCustomers =
      decodeQueryParam(params.get('peakNightCustomers')) ||
      decodeQueryParam(params.get('peak_night_customers')) ||
      decodeQueryParam(params.get('peakCustomers'));
    var averageSpend =
      decodeQueryParam(params.get('averageSpendPerCustomer')) ||
      decodeQueryParam(params.get('average_spend')) ||
      decodeQueryParam(params.get('avgSpend'));
    if (persona) out.persona = persona;
    if (orderingMethod) out.ordering_method = orderingMethod;
    if (peakNightCustomers) out.peak_night_customers = peakNightCustomers;
    if (averageSpend) out.average_spend_per_customer = averageSpend;

    return out;
  }

  function mergeAttribution(payload, metadata) {
    var merged = Object.assign({}, getContactFromUrl(), attributionContext);
    if (metadata && typeof metadata === 'object') {
      merged = Object.assign({}, merged, metadata);
    }
    if (merged.ab_variant) payload.ab_variant = merged.ab_variant;
    if (merged.persona) payload.persona = merged.persona;
    if (merged.ordering_method) payload.ordering_method = merged.ordering_method;
    if (merged.lead_score != null && merged.lead_score !== '') {
      payload.lead_score = merged.lead_score;
    }
    if (merged.first_name) payload.first_name = merged.first_name;
    if (merged.last_name) payload.last_name = merged.last_name;
    if (merged.name) payload.name = merged.name;
    if (merged.email) payload.email = merged.email;
    if (merged.phone) payload.phone = merged.phone;
    if (merged.phone_number) payload.phone_number = merged.phone_number;
    if (merged.venue_name) payload.venue_name = merged.venue_name;
    if (merged.peak_night_customers) {
      payload.peak_night_customers = merged.peak_night_customers;
    }
    if (merged.average_spend_per_customer) {
      payload.average_spend_per_customer = merged.average_spend_per_customer;
    }
  }

  function sendEvent(eventType, scrollDepth, metadata) {
    try {
      var payload = {
        session_id: sessionId,
        event_type: eventType,
        page: window.location.pathname,
        referrer: document.referrer || null,
        calculator_name: getCalculatorName(),
      };
      mergeAttribution(payload, metadata);
      if (scrollDepth != null) {
        payload.scroll_depth = scrollDepth;
      }

      fetch(TRACKER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } catch (_e) {}
  }

  function getScrollPercent() {
    var doc = document.documentElement;
    var scrollTop = window.pageYOffset || doc.scrollTop || 0;
    var scrollHeight = doc.scrollHeight - doc.clientHeight;
    if (scrollHeight <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
  }

  function onScrollThrottled() {
    var now = Date.now();
    if (onScrollThrottled._lastRun && now - onScrollThrottled._lastRun < SCROLL_THROTTLE_MS) {
      return;
    }
    onScrollThrottled._lastRun = now;

    var percent = getScrollPercent();
    for (var i = 0; i < SCROLL_THRESHOLDS.length; i++) {
      var threshold = SCROLL_THRESHOLDS[i];
      if (percent >= threshold && !firedScrollDepths[threshold]) {
        firedScrollDepths[threshold] = true;
        sendEvent('scroll_depth', threshold);
      }
    }
  }

  function resetScrollTracking() {
    firedScrollDepths = {};
    onScrollThrottled._lastRun = 0;
  }

  window.CalcTracker = {
    fire: function (eventType, metadata) {
      if (!eventType || typeof eventType !== 'string') return;
      sendEvent(eventType.trim(), null, metadata);
    },
    setContext: function (context) {
      if (!context || typeof context !== 'object') return;
      attributionContext = Object.assign({}, attributionContext, context);
    },
    init: function (name) {
      if (name && typeof name === 'string') {
        window.CALC_TRACKER_NAME = name.trim();
      }
      resetScrollTracking();
      sendEvent('page_load');
      onScrollThrottled();
    },
    getSessionId: function () {
      return sessionId;
    },
  };

  sendEvent('page_load');

  window.addEventListener('scroll', onScrollThrottled, { passive: true });
  window.addEventListener('resize', onScrollThrottled, { passive: true });
  onScrollThrottled();
})();
