(function (global) {
  var BASE = '/mainStreet';
  var CALC = BASE + '/calculator';
  global.MainStreetPaths = {
    base: BASE,
    splash: BASE + '/',
    calculator: CALC + '/',
    results: CALC + '/results',
    playbook: BASE + '/playbook',
    css: {
      watchVsOrder: BASE + '/css/watch-vs-order.css',
      leadModal: BASE + '/css/sports-lead-modal.css',
    },
  };
})(typeof window !== 'undefined' ? window : global);
