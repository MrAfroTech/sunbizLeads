import React, { useState, useEffect, useCallback } from 'react';
import '../styles/VendorBenefitsSlides.css';
import { ChevronLeft, ChevronRight, DollarSign, MapPin, Calendar, TrendingDown, Bell, Package, Shield, Search, Eye, Clock, Star, Users, Zap } from 'lucide-react';

const VendorBenefitsSlides = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'operating-costs',
      mainHeadline: 'Cut Your Operating Costs by 20-30%',
      subheadline: 'We find the best prices so you don\'t have to',
      bulletPoints: [
        { icon: <Users />, text: 'Negotiated vendor partnerships for supplies and ingredients' },
        { icon: <TrendingDown />, text: 'Price comparison across suppliers in real-time' },
        { icon: <Bell />, text: 'Automated alerts when better deals become available' },
        { icon: <Package />, text: 'Consolidated ordering reduces delivery fees' },
        { icon: <Shield />, text: 'Equipment rental discounts through network partnerships' },
        { icon: <DollarSign />, text: 'Insurance rate reductions for platform members' }
      ],
      statCallout: 'Average vendor saves $400-600/month on supplies alone',
      gradient: 'linear-gradient(135deg, #3d3320 0%, #2a2315 50%, #3d3320 100%)'
    },
    {
      id: 'get-found',
      mainHeadline: 'Customers Find You Instantly, Every Single Time',
      subheadline: 'No more "Are you open?" questions',
      bulletPoints: [
        { icon: <Zap />, text: 'Real-time visibility when you connect your POS system' },
        { icon: <Eye />, text: 'Customers see your location, menu, and wait times instantly' },
        { icon: <Search />, text: 'Appear in searches for "food near me" automatically' },
        { icon: <Clock />, text: 'Your menu updates live as you add/remove items' },
        { icon: <MapPin />, text: 'Disappear from the app when you close - no disappointed customers' }
      ],
      statCallout: 'Vendors see 40% more orders from instant visibility',
      gradient: 'linear-gradient(135deg, #3d3320 0%, #2a2315 50%, #3d3320 100%)'
    },
    {
      id: 'premium-events',
      mainHeadline: 'Get Into Events You Couldn\'t Book Before',
      subheadline: 'Expand your calendar without the overhead',
      bulletPoints: [
        { icon: <Users />, text: 'Partner with events requiring lower setup footprints' },
        { icon: <Zap />, text: 'Access festivals that need quick-service vendors (not full trucks)' },
        { icon: <Star />, text: 'Book multi-vendor events where collaboration is required' },
        { icon: <DollarSign />, text: 'Lower entry costs for premium events (shared infrastructure)' },
        { icon: <MapPin />, text: 'Event organizers prioritize vendors on our platform' },
        { icon: <Calendar />, text: 'Qualify for events requiring real-time ordering systems' }
      ],
      statCallout: 'Vendors average 3-5 additional event bookings per month',
      gradient: 'linear-gradient(135deg, #3d3320 0%, #2a2315 50%, #3d3320 100%)'
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevSlide();
      } else if (e.key === 'Home') {
        setCurrentSlide(0);
      } else if (e.key === 'End') {
        setCurrentSlide(slides.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, slides.length]);

  return (
    <div className="vendor-benefits-presentation">
      <div className="slides-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`benefit-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ background: slide.gradient }}
          >
            {/* Background accent elements */}
            <div className="slide-background-accent"></div>
            <div className="slide-grid-pattern"></div>

            <div className="slide-content">
              {/* Header Section */}
              <div className="slide-header">
                <h1 className="main-headline gradient-text-gold">
                  {slide.mainHeadline}
                </h1>
                <p className="subheadline">
                  {slide.subheadline}
                </p>
              </div>

              {/* Bullet Points Section */}
              <div className="bullet-points-container">
                {slide.bulletPoints.map((point, idx) => (
                  <div 
                    key={idx} 
                    className="bullet-point-item"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="bullet-icon">
                      {point.icon}
                    </div>
                    <p className="bullet-text">{point.text}</p>
                  </div>
                ))}
              </div>

              {/* Stat Callout */}
              <div className="stat-callout">
                <div className="stat-callout-icon">
                  <TrendingDown />
                </div>
                <p className="stat-text">{slide.statCallout}</p>
              </div>
            </div>

            {/* Slide Number Indicator */}
            <div className="slide-number">
              {index + 1} / {slides.length}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="slide-navigation">
        <button 
          className="nav-button prev-button" 
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft size={32} />
        </button>

        <div className="slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button 
          className="nav-button next-button" 
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Keyboard Navigation */}
      <div 
        className="keyboard-hint"
        style={{ opacity: 0.5, fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}
      >
        Use arrow keys or click to navigate
      </div>
    </div>
  );
};

export default VendorBenefitsSlides;
