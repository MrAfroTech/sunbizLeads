(function () {
  var gateEl = document.getElementById('audit-results-gate');
  var resultsEl = document.getElementById('audit-results');
  var summaryEl = document.getElementById('result-venue-summary');
  var leakEl = document.getElementById('result-leak');
  var checklistEl = document.getElementById('result-checklist');
  var zonesEl = document.getElementById('result-zones');
  var loyaltyScoreEl = document.getElementById('result-loyalty-score');
  var loyaltyExplainEl = document.getElementById('result-loyalty-explain');
  var pdfBtn = document.getElementById('audit-pdf-btn');

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderChecklist(items) {
    checklistEl.innerHTML = '';
    items.forEach(function (item) {
      var li = document.createElement('li');
      if (item.highlighted) li.className = 'is-priority';
      li.innerHTML =
        '<span class="rank">' +
        item.rank +
        '</span><span>' +
        escapeHtml(item.label) +
        '</span>';
      checklistEl.appendChild(li);
    });
  }

  function renderZones(zones) {
    zonesEl.innerHTML = '';
    zones.forEach(function (z) {
      var row = document.createElement('div');
      row.className = 'audit-zone-row';

      var labelRow = document.createElement('div');
      labelRow.className = 'zone-label';
      labelRow.innerHTML =
        '<span>' +
        escapeHtml(z.label) +
        '</span><span>' +
        z.percent +
        '% · ' +
        AuditLogic.formatCurrency(z.amount) +
        '</span>';

      var track = document.createElement('div');
      track.className = 'audit-zone-track';
      var fill = document.createElement('div');
      fill.className = 'audit-zone-fill';
      fill.style.width = z.percent + '%';
      track.appendChild(fill);

      row.appendChild(labelRow);
      row.appendChild(track);
      zonesEl.appendChild(row);
    });
  }

  function render(results) {
    var a = results.answers;
    summaryEl.textContent =
      a.venueType +
      ' · ' +
      Number(a.dailyGuests).toLocaleString() +
      ' guests/day · ' +
      AuditLogic.formatCurrency(Number(a.avgOrderValue)) +
      ' avg order';

    leakEl.textContent = results.revenueLeakFormatted;
    if (document.getElementById('result-daily-leak')) {
      document.getElementById('result-daily-leak').textContent =
        "That's " + results.dailyLeakFormatted + " you're losing today while you read this.";
    }
    renderChecklist(results.deploymentChecklist);
    renderZones(results.zoneBreakdown);
    loyaltyScoreEl.textContent = String(results.loyaltyGap.score);
    loyaltyExplainEl.textContent = results.loyaltyGap.explanation;

    pdfBtn.addEventListener('click', function () {
      AuditPdf.generate(results, pdfBtn);
    });
  }

  function init() {
    if (!AuditLogic.hasPurchased()) {
      gateEl.hidden = false;
      return;
    }

    var answers = AuditLogic.loadAnswers();
    if (!answers || !answers.venueType) {
      gateEl.hidden = false;
      return;
    }

    var results = AuditLogic.computeResults(answers);
    resultsEl.hidden = false;
    render(results);
  }

  init();
})();
