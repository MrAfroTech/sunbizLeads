(function () {
  var calc = window.MainStreetCalc;
  var p = new URLSearchParams(window.location.search);
  var stored = calc.loadResults();
  var data = calc.parseFromSearchParams(p);

  if (stored) {
    data = Object.assign({}, stored, data);
    calc.saveResults(data);
  }

  document.getElementById('visitorsLost').textContent = calc.formatCount(data.visitorsLost);
  document.getElementById('monthlyGap').textContent = calc.formatCurrency(data.monthlyRevenueGap);
  document.getElementById('annualGap').textContent = calc.formatCurrency(data.annualRevenueGap);
  document.getElementById('uplift10').textContent = calc.formatCurrency(data.uplift10Annual);

  var playbookBtn = document.getElementById('playbookCheckoutBtn');
  if (playbookBtn) {
    playbookBtn.addEventListener('click', function () {
      msStartCheckout('district-retention-playbook', playbookBtn);
    });
  }
})();
