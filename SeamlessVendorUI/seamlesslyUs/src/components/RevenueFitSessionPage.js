import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resolveLeadContext } from '../lib/revenueFitAttribution';
import { scheduleRevenueFitSession } from '../lib/scheduleRevenueFitSession';
import { trackRevenueFitEvent } from '../lib/trackRevenueFitEvent';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/RevenueFitSession.css';
import CalculatorHeroShell from './CalculatorHeroShell';

/**
 * Legacy route — immediately schedules and redirects to Calendly (no intermediate UI).
 */
const RevenueFitSessionPage = () => {
  const [searchParams] = useSearchParams();
  const lead = useMemo(
    () => resolveLeadContext(searchParams, window.location.pathname),
    [searchParams],
  );

  useEffect(() => {
    void trackRevenueFitEvent('revenue_fit_session_page_view', lead.attribution);
    void scheduleRevenueFitSession(lead);
  }, [lead]);

  return (
    <CalculatorHeroShell className="revenue-fit-page">
      <div className="revenue-fit-card" style={{ textAlign: 'center' }}>
        <p className="revenue-fit-scheduler-note">Opening your scheduling page…</p>
      </div>
    </CalculatorHeroShell>
  );
};

export default RevenueFitSessionPage;
