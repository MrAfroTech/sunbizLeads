import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#d4af37', '#e0b841', '#f5d76e', '#b8860b'];
const LABELS = ['LinkedIn', 'Cold Calls', 'Walk-Ins', 'Networking'];

function num(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function Section5Analytics({ formStateWithConv }) {
  const s1Requests = num(formStateWithConv.s1Requests);
  const s2Calls = num(formStateWithConv.s2Calls);
  const s3Walkins = num(formStateWithConv.s3Walkins);
  const s4Contacts = num(formStateWithConv.s4Contacts);
  const s1Demos = num(formStateWithConv.s1Demos);
  const s2Demos = num(formStateWithConv.s2Demos);
  const s3Demos = num(formStateWithConv.s3Demos);
  const s4Demos = num(formStateWithConv.s4Demos);
  const s1Sales = num(formStateWithConv.s1Sales);
  const s2Sales = num(formStateWithConv.s2Sales);
  const s3Sales = num(formStateWithConv.s3Sales);
  const s4Sales = num(formStateWithConv.s4Sales);

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#ffffff' },
      },
      tooltip: {
        bodyColor: '#ffffff',
        titleColor: '#f8e8a0',
      },
    },
  };

  const effortsData = {
    labels: LABELS,
    datasets: [
      {
        label: 'Prospecting Efforts by Category',
        data: [s1Requests, s2Calls, s3Walkins, s4Contacts],
        backgroundColor: COLORS,
      },
    ],
  };

  const demosData = {
    labels: LABELS,
    datasets: [
      {
        label: 'Demos by Category',
        data: [s1Demos, s2Demos, s3Demos, s4Demos],
        backgroundColor: COLORS,
      },
    ],
  };

  const salesData = {
    labels: LABELS,
    datasets: [
      {
        label: 'Sales by Category',
        data: [s1Sales, s2Sales, s3Sales, s4Sales],
        backgroundColor: COLORS,
      },
    ],
  };

  return (
    <section style={{ marginBottom: 32, border: '1px solid var(--section-border)', padding: 16, borderRadius: 'var(--section-radius)', background: 'var(--section-bg)' }}>
      <h2 style={{ marginTop: 0 }}>Section 5: Visual Analytics (Auto-Generated)</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginTop: 16,
        }}
      >
        <div style={{ position: 'relative', height: 240 }}>
          <Pie data={effortsData} options={chartOpts} />
        </div>
        <div style={{ position: 'relative', height: 240 }}>
          <Pie data={demosData} options={chartOpts} />
        </div>
        <div style={{ position: 'relative', height: 240 }}>
          <Pie data={salesData} options={chartOpts} />
        </div>
      </div>
    </section>
  );
}

export default Section5Analytics;
