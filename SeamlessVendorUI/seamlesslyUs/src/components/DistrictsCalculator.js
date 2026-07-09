import React from 'react';
import { CALCULATOR_PAGE_KEYS } from '../lib/calculatorPageVisits';
import DistrictLeakCalculator from './DistrictLeakCalculator';

const DistrictsCalculator = () => (
  <DistrictLeakCalculator
    pageKey={CALCULATOR_PAGE_KEYS.DISTRICTS_CALCULATOR}
    leadCampaign="districts-calculator-corridor-report"
    idPrefix="district-calc"
  />
);

export default DistrictsCalculator;
