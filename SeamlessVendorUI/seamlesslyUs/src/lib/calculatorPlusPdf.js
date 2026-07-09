import { jsPDF } from 'jspdf';
import { formatCurrencyDec } from './calculatorPlusLogic';

const NAVY = [26, 42, 68];
const GOLD = [212, 175, 55];
const MUTED = [120, 130, 145];

function addSectionTitle(pdf, text, y) {
  pdf.setFillColor(...NAVY);
  pdf.rect(40, y, 515, 28, 'F');
  pdf.setTextColor(...GOLD);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(text, 48, y + 18);
  pdf.setTextColor(40, 40, 40);
  return y + 40;
}

function addBodyLines(pdf, lines, y) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 50);
  lines.forEach((line) => {
    pdf.text(line, 48, y);
    y += 16;
  });
  return y + 8;
}

async function loadLogoDataUrl() {
  try {
    const res = await fetch('/seamlessly-logo.svg');
    const svg = await res.text();
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } catch {
    return null;
  }
}

export async function generateCalculatorPlusPdf(report) {
  const logoUrl = await loadLogoDataUrl();
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  let y = 48;

  if (logoUrl) {
    pdf.addImage(logoUrl, 'SVG', 40, y, 40, 40);
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...NAVY);
  pdf.text('Calculator Plus Revenue Report', 92, y + 16);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...MUTED);
  pdf.text('Seamlessly · scan-and-scale.seamlessly.us', 92, y + 32);
  y += 56;

  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(1.5);
  pdf.line(40, y, 572, y);
  y += 24;

  y = addBodyLines(
    pdf,
    [
      `Venue type: ${report.venueType}`,
      `Daily covers / guests: ${Number(report.dailyCovers).toLocaleString()}`,
      `Average order value: ${formatCurrencyDec(report.avgOrderValue)}`,
      `Missed revenue (calculator): ${report.missedRevenueFormatted}`,
      `Annual uplift potential: ${report.annualMissedRevenueFormatted}`,
    ],
    y
  );

  y = addSectionTitle(pdf, '1. Deployment Blueprint', y);
  y = addBodyLines(pdf, [report.deploymentBlueprint], y);

  y = addSectionTitle(pdf, '2. Priority-Ranked Opportunities', y);
  report.priorityOpportunities.forEach((item) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...GOLD);
    pdf.text(`${item.rank}.`, 48, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(50, 50, 50);
    pdf.text(`${item.label} — ${item.estimatedImpactFormatted}`, 64, y);
    y += 16;
  });
  y += 8;

  y = addSectionTitle(pdf, '3. ROI Recovery Timeline (Months 1–6)', y);
  report.roiTimeline.forEach((row) => {
    pdf.text(`Month ${row.month}: ${row.cumulativeFormatted} cumulative`, 48, y);
    y += 16;
  });
  y += 8;

  y = addSectionTitle(pdf, '4. Competitor Benchmarking', y);
  y = addBodyLines(
    pdf,
    [
      `Industry avg revenue per scan (${report.benchmark.venueType}): ${report.benchmark.industryAvgFormatted}`,
      'Your current baseline: $0.00 per scan',
    ],
    y
  );

  pdf.setFillColor(...NAVY);
  pdf.rect(0, 720, 612, 72, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Ready to deploy? Browse your kit at scan-and-scale.seamlessly.us/products', 48, 748);
  pdf.setTextColor(...GOLD);
  pdf.text('© Seamlessly', 48, 764);

  pdf.save('calculator-plus-revenue-report.pdf');
}
