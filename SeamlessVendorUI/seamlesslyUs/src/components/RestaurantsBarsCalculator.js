import React from 'react';
import '../styles/CalculatorGlassCard.css';
import '../styles/CalculatorRangeField.css';
import { CALCULATOR_PAGE_KEYS } from '../lib/calculatorPageVisits';
import VenueLeakCalculator from './VenueLeakCalculator';

const RestaurantsBarsCalculator = () => (
  <VenueLeakCalculator
    pageKey={CALCULATOR_PAGE_KEYS.RESTAURANTS_CALCULATOR}
    leadCampaign="restaurants-calculator-leak-report"
    idPrefix="restaurants-calc"
  />
);

export default RestaurantsBarsCalculator;
