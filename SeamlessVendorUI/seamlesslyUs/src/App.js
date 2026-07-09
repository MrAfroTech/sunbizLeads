import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './styles/App.css';
// In your App.js or routing configuration
import AppDownloadSplash from './components/AppDownloadSplash';
import EzDrinkVideoPopup from './components/EzDrinkVideoPopup';

// Components
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import HeroSection from './components/HeroSection';
import FeatureSection from './components/FeatureSection';
import TestimonialSection from './components/TestimonialSection';
import PricingSection from './components/PricingSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import LeadCapturePopup from './components/LeadCapturePopup';
import LeadCaptureFunnel from './components/LeadCaptureFunnel';
import DemoPage from './components/DemoPage';
import IncreaseRevenue from './components/IncreaseRevenue';
import ReduceExpenses from './components/ReduceExpenses';
import CashFinderPage from './components/CashFinderPage';
import WineWalkMap from './components/WineWalkMap';
import KidsExpoMap from './components/KidsExpoMap';
import EzDrinkSignup from './components/EzDrinkSignup';
import SignupSuccess from './components/SignupSuccess';
import EzFestSignup from './components/EzFestSignup';
import VendorDownload from './components/VendorDownload';
import DirectSignup from './components/DirectSignup';
import VendorIntegration from './components/VendorIntegration';
import SquareOAuthCallback from './components/SquareOAuthCallback';
import SquareSuccess from './components/SquareSuccess';
import CaseStudies from './components/CaseStudies';
import Investors from './components/Investors';
import PiratesPortLanding from './components/PiratesPortLanding';
import VendorRegistration from './components/VendorRegistration';
import CostBenefitAnalysis from './components/CostBenefitAnalysis';
import MakingPurchaseVsWatchingGame from './components/MakingPurchaseVsWatchingGame';
import Sports2RetentionCalculator from './components/Sports2RetentionCalculator';
import Sports3SponsorshipCalculator from './components/Sports3SponsorshipCalculator';
import WaitCalculator from './components/WaitCalculator';
import WaitSignalSlides from './presentations/WaitSignalSlides';
import DistrictsCalculator from './components/DistrictsCalculator';
import RestaurantsBarsCalculator from './components/RestaurantsBarsCalculator';
import EventSpacesCalculator from './components/EventSpacesCalculator';
import HotelsResortsCalculator from './components/HotelsResortsCalculator';
import ForkCalculatorPage from './components/ForkCalculatorPage';
import { FORK_CALCULATOR_SLUGS } from './lib/forkCalculatorRegistry';
import StaffTurnoverCalculator from './components/StaffTurnoverCalculator';
import SportsCalculatorResults from './components/SportsCalculatorResults';
import SportsTurnoverResults from './components/SportsTurnoverResults';
import MagicBandsCalculator from './components/MagicBandsCalculator';
import MagicBandsCalculatorResults from './components/MagicBandsCalculatorResults';
import CalculatorPlusPage from './components/CalculatorPlusPage';
import StaffBurnoutCalculatorResults from './components/StaffBurnoutCalculatorResults';
import RevenueFitSessionPage from './components/RevenueFitSessionPage';
import SeamlessMatrix from './pages/SeamlessMatrix';
import PricingComparisonChart from './components/PricingComparisonChart';
import BackgroundSlider from './components/BackgroundSlider';
import BookingModal from './components/BookingModal';
import ChaosMasteryNewsletterPage from './components/ChaosMasteryNewsletterPage';
import EmailCampaignClickTracker from './components/EmailCampaignClickTracker';

// QR Tracker component
const QRTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Extract tracking parameter from URL
    const params = new URLSearchParams(location.search);
    const trackingId = params.get('t');
    
    if (trackingId) {
      console.log(`QR Code scan detected: ${trackingId}`);
      
      // Record the scan
      recordScan(trackingId, location.pathname);
      
      // Remove tracking parameter from URL (optional)
      // This keeps the URL clean after tracking is recorded
      const cleanParams = new URLSearchParams(location.search);
      cleanParams.delete('t');
      const newSearch = cleanParams.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');
      
      // Only navigate if there were other parameters to preserve
      if (location.search !== `?t=${trackingId}`) {
        navigate(newPath, { replace: true });
      }
    }
  }, [location, navigate]);
  
  const recordScan = (trackingId, path) => {
    try {
      // Create scan data object
      const scanData = {
        trackingId,
        timestamp: new Date().toISOString(),
        path,
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct'
      };
      
      // Store in localStorage for dashboard access
      const existingScans = JSON.parse(localStorage.getItem('seamless-qr-scans') || '[]');
      existingScans.push(scanData);
      localStorage.setItem('seamless-qr-scans', JSON.stringify(existingScans));
      
      // In a production environment, you might want to send this to a server
      // This could be implemented as a fetch call to your API endpoint
      // Example:
      /*
      fetch('/api/track-qr-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanData)
      });
      */
      
      console.log('QR scan recorded successfully', scanData);
    } catch (error) {
      console.error('Error recording QR scan:', error);
    }
  };
  
  // This component doesn't render anything visible
  return null;
};

