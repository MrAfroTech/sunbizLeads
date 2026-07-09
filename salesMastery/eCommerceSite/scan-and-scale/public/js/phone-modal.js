(function () {
  var STORAGE_KEY = 'sns_phone_modal_shown';
  var SESSION_KEY = 'sns_session_id';
  var ENDPOINT = '/api/log-site-event';
  var DELAY_MS = 4000;

  function getSessionId() {
    try {
      var id = window.localStorage.getItem(SESSION_KEY);
      if (id && String(id).length >= 8) return String(id);
      id =
        typeof crypto !== 'undefined' &&
        crypto.randomUUID &&
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'sess_' + String(Date.now()) + '_' + String(Math.random()).slice(2, 10);
      window.localStorage.setItem(SESSION_KEY, id);
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
    if (raw == null || raw === '') return '';
    try {
      return decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim();
    } catch (e) {
      return String(raw).trim();
    }
  }

  function looksLikeEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  }

  function shouldShow() {
    if (window.innerWidth < 480) return false;
    if (sessionStorage.getItem(STORAGE_KEY)) return false;
    return true;
  }

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    var overlay = document.getElementById('sns-phone-modal-overlay');
    if (overlay) overlay.hidden = true;
  }

  function prefillFromUrl() {
    var q = queryParams();
    var nameEl = document.getElementById('sns-phone-name');
    var emailEl = document.getElementById('sns-phone-email');
    if (!nameEl || !emailEl) return;

    var name = decodeParam(q.get('name'));
    var email = decodeParam(q.get('email') || q.get('contact'));

    if (name) nameEl.value = name;
    if (email) emailEl.value = email;
  }

  function showError(msg) {
    var err = document.getElementById('sns-phone-form-error');
    if (!err) return;
    if (msg) {
      err.textContent = msg;
      err.hidden = false;
    } else {
      err.textContent = '';
      err.hidden = true;
    }
  }

  function onSubmit(ev) {
    ev.preventDefault();
    showError('');

    var nameEl = document.getElementById('sns-phone-name');
    var emailEl = document.getElementById('sns-phone-email');
    var phoneEl = document.getElementById('sns-phone-number');
    var submitBtn = document.getElementById('sns-phone-submit');
    if (!nameEl || !emailEl || !phoneEl) return;

    var name = String(nameEl.value || '').trim();
    var email = String(emailEl.value || '').trim().toLowerCase();
    var phone = String(phoneEl.value || '').trim();

    if (!name) {
      showError('Please enter your name.');
      nameEl.focus();
      return;
    }
    if (!looksLikeEmail(email)) {
      showError('Please enter a valid email address.');
      emailEl.focus();
      return;
    }
    if (!phone) {
      showError('Please enter your phone number.');
      phoneEl.focus();
      return;
    }

    var q = queryParams();
    var campaign = decodeParam(q.get('campaign'));

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
    }

    var payload = {
      event_type: 'phone_capture',
      session_id: getSessionId(),
      name: name.slice(0, 500),
      email: email,
      phone: phone.slice(0, 50),
      page_path: (window.location.pathname + (window.location.search || '')).slice(0, 2000),
      campaign: campaign ? campaign.slice(0, 500) : null,
      referrer: (document.referrer || '').slice(0, 2000) || null,
      user_agent: (navigator.userAgent || '').slice(0, 500) || null,
    };

    window
      .fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(function (res) {
        if (!res.ok) throw new Error('save_failed');
        dismiss();
      })
      .catch(function () {
        showError('Something went wrong. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
      });
  }

  function init() {
    if (!shouldShow()) return;

    setTimeout(function () {
      var overlay = document.getElementById('sns-phone-modal-overlay');
      if (!overlay) return;

      prefillFromUrl();
      overlay.hidden = false;

      document.getElementById('sns-phone-modal-close').addEventListener('click', dismiss);
      document.getElementById('sns-phone-modal-dismiss').addEventListener('click', dismiss);
      document.getElementById('sns-phone-form').addEventListener('submit', onSubmit);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) dismiss();
      });
    }, DELAY_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
