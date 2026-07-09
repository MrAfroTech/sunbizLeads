import React, { useMemo } from 'react';
import CalculatorLeakResults from './CalculatorLeakResults';

const HOME_GAMES_PER_SEASON = 41;

const SportsCalculatorInlineResults = ({
  snapshot,
  formatMoney,
  onReportSubmit,
  onConsultationCta,
}) => {
  const resultCards = useMemo(
    () => [
      {
        id: 'game',
        name: 'Left on the table per game',
        amount: snapshot.leftOnTable,
      },
      {
        id: 'season',
        name: 'Home season concession leak',
        amount: snapshot.leftOnTable * HOME_GAMES_PER_SEASON,
      },
      {
        id: 'fan',
        name: 'Revenue left per fan, per game',
        amount: snapshot.lostPerFan,
      },
      {
        id: 'unconverted',
        name: 'Unconverted fan spend this game',
        amount: snapshot.fansWhoNeverOrdered * snapshot.lostPerFan,
      },
    ],
    [snapshot]
  );

  return (
    <CalculatorLeakResults
      heroCard
      metrics={snapshot}
      resultCards={resultCards}
      visibleCardId="game"
      visibleMomentLoss={snapshot.leftOnTable}
      formatMoney={formatMoney}
      onReportSubmit={onReportSubmit}
      onConsultationCta={onConsultationCta}
      calculatorType="sports"
      requirePhone
      heroEyebrow="Concession revenue leak"
      heroHeadline={
        <>
          YOU LEFT{' '}
          <span className="leak-results__hero-card-figure">{formatMoney(snapshot.leftOnTable)}</span> ON
          THE TABLE THIS GAME
        </>
      }
      heroSubhead={`${snapshot.fansWhoNeverOrdered.toLocaleString('en-US')} fans came ready to spend — and walked away without ordering.`}
      gateChecks={[
        'Full zone-by-zone concession leak breakdown',
        'Deployment roadmap to recover lost revenue',
      ]}
    />
  );
};

export default SportsCalculatorInlineResults;
