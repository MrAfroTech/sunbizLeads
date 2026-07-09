import { Chart as ChartJS, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

function n(v) {
  const x = Number(v);
  return Number.isNaN(x) ? 0 : x;
}

/**
 * Single-column funnel. Bar width = (step value ÷ first step value) × 100. First step = 100%. If first = 0, all bars 0.
 * Ratio = previous ÷ current, displayed as X:1; if either 0 show "—".
 * @param {{ label: string, steps: { label: string, value: number }[] }} props
 */
function FunnelChart({ label, steps }) {
  if (!steps || steps.length === 0) return null;

  const firstVal = n(steps[0]?.value);
  const dataPct = steps.map((s) => (firstVal === 0 ? 0 : (n(s.value) / firstVal) * 100));

  const ratioStr = (prevVal, currVal) => {
    if (prevVal === 0 || currVal === 0) return '—';
    const r = prevVal / currVal;
    const fixed = Number(r).toFixed(1);
    return (fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed) + ':1';
  };

  const labels = steps.map((s) => s.label);

  const chartData = {
    labels,
    datasets: [
      { label, data: dataPct, backgroundColor: '#d4af37' },
    ],
  };

  const stepCount = steps.length;
  const barHeight = Math.min(24, Math.max(14, 200 / stepCount));
  const chartHeight = Math.min(280, stepCount * barHeight + 40);

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 100,
        display: true,
        ticks: { display: false },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        ticks: { color: '#ffffff', font: { size: 13 }, autoSkip: false },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        bodyColor: '#ffffff',
        titleColor: '#f8e8a0',
      },
    },
  };

  return (
    <div style={{ flex: '1 1 0', minWidth: 120, maxWidth: '33.33%' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-light)', marginBottom: 6 }}>{label}</div>
      <div style={{ height: chartHeight, overflow: 'hidden' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default FunnelChart;
