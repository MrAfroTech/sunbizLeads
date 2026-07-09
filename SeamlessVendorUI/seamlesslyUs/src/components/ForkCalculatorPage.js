import React from 'react';
import { useParams } from 'react-router-dom';
import GatedForkCalculator from './GatedForkCalculator';

const ForkCalculatorPage = ({ configId: configIdProp }) => {
  const { forkSlug } = useParams();
  const configId = configIdProp ?? forkSlug;
  return <GatedForkCalculator configId={configId} />;
};

export default ForkCalculatorPage;
