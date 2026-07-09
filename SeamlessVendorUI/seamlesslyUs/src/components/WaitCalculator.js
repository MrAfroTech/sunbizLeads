import React from 'react';
import { CALCULATOR_PAGE_KEYS } from '../lib/calculatorPageVisits';
import VenueLeakCalculator from './VenueLeakCalculator';

const WaitCalculator = ({ presentationMode = false, onPresentationResultsShown }) => (
  <VenueLeakCalculator
    pageKey={CALCULATOR_PAGE_KEYS.WAIT_CALCULATOR}
    leadCampaign="wait-calculator-leak-report"
    idPrefix="wait-calc"
    presentationMode={presentationMode}
    onPresentationResultsShown={onPresentationResultsShown}
  />
);

export default WaitCalculator;