// A wrapper component that conditionally renders the navbar
const AppContent = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showFunnel, setShowFunnel] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const location = useLocation();
  
  // Check if the current path is a standalone page without navbar or footer
  const isDownloadPage = location.pathname === '/download';
  const isCashFinderPage = location.pathname === '/cash-finder';
  const isWineWalkPage = location.pathname === '/wine-walk';
  const isKidsExpoPage = location.pathname === '/kids-expo';
  const isSignupPage = location.pathname === '/signup';
  const isSignupSuccessPage = location.pathname === '/signup-success';
  const isEzFestPage = location.pathname === '/ezfest';
  const isVendorDownloadPage = location.pathname === '/vendor-download';
  const isDirectSignupPage = location.pathname === '/directsignup';
  const isVendorIntegrationPage = location.pathname === '/vendor-integration';
  const isVendorRegistrationPage = location.pathname === '/vendor-registration';
  const isPiratesPortPage = location.pathname === '/pirates-port';
  const isCalculatorPage =
    location.pathname === '/calculator' ||
    location.pathname === '/calculator-plus' ||
    location.pathname.startsWith('/calculator/');
  const isPresentationPage = location.pathname === '/calculator/wait/presentation';
  const hideNavbar =
    isCalculatorPage ||
    isDownloadPage ||
    isCashFinderPage ||
    isWineWalkPage ||
    isKidsExpoPage ||
    isSignupPage ||
    isSignupSuccessPage ||
    isEzFestPage ||
    isVendorDownloadPage ||
    isDirectSignupPage ||
    isVendorIntegrationPage ||
    isVendorRegistrationPage;
  const hideFooter = hideNavbar || isCalculatorPage;
  
  console.log('🔍 Navbar hiding debug:', {
    pathname: location.pathname,
    isVendorDownloadPage,
    isVendorIntegrationPage,
    hideNavbar
  });

  // Auto-display video popup when site loads - DISABLED
  // useEffect(() => {
  //   // Only show popup on homepage (not on other routes)
  //   if (location.pathname === '/') {
  //     // Delay showing popup by 3 seconds for better user experience
  //     const timer = setTimeout(() => {
  //       setShowVideoPopup(true);
  //     }, 3000);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.pageYOffset;
      setScrollPosition(position);
      setShowCTA(position > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check for QR code tracking parameter on initial load
  useEffect(() => {
    // This effect runs when the component mounts or the location changes
    // The actual tracking logic is handled by the QRTracker component
  }, [location]);

  // Create a function to open the funnel
  const openFunnel = () => {
    console.log("Opening funnel");
    setShowFunnel(true);
    // Close any other modals
    setShowPopup(false);
    setShowVideoPopup(false); // Close video popup as well
  };

  const openBooking = () => {
    setShowBooking(true);
    setShowPopup(false);
    setShowFunnel(false);
    setShowVideoPopup(false);
  };
  
  // Create a function to open the video popup manually
  const openVideoPopup = () => {
    console.log("Opening video popup");
    setShowVideoPopup(true);
  };

  return (
    <div className="app-container">
      <QRTracker />
      <EmailCampaignClickTracker />
      {!isPresentationPage && <BackgroundSlider />}
      {location.pathname !== '/' && !isCalculatorPage && (
        <div className="app-page-overlay" aria-hidden="true" />
      )}
      <div className="app-content">
      {/* Only show Navbar if not on standalone pages */}
      {!hideNavbar && (
        <Navbar 
          scrollPosition={scrollPosition} 
          onOpenFunnel={openFunnel}
          onOpenBooking={openBooking}
        />
      )}
      
      <Routes>
        <Route path="/" element={<HomePage onOpenPopup={() => setShowPopup(true)} onOpenFunnel={openFunnel} onOpenBooking={openBooking} />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/increase-revenue" element={<IncreaseRevenue />} />
        <Route path="/reduce-expenses" element={<ReduceExpenses />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/investors" element={<Investors />} />
        <Route path="/download" element={<AppDownloadSplash />} />
        <Route path="/cash-finder" element={<CashFinderPage />} />
        <Route path="/wine-walk" element={<WineWalkMap />} />
        <Route path="/kids-expo" element={<KidsExpoMap />} />
        <Route path="/signup" element={<DirectSignup />} />
        <Route path="/signup-success" element={<SignupSuccess />} />
        <Route path="/directsignup" element={<DirectSignup />} />
        <Route path="/vendor-download" element={<VendorDownload />} />
        <Route path="/vendor-integration" element={<VendorIntegration />} />
        <Route path="/vendor-registration" element={<VendorRegistration />} />
        <Route path="/square-oauth-callback" element={<SquareOAuthCallback />} />
        <Route path="/square-success" element={<SquareSuccess />} />

        <Route path="/ezfest" element={<EzFestSignup />} />
        <Route path="/pirates-port" element={<PiratesPortLanding />} />
        <Route path="/calculator" element={<CostBenefitAnalysis />} />
        <Route path="/calculator-plus" element={<CalculatorPlusPage />} />
        <Route path="/calculator/sports/results/turnover" element={<SportsTurnoverResults />} />
        <Route path="/calculator/sports/results" element={<SportsCalculatorResults />} />
        <Route path="/calculator/sports-2" element={<Sports2RetentionCalculator />} />
        <Route path="/calculator/sports-3" element={<Sports3SponsorshipCalculator />} />
        <Route path="/calculator/sports" element={<MakingPurchaseVsWatchingGame />} />
        <Route path="/calculator/wait/presentation" element={<WaitSignalSlides />} />
        <Route path="/calculator/wait" element={<WaitCalculator />} />
        <Route path="/calculator/districts" element={<DistrictsCalculator />} />
        <Route path="/calculator/magic-bands/results" element={<MagicBandsCalculatorResults />} />
        <Route path="/calculator/magic-bands" element={<MagicBandsCalculator />} />
        <Route path="/calculator/restaurants" element={<RestaurantsBarsCalculator />} />
        <Route path="/calculator/events" element={<EventSpacesCalculator />} />
        <Route path="/calculator/hotels" element={<HotelsResortsCalculator />} />
        {FORK_CALCULATOR_SLUGS.map((slug) => (
          <Route
            key={slug}
            path={`/calculator/${slug}`}
            element={<ForkCalculatorPage configId={slug} />}
          />
        ))}
        <Route path="/calculator/staffburnout/results" element={<StaffBurnoutCalculatorResults />} />
        <Route path="/calculator/staffburnout" element={<StaffTurnoverCalculator />} />
        <Route path="/calculator/revenue-fit-session" element={<RevenueFitSessionPage />} />
        <Route path="/seamless-matrix" element={<SeamlessMatrix />} />
        <Route path="/ucf-pricing" element={<PricingComparisonChart />} />
        <Route path="/chaos-mastery-newsletter" element={<ChaosMasteryNewsletterPage />} />

        {/* You could add a QR tracking dashboard route here */}
        {/* <Route path="/qr-tracking" element={<QRTrackingDashboard />} /> */}
      </Routes>
      
      {/* Hide footer on standalone pages and all /calculator/* routes */}
      {!hideFooter && <Footer />}
      </div>
      
      {/* Existing popups */}
      {showPopup && <LeadCapturePopup isOpen={showPopup} onClose={() => setShowPopup(false)} />}
      
      {showFunnel && (
        <LeadCaptureFunnel 
          isOpen={showFunnel} 
          onClose={() => {
            console.log("Closing funnel");
            setShowFunnel(false);
          }} 
        />
      )}

      {showBooking && (
        <BookingModal
          isOpen={showBooking}
          onClose={() => setShowBooking(false)}
        />
      )}
      
      {/* Video popup - now configured to appear automatically */}
      {showVideoPopup && (
        <EzDrinkVideoPopup 
          isOpen={showVideoPopup} 
          onClose={() => {
            console.log("Closing video popup");
            setShowVideoPopup(false);
          }} 
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
