(function (global) {
  var ENDPOINT = '/api/log-site-event';
  var SESSION_KEY = 'ms_session_id';

  function getSessionId() {
    try {
      var id = window.localStorage.getItem(SESSION_KEY);
      if (id && String(id).length >= 8) return String(id);
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'ms_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
      window.localStorage.setItem(SESSION_KEY, id);
      return id;
    } catch (e) {
      return 'ms_ephemeral_' + Date.now();
    }
  }

  function looksLikeEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  }

  function logLead(lead) {
    var payload = {
      event_type: 'phone_capture',
      session_id: getSessionId(),
      name: String(lead.name || '').trim(),
      email: String(lead.email || '').trim().toLowerCase(),
      phone: String(lead.phone || '').trim(),
      program_city: lead.programCity ? String(lead.programCity).trim() : '',
      campaign: lead.campaign || 'main-street-starter-kit',
      page_path: window.location.pathname,
      source: 'main_street_funnel',
    };

    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  global.MainStreetLogLead = {
    looksLikeEmail: looksLikeEmail,
    logLead: logLead,
  };
})(typeof window !== 'undefined' ? window : global);
