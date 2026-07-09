(function () {
  var calc = window.MainStreetCalc;

  function renderInlineResults(result) {
    document.getElementById('outVisitorsLost').textContent = calc.formatCount(result.visitorsLost);
    document.getElementById('outMonthlyGap').textContent = calc.formatCurrency(result.monthlyRevenueGap);
    document.getElementById('outAnnualGap').textContent = calc.formatCurrency(result.annualRevenueGap);
    document.getElementById('outUplift10').textContent = calc.formatCurrency(result.uplift10Annual);
    document.getElementById('inlineResults').hidden = false;
    document.getElementById('ctaHeadlineAmount').textContent = calc.formatCurrency(result.annualRevenueGap);

    var guideBtn = document.getElementById('inlineGuideBtn');
    if (guideBtn) {
      guideBtn.textContent =
        'Get The District Retention Playbook — $17';
    }
  }

  function handleCalculate() {
    var result = calc.compute({
      footTraffic: document.getElementById('footTraffic').value,
      firstTimePct: document.getElementById('firstTimePct').value,
      avgSpend: document.getElementById('avgSpend').value,
      returnPct: document.getElementById('returnPct').value,
    });

    calc.saveResults(result);
    renderInlineResults(result);

    var url = calc.resultsUrl(result);
    var link = document.getElementById('viewResultsLink');
    if (link) link.href = url;
    window.open(url, '_blank', 'noopener,noreferrer');

    if (window.MainStreetLeadModal) {
      window.MainStreetLeadModal.scheduleModal();
    }

    document.getElementById('inlineResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.getElementById('calcBtn').addEventListener('click', handleCalculate);

  var scrollBtn = document.getElementById('scroll-to-calc');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      document.getElementById('calculator-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  var guideBtn = document.getElementById('inlineGuideBtn');
  if (guideBtn) {
    guideBtn.addEventListener('click', function () {
      msStartCheckout('district-retention-playbook', guideBtn);
    });
  }

  var demoBtn = document.getElementById('scheduleDemoBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', function () {
      window.open(
        'https://calendly.com/staying-ahead-of-the-game/seamless-chat-clone',
        '_blank',
        'noopener,noreferrer'
      );
    });
  }
})();
