(function () {
  var STORAGE_KEY = 'sns_session_id';
  var KEYS = {
    contactId: 'sns_contact_id',
    contact: 'sns_contact',
    email: 'sns_email',
    firstName: 'sns_first_name',
    lastName: 'sns_last_name',
    campaign: 'sns_campaign',
  };
  var ENDPOINT = '/api/log-site-event';

  function getSessionId() {
    try {
      var id = window.localStorage.getItem(STORAGE_KEY);
      if (id && String(id).length >= 8) return String(id);
      id =
        typeof crypto !== 'undefined' &&
        crypto.randomUUID &&
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'sess_' + String(Date.now()) + '_' + String(Math.random()).slice(2, 10);
      window.localStorage.setItem(STORAGE_KEY, id);
      return id;
    } catch (e) {
      return 'sess_ephemeral_' + String(Date.now());
    }
  }

  function queryParams() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function decodeParam(raw) {
    if (raw == null || raw === '') return null;
    try {
      var s = decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim();
      return s || null;
    } catch (e2) {
      var t = String(raw).trim();
      return t || null;
    }
  }

  function normalizeEmail(raw) {
    var s = decodeParam(raw);
    return s ? s.toLowerCase() : null;
  }

  function normalizeText(raw, maxLen) {
    var s = decodeParam(raw);
    if (!s) return null;
    return s.slice(0, maxLen || 500);
  }

  function getStored(key, asEmail) {
    try {
      var raw = window.sessionStorage.getItem(key);
      if ((raw == null || raw === '') && window.localStorage) {
        // Backward compatibility for previously persisted attribution values.
        raw = window.localStorage.getItem(key);
      }
      if (raw == null || raw === '') return null;
      return asEmail ? normalizeEmail(raw) : normalizeText(raw);
    } catch (e) {
      return null;
    }
  }

  function persistKey(key, value) {
    if (!value) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {}
  }

  function firstQuery(q, names) {
    for (var i = 0; i < names.length; i++) {
      var v = decodeParam(q.get(names[i]));
      if (v) return v;
    }
    return null;
  }

  function captureAttributionFromUrl() {
    var q = queryParams();
    var contactId = firstQuery(q, ['contactId', 'contact_id']);
    var email = normalizeEmail(firstQuery(q, ['email', 'contact']));
    var firstName = firstQuery(q, ['firstName', 'first_name', 'firstname']);
    var lastName = firstQuery(q, ['lastName', 'last_name', 'lastname']);
    var campaign = decodeParam(q.get('campaign'));

    if (contactId) persistKey(KEYS.contactId, normalizeText(contactId, 128));
    if (email) {
      persistKey(KEYS.email, email);
      persistKey(KEYS.contact, email);
    }
    if (firstName) persistKey(KEYS.firstName, normalizeText(firstName));
    if (lastName) persistKey(KEYS.lastName, normalizeText(lastName));
    if (campaign) persistKey(KEYS.campaign, normalizeText(campaign, 500));
  }

  function resolveContactId() {
    var q = queryParams();
    return (
      normalizeText(firstQuery(q, ['contactId', 'contact_id']), 128) ||
      getStored(KEYS.contactId)
    );
  }

  function resolveEmail() {
    var q = queryParams();
    return (
      normalizeEmail(firstQuery(q, ['email', 'contact'])) ||
      getStored(KEYS.email, true) ||
      getStored(KEYS.contact, true)
    );
  }

  function resolveFirstName() {
    var q = queryParams();
    return (
      normalizeText(firstQuery(q, ['firstName', 'first_name', 'firstname'])) ||
      getStored(KEYS.firstName)
    );
  }

  function resolveLastName() {
    var q = queryParams();
    return (
      normalizeText(firstQuery(q, ['lastName', 'last_name', 'lastname'])) ||
      getStored(KEYS.lastName)
    );
  }

  function resolveCampaign() {
    var q = queryParams();
    var fromUrl = decodeParam(q.get('campaign'));
    if (fromUrl) return normalizeText(fromUrl, 500);
    return getStored(KEYS.campaign);
  }

  function buildBase() {
    captureAttributionFromUrl();
    var email = resolveEmail();
    return {
      session_id: getSessionId(),
      page_path: (window.location.pathname + (window.location.search || '')).slice(0, 2000),
      contact_id: resolveContactId(),
      email: email,
      contact: email,
      first_name: resolveFirstName(),
      last_name: resolveLastName(),
      campaign: resolveCampaign(),
      referrer: (document.referrer || '').slice(0, 2000) || null,
      user_agent: (navigator.userAgent || '').slice(0, 500) || null,
    };
  }

  function post(payload) {
    try {
      window
        .fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        })
        .catch(function () {});
    } catch (e) {}
  }

  function labelFromEl(el) {
    if (!el || !el.getAttribute) return 'unknown';
    var tracked = el.getAttribute('data-sns-track');
    if (tracked && String(tracked).trim()) return String(tracked).trim().slice(0, 500);
    var aria = el.getAttribute('aria-label');
    if (aria && String(aria).trim()) return String(aria).trim().slice(0, 500);
    var t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t) return t.slice(0, 500);
    return (el.tagName || 'el').toLowerCase();
  }

  function onDocumentClick(ev) {
    var el = ev.target.closest(
      'a[href], button, input[type="submit"], input[type="button"], input[type="reset"]'
    );
    if (!el) return;

    var href = null;
    if (el.tagName === 'A') {
      href = el.getAttribute('href');
    }

    post(
      Object.assign({}, buildBase(), {
        event_type: 'click',
        element_label: labelFromEl(el),
        target_href: href ? String(href).slice(0, 2000) : null,
        link_text:
          (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500) ||
          null,
      })
    );
  }

  function trackEvent(eventType, meta) {
    meta = meta || {};
    var payload = Object.assign({}, buildBase(), {
      event_type: eventType,
      element_label: null,
      target_href: null,
      link_text: null,
    });
    if (meta.page_path) {
      payload.page_path = String(meta.page_path).slice(0, 2000);
    }
    if (meta.seconds != null) {
      payload.element_label = String(meta.seconds);
    }
    if (meta.milestone != null) {
      payload.element_label = String(meta.milestone);
    }
    post(payload);
  }

  function boot() {
    captureAttributionFromUrl();
    post(
      Object.assign({}, buildBase(), {
        event_type: 'page_view',
        element_label: null,
        target_href: null,
        link_text: null,
      })
    );
    document.addEventListener('click', onDocumentClick, true);
  }

  document.addEventListener('DOMContentLoaded', boot);

  var _pageStartTime = Date.now();

  window.addEventListener('beforeunload', function () {
    var elapsed = Math.round((Date.now() - _pageStartTime) / 1000);
    trackEvent('time_on_page', {
      seconds: elapsed,
      page_path: window.location.pathname,
    });
  });

  var _scrollMilestones = { 25: false, 50: false, 75: false, 100: false };

  window.addEventListener('scroll', function () {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    var pct = Math.round((scrollTop / docHeight) * 100);

    [25, 50, 75, 100].forEach(function (milestone) {
      if (!_scrollMilestones[milestone] && pct >= milestone) {
        _scrollMilestones[milestone] = true;
        trackEvent('scroll_depth', {
          milestone: milestone,
          page_path: window.location.pathname,
        });
      }
    });
  });
})();
