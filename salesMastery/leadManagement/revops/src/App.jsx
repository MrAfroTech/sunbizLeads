import { useState } from 'react';
import CalculatorAbDashboard from '../CalculatorAbDashboard.jsx';
import FollowUpDashboard from '../FollowUpDashboard.jsx';
import LeadPriorityDashboard from '../LeadPriorityDashboard.jsx';
import OrgFunnelDashboard from '../OrgFunnelDashboard.jsx';
import './OrgFunnelDashboard.css';

const TABS = [
  { id: 'call', label: 'Call List' },
  { id: 'org', label: 'Org Funnel' },
  { id: 'ab', label: 'Calculator A/B' },
  { id: 'priority', label: 'Lead Priority' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('call');

  return (
    <div>
      <nav className="revops-toolbar" style={{ marginBottom: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="revops-btn-refresh"
            style={{
              marginRight: '0.5rem',
              opacity: activeTab === tab.id ? 1 : 0.65,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === 'call' ? <OrgFunnelDashboard /> : null}
      {activeTab === 'org' ? <FollowUpDashboard /> : null}
      {activeTab === 'ab' ? <CalculatorAbDashboard /> : null}
      {activeTab === 'priority' ? <LeadPriorityDashboard /> : null}
    </div>
  );
}
