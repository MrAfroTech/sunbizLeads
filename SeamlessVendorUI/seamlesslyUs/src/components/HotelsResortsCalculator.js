import React from 'react';
import { CALCULATOR_PAGE_KEYS } from '../lib/calculatorPageVisits';
import HotelGuestSpendLeakCalculator from './HotelGuestSpendLeakCalculator';

const HotelsResortsCalculator = () => (
  <HotelGuestSpendLeakCalculator
    pageKey={CALCULATOR_PAGE_KEYS.HOTELS_CALCULATOR}
    leadCampaign="hotels-calculator-guest-spend-report"
    idPrefix="hotels-calc"
  />
);

export default HotelsResortsCalculator;
