import React, { useMemo } from 'react';
import CalculatorLeakResults, {
  HERO_LEAK_GATE_BODY,
  HERO_LEAK_GATE_HEADLINE,
} from './CalculatorLeakResults';
import DownloadReveal from './DownloadReveal';

const SportsGatedCalculatorResults = ({
  calculatorType,
  heroHeadline,
  heroSubhead,
  lockedCards,
  totalBannerLabel,
  totalAmount,
  totalBannerSubline,
  formatMoney,
  gateHeadline = HERO_LEAK_GATE_HEADLINE,
  gateBody = HERO_LEAK_GATE_BODY,
  gateChecks = [
    'Full breakdown of all locked results',
    '1 actionable fix you can implement this season',
  ],
  pdfDownloadHref = '/downloads/heyyou-9-things.pdf',
  onReportSubmit,
  onConsultationCta,
  gridAriaLabel = 'Calculator results breakdown',
  heroEyebrow = 'Revenue impact',
  organizationFieldPlaceholder = 'Venue Name',
}) => {
  const resultCards = useMemo(
    () => [
      {
        id: 'hero',
        name: totalBannerLabel || 'Total projected impact',
        amount: totalAmount,
      },
      ...lockedCards.slice(0, 3).map((card) => ({
        id: card.id,
        name: card.title,
        amount: card.amount,
      })),
    ],
    [lockedCards, totalAmount, totalBannerLabel]
  );

  return (
    <CalculatorLeakResults
      heroCard
      resultCards={resultCards}
      visibleCardId="hero"
      visibleMomentLoss={totalAmount}
      formatMoney={formatMoney}
      onReportSubmit={onReportSubmit}
      onConsultationCta={onConsultationCta}
      calculatorType={calculatorType}
      heroEyebrow={heroEyebrow}
      heroHeadline={heroHeadline}
      heroSubhead={heroSubhead}
      gateHeadline={gateHeadline}
      gateBody={gateBody}
      gateChecks={gateChecks}
      totalBannerSubline={totalBannerSubline}
      organizationFieldPlaceholder={organizationFieldPlaceholder}
      gridAriaLabel={gridAriaLabel}
      postRevealExtras={({ email, name, phone }) => (
        <DownloadReveal email={email} name={name} phone={phone} pdfHref={pdfDownloadHref} />
      )}
    />
  );
};

export default SportsGatedCalculatorResults;
