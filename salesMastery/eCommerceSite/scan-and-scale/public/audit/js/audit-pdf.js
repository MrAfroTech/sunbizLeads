(function (global) {
  const NAVY = [26, 42, 68];
  const GOLD = [212, 175, 55];
  const TEAL = [0, 212, 170];
  const WHITE = [255, 255, 255];
  const MUTED = [180, 188, 200];

  function loadLogoDataUrl() {
    return fetch('/icon.svg')
      .then(function (r) { return r.text(); })
      .then(function (svg) {
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
      })
      .catch(function () { return null; });
  }

  function addSectionTitle(pdf, text, y) {
    pdf.setFillColor.apply(pdf, NAVY);
    pdf.rect(40, y, 515, 28, 'F');
    pdf.setTextColor.apply(pdf, GOLD);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(text, 48, y + 18);
    pdf.setTextColor(40, 40, 40);
    return y + 40;
  }

  function addBodyText(pdf, lines, y) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(50, 50, 50);
    lines.forEach(function (line) {
      pdf.text(line, 48, y);
      y += 16;
    });
    return y + 8;
  }

  function generate(results, buttonEl) {
    if (!global.jspdf || !global.jspdf.jsPDF) {
      alert('PDF library failed to load. Please refresh and try again.');
      return;
    }

    const btn = buttonEl;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Generating PDF…';

    loadLogoDataUrl().then(function (logoUrl) {
      const jsPDF = global.jspdf.jsPDF;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
      let y = 48;

      if (logoUrl) {
        pdf.addImage(logoUrl, 'SVG', 40, y, 36, 36);
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor.apply(pdf, NAVY);
      pdf.text('QR Revenue Audit Report', 88, y + 16);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor.apply(pdf, MUTED);
      pdf.text('Seamlessly · scan-and-scale.seamlessly.us', 88, y + 32);
      y += 56;

      pdf.setDrawColor.apply(pdf, GOLD);
      pdf.setLineWidth(1.5);
      pdf.line(40, y, 572, y);
      y += 24;

      const a = results.answers;
      y = addBodyText(pdf, [
        'Venue type: ' + a.venueType,
        'Daily guests: ' + Number(a.dailyGuests).toLocaleString(),
        'Average order value: ' + global.AuditLogic.formatCurrency(Number(a.avgOrderValue)),
        'Hours open: ' + a.hoursOpen,
        'QR deployment: ' + a.qrDeployed,
        'Biggest challenge: ' + a.biggestChallenge,
      ], y);

      y = addSectionTitle(pdf, '1. Revenue Leak Estimate', y);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor.apply(pdf, TEAL);
      pdf.text(results.revenueLeakFormatted + ' / year', 48, y + 8);
      y += 28;
      y = addBodyText(pdf, [
        'Based on daily guests × average order value × 20% industry uplift × 365 days.',
        'Daily cost of inaction: ' + global.AuditLogic.formatCurrency(results.revenueLeak / 365),
      ], y);

      y = addSectionTitle(pdf, '2. Deployment Priority Checklist', y);
      results.deploymentChecklist.forEach(function (item) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor.apply(pdf, GOLD);
        pdf.text(String(item.rank) + '.', 48, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(50, 50, 50);
        const suffix = item.highlighted ? ' (idle-time priority)' : '';
        pdf.text(item.label + suffix, 64, y);
        y += 16;
      });
      y += 8;

      y = addSectionTitle(pdf, '3. Missed Opportunity by Zone', y);
      results.zoneBreakdown.forEach(function (zone) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(50, 50, 50);
        pdf.text(
          zone.label + ' — ' + zone.percent + '% (' + global.AuditLogic.formatCurrency(zone.amount) + ')',
          48,
          y
        );
        y += 16;
      });
      y += 8;

      y = addSectionTitle(pdf, '4. Data & Loyalty Gap Score', y);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor.apply(pdf, GOLD);
      pdf.text(String(results.loyaltyGap.score) + ' / 10', 48, y + 4);
      y += 22;
      y = addBodyText(pdf, [results.loyaltyGap.explanation], y);

      pdf.setFillColor.apply(pdf, NAVY);
      pdf.rect(0, 720, 612, 72, 'F');
      pdf.setTextColor.apply(pdf, WHITE);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Ready to deploy? Browse your kit at scan-and-scale.seamlessly.us/products', 48, 748);
      pdf.setTextColor.apply(pdf, GOLD);
      pdf.text('© Seamlessly', 48, 764);

      pdf.save('qr-revenue-audit-report.pdf');
      btn.disabled = false;
      btn.textContent = label;
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = label;
      alert('PDF generation failed. Please try again.');
    });
  }

  global.AuditPdf = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
