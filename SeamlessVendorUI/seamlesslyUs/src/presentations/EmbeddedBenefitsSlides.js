import React, { useState } from 'react';
import '../styles/EmbeddedBenefitsSlides.css';
import { ChevronLeft, ChevronRight, DollarSign, MapPin, Calendar, TrendingDown, Bell, Package, Shield, Search, Eye, Clock, Star, Users, Zap } from 'lucide-react';

const EmbeddedBenefitsSlides = () => {
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
      statCallout: 'Average vendor saves $400-600/month on supplies alone'
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
      statCallout: 'Vendors see 40% more orders from instant visibility'
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
      statCallout: 'Vendors average 3-5 additional event bookings per month'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="embedded-benefits-slides">
      <div className="embedded-slides-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`embedded-benefit-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <div className="embedded-slide-background"></div>

            <div className="embedded-slide-content">
              {/* Header */}
              <div className="embedded-slide-header">
                <h2 className="embedded-main-headline">
                  <span className="gradient-text">{slide.mainHeadline}</span>
                </h2>
                <p className="embedded-subheadline">{slide.subheadline}</p>
              </div>

              {/* Bullet Points */}
              <div className="embedded-bullet-points">
                {slide.bulletPoints.map((point, idx) => (
                  <div key={idx} className="embedded-bullet-item">
                    <div className="embedded-bullet-icon">{point.icon}</div>
                    <p className="embedded-bullet-text">{point.text}</p>
                  </div>
                ))}
              </div>

              {/* Stat Callout */}
              <div className="embedded-stat-callout">
                <div className="embedded-stat-icon">
                  <TrendingDown />
                </div>
                <p className="embedded-stat-text">{slide.statCallout}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="embedded-slide-navigation">
        <button 
          className="embedded-nav-button embedded-prev" 
          onClick={prevSlide}
          aria-label="Previous benefit"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="embedded-slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`embedded-indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to benefit ${index + 1}`}
            />
          ))}
        </div>

        <button 
          className="embedded-nav-button embedded-next" 
          onClick={nextSlide}
          aria-label="Next benefit"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default EmbeddedBenefitsSlides;
