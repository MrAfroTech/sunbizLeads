(function (global) {
  var STORAGE_KEY = 'ms_district_calc';

  function toNum(value) {
    var n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  function clampPct(n) {
    return Math.min(100, Math.max(0, n));
  }

  function compute(inputs) {
    var traffic = toNum(inputs.footTraffic);
    var firstTimePct = clampPct(toNum(inputs.firstTimePct));
    var avgSpend = toNum(inputs.avgSpend);
    var returnPct = clampPct(toNum(inputs.returnPct));

    var firstTimers = traffic * (firstTimePct / 100);
    var oneAndDone = firstTimers * (1 - returnPct / 100);
    var monthlyLost = oneAndDone * avgSpend;
    var annualGap = monthlyLost * 12;
    var uplift10 = firstTimers * 0.1 * avgSpend * 12;

    return {
      footTraffic: traffic,
      firstTimePct: firstTimePct,
      avgSpend: avgSpend,
      returnPct: returnPct,
      firstTimers: firstTimers,
      visitorsLost: oneAndDone,
      monthlyRevenueGap: monthlyLost,
      annualRevenueGap: annualGap,
      uplift10Annual: uplift10,
    };
  }

  function saveResults(result) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch (e) {
      /* ignore */
    }
  }

  function loadResults() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function toQueryString(result) {
    return new URLSearchParams({
      visitors_lost: String(Math.round(result.visitorsLost)),
      monthly_gap: String(Math.round(result.monthlyRevenueGap)),
      annual_gap: String(Math.round(result.annualRevenueGap)),
      uplift_10: String(Math.round(result.uplift10Annual)),
      foot_traffic: String(Math.round(result.footTraffic)),
      amount: String(Math.round(result.annualRevenueGap)),
      fans: String(Math.round(result.visitorsLost)),
      lost_per_fan: String(result.avgSpend || 0),
    }).toString();
  }

  function resultsUrl(result) {
    var base =
      global.MainStreetPaths && MainStreetPaths.results
        ? MainStreetPaths.results
        : '/mainStreet/calculator/results';
    return base + '?' + toQueryString(result);
  }

  function formatCurrency(n, opts) {
    return new Intl.NumberFormat(
      'en-US',
      Object.assign({ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }, opts || {})
    ).format(n || 0);
  }

  function formatCount(n) {
    return Math.round(n || 0).toLocaleString('en-US');
  }

  function parseFromSearchParams(searchParams) {
    var p = searchParams;
    if (typeof p === 'string') p = new URLSearchParams(p);
    return {
      visitorsLost: parseFloat(p.get('visitors_lost') || p.get('fans')) || 0,
      monthlyRevenueGap: parseFloat(p.get('monthly_gap')) || 0,
      annualRevenueGap: parseFloat(p.get('annual_gap') || p.get('amount')) || 0,
      uplift10Annual: parseFloat(p.get('uplift_10')) || 0,
      avgSpend: parseFloat(p.get('lost_per_fan')) || 0,
    };
  }

  global.MainStreetCalc = {
    STORAGE_KEY: STORAGE_KEY,
    compute: compute,
    saveResults: saveResults,
    loadResults: loadResults,
    toQueryString: toQueryString,
    resultsUrl: resultsUrl,
    formatCurrency: formatCurrency,
    formatCount: formatCount,
    parseFromSearchParams: parseFromSearchParams,
  };
})(typeof window !== 'undefined' ? window : global);
