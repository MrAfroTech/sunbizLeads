import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordEmailCampaignLandingFromSearch } from '../lib/emailClicks';

/** Silent landing attribution from ?contact= & ?campaign= (no UI). */
const EmailCampaignClickTracker = () => {
  const location = useLocation();

  useEffect(() => {
    void recordEmailCampaignLandingFromSearch(location.search);
  }, [location.pathname, location.search]);

  return null;
};

export default EmailCampaignClickTracker;
