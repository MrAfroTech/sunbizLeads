(function () {
  var MODAL_SHOWN_KEY = 'modalShown';
  var MOBILE_SCROLL_THRESHOLD = 300;
  var exitIntentBound = false;

  function getResultsCopy() {
    var calc = window.MainStreetCalc;
    var data = null;
    if (calc && calc.loadResults) data = calc.loadResults();
    if (!data) {
      try {
        data = calc.parseFromSearchParams(window.location.search);
      } catch (e) {
        data = {};
      }
    }
    if (!calc) return null;
    return {
      amount: calc.formatCurrency(data.annualRevenueGap),
      fans: calc.formatCount(data.visitorsLost),
      lostPerFan: calc.formatCurrency(data.avgSpend || 0, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      annualRaw: data.annualRevenueGap || 0,
      visitorsRaw: data.visitorsLost || 0,
    };
  }

  function bindLeadModal(options) {
    options = options || {};
    var overlay = document.getElementById('ms-lead-modal-overlay');
    if (!overlay) return;

    var copy = getResultsCopy();
    var headline = document.getElementById('ms-lead-modal-headline');
    var text1 = document.getElementById('ms-lead-modal-text-1');
    var text2 = document.getElementById('ms-lead-modal-text-2');
    var submitBtn = document.getElementById('ms-lead-submit');

    if (copy && headline) {
      headline.innerHTML =
        '<strong>' +
        copy.amount +
        '</strong> is leaving your district every year.';
    }
    if (copy && text1) {
      text1.innerHTML =
        "That's <strong>" +
        copy.fans +
        '</strong> visitors a month who spent money, had a good time, and never came back — because nobody gave them a reason to.';
    }
    if (text2) {
      text2.textContent =
        "Drop your info and we'll send you the District Retention Starter Kit — the first three moves any Main Street program can make this month, at zero cost.";
    }
    if (submitBtn) {
      submitBtn.textContent = 'Send Me The Starter Kit';
    }

    function dismiss() {
      if (window.MainStreetContact) MainStreetContact.markContactCaptured();
      overlay.hidden = true;
    }

    function showError(msg) {
      var err = document.getElementById('ms-lead-form-error');
      if (!err) return;
      err.textContent = msg || '';
      err.hidden = !msg;
    }

    function onSubmit(ev) {
      ev.preventDefault();
      showError('');
      var nameEl = document.getElementById('ms-lead-name');
      var emailEl = document.getElementById('ms-lead-email');
      var phoneEl = document.getElementById('ms-lead-phone');
      var programEl = document.getElementById('ms-lead-program');
      if (!nameEl || !emailEl || !phoneEl) return;

      var name = String(nameEl.value || '').trim();
      var email = String(emailEl.value || '').trim().toLowerCase();
      var phone = String(phoneEl.value || '').trim();
      var programCity = programEl ? String(programEl.value || '').trim() : '';

      if (!name) {
        showError('Please enter your name.');
        return;
      }
      if (!MainStreetLogLead.looksLikeEmail(email)) {
        showError('Please enter a valid email address.');
        return;
      }
      if (!phone) {
        showError('Please enter your phone number.');
        return;
      }
      if (programEl && !programCity) {
        showError('Please enter your program or city.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      MainStreetLogLead.logLead({
        name: name,
        email: email,
        phone: phone,
        programCity: programCity,
        campaign: options.campaign || 'main-street-starter-kit',
      })
        .then(function (res) {
          if (!res.ok) throw new Error('fail');
          MainStreetContact.persistContactEmail(email);
          dismiss();
        })
        .catch(function () {
          showError('Something went wrong. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Me The Starter Kit';
        });
    }

    document.getElementById('ms-lead-modal-close').addEventListener('click', dismiss);
    document.getElementById('ms-lead-modal-dismiss').addEventListener('click', dismiss);
    document.getElementById('ms-lead-form').addEventListener('submit', onSubmit);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) dismiss();
    });
  }

  function hasShownThisSession() {
    try {
      return sessionStorage.getItem(MODAL_SHOWN_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function markShownThisSession() {
    try {
      sessionStorage.setItem(MODAL_SHOWN_KEY, 'true');
    } catch (e) {
      // Ignore storage errors in restricted environments.
    }
  }

  function showModalIfEligible() {
    if (hasShownThisSession()) return false;
    if (window.MainStreetContact && MainStreetContact.isContactCaptured()) return false;
    var overlay = document.getElementById('ms-lead-modal-overlay');
    if (!overlay || !overlay.hidden) return false;
    markShownThisSession();
    overlay.hidden = false;
    return true;
  }

  function scheduleModal() {
    if (exitIntentBound) return;
    exitIntentBound = true;

    var lastScrollY = window.pageYOffset || 0;
    var hasScrolledDownThreshold = lastScrollY >= MOBILE_SCROLL_THRESHOLD;

    document.addEventListener('mouseleave', function (event) {
      if (!event || event.clientY > 0) return;
      if (showModalIfEligible()) {
        exitIntentBound = false;
      }
    });

    window.addEventListener(
      'scroll',
      function () {
        var currentScrollY = window.pageYOffset || 0;
        if (currentScrollY >= MOBILE_SCROLL_THRESHOLD) {
          hasScrolledDownThreshold = true;
        }

        if (hasScrolledDownThreshold && currentScrollY < lastScrollY) {
          showModalIfEligible();
        }

        lastScrollY = currentScrollY;
      },
      { passive: true }
    );
  }

  function init() {
    bindLeadModal();
    if (document.body.dataset.msScheduleModal === 'true') {
      scheduleModal();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MainStreetLeadModal = { scheduleModal: scheduleModal, bindLeadModal: bindLeadModal };
})();
