import Homepage from './components/Homepage';
import VipNightOutPassExport from './pages/VipNightOutPassExport';

/**
 * Minimal path routing (no react-router).
 * Provisional marketing route — confirm final path with Reece before promoting.
 */
function resolvePage() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (
    path === '/marketing/vip-night-out-pass' ||
    path === '/vip-night-out-pass'
  ) {
    return 'vip-pass';
  }
  return 'home';
}

export default function App() {
  const page = resolvePage();
  if (page === 'vip-pass') {
    return <VipNightOutPassExport />;
  }
  return <Homepage />;
}
