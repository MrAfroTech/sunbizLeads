import React, { useEffect, useState } from 'react';
import AgentDashboard from './AgentDashboard.jsx';
import HomeDashboard from './HomeDashboard.jsx';

function initialView() {
  if (typeof window === 'undefined') return 'home';
  const h = window.location.hash;
  if (h === '#/agent') return 'agent';
  return 'home';
}

export default function App() {
  const [view, setView] = useState(initialView);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      if (h === '#/agent') setView('agent');
      else setView('home');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goHome = () => {
    window.location.hash = '';
    setView('home');
  };
  const openAgent = () => {
    window.location.hash = '#/agent';
    setView('agent');
  };

  if (view === 'agent') {
    return <AgentDashboard onBack={goHome} />;
  }

  return <HomeDashboard onOpenAgent={openAgent} />;
}
