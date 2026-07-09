(function (global) {
  var STORAGE_KEY = 'ms_contact_captured';

  function isContactCaptured() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function markContactCaptured() {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      /* ignore */
    }
  }

  function persistContactEmail(email) {
    try {
      if (email) localStorage.setItem('ms_contact_email', String(email).trim().toLowerCase());
    } catch (e) {
      /* ignore */
    }
  }

  global.MainStreetContact = {
    isContactCaptured: isContactCaptured,
    markContactCaptured: markContactCaptured,
    persistContactEmail: persistContactEmail,
  };
})(typeof window !== 'undefined' ? window : global);
