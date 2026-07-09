/**
 * White Label Booking System
 * Comprehensive appointment booking component
 * Supports multiple brand configurations
 */

import React, { useState, useEffect } from 'react';
import BookingCalendar from './BookingCalendar';
import CustomerBookingFlow from './CustomerBookingFlow';
import { getCurrentBrand } from '../../config/whiteLabel';
import './BookingSystem.css';

const BookingSystem = ({ customerId, onBookingComplete }) => {
  const [currentStep, setCurrentStep] = useState('service');
  const [bookingData, setBookingData] = useState({
    serviceType: null,
    service: null,
    staff: null,
    date: null,
    time: null,
    duration: null,
    customer: null,
    loyaltyAccount: null,
    pointsToUse: 0,
    discount: 0
  });
  
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const brand = getCurrentBrand();

  const serviceCategories = [
    { 
      id: 'massage', 
      name: brand.services.massage, 
      iconType: 'spa',
      description: 'Professional therapeutic and relaxation experiences'
    },
    { 
      id: 'cafe', 
      name: brand.services.cafe, 
      iconType: 'cafe',
      description: 'Reserve a table at our premium venue'
    },
    { 
      id: 'events', 
      name: brand.services.events, 
      iconType: 'events',
      description: 'Book our private spaces for meetings or celebrations'
    },
    { 
      id: 'podcast', 
      name: brand.services.podcast, 
      iconType: 'podcast',
      description: 'Professional media production facilities'
    }
  ];

  const renderIcon = (iconType) => {
    const icons = {
      spa: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 16V22" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 20L12 22L16 20" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      cafe: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 8H19C20.1046 8 21 8.89543 21 10V12C21 13.1046 20.1046 14 19 14H18" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 8H18V16C18 17.1046 17.1046 18 16 18H6C4.89543 18 4 17.1046 4 16V8Z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 2V5M12 2V5M16 2V5" strokeLinecap="round"/>
          <path d="M6 22H16" strokeLinecap="round"/>
        </svg>
      ),
      events: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="15" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 10H21" strokeLinecap="round"/>
          <path d="M8 3V6M16 3V6" strokeLinecap="round"/>
        </svg>
      ),
      podcast: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 13V19M9 19H15" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 10C8 7.79086 9.79086 6 12 6C14.2091 6 16 7.79086 16 10" strokeLinecap="round"/>
        </svg>
      ),
      user: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    };
    return icons[iconType] || icons.user;
  };

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  useEffect(() => {
    if (bookingData.serviceType) {
      loadServices(bookingData.serviceType);
    }
  }, [bookingData.serviceType]);

  useEffect(() => {
    if (bookingData.service) {
      loadAvailableStaff(bookingData.service.id);
    }
  }, [bookingData.service]);

  useEffect(() => {
    if (bookingData.date && bookingData.service && bookingData.staff) {
      loadAvailability(bookingData.date, bookingData.service.id, bookingData.staff?.id);
    }
  }, [bookingData.date, bookingData.service, bookingData.staff]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loyalty/${customerId}`);
      const data = await response.json();
      
      if (data.success) {
        setBookingData(prev => ({
          ...prev,
          customer: data.customer,
          loyaltyAccount: data.loyaltyAccount
        }));
      }
    } catch (err) {
      console.error('Error loading customer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (category) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services?category=${category}`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
      }
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStaff = async (serviceId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff?service_id=${serviceId}`);
      const data = await response.json();
      
      if (data.success) {
        setStaff(data.staff);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (date, serviceId, staffId) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        date,
        service_id: serviceId,
        ...(staffId && { staff_id: staffId })
      });
      
      const response = await fetch(`/api/availability?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailability(data.timeSlots);
      }
    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceTypeSelect = (serviceType) => {
    setBookingData(prev => ({
      ...prev,
      serviceType,
      service: null,
      staff: null,
      date: null,
      time: null
    }));
    
    // For massage services, ask about masseuse preference first
    if (serviceType === 'massage') {
      setCurrentStep('masseuse-preference');
    } else {
      setCurrentStep('service-detail');
    }
  };

  const handleMasseusePreference = async (hasPreference) => {
    if (hasPreference) {
      // Load staff first if they have a preference
      setCurrentStep('staff');
      await loadAvailableStaff(null); // Load all massage staff
    } else {
      // Go to service selection
      setCurrentStep('service-detail');
    }
  };

  const handleServiceSelect = (service) => {
    setBookingData(prev => ({
      ...prev,
      service,
      duration: service.duration_options[0] // Default to first duration option
    }));
    
    if (service.requires_staff) {
      setCurrentStep('staff');
    } else {
      setCurrentStep('calendar');
    }
  };

  const handleStaffSelect = (selectedStaff) => {
    setBookingData(prev => ({
      ...prev,
      staff: selectedStaff
    }));
    setCurrentStep('calendar');
  };

  const handleDateTimeSelect = (date, time) => {
    setBookingData(prev => ({
      ...prev,
      date,
      time
    }));
    setCurrentStep('customer-info');
  };

  const handleBack = () => {
    if (currentStep === 'masseuse-preference') {
      setCurrentStep('service');
      setBookingData(prev => ({
        ...prev,
        serviceType: null
      }));
    } else if (currentStep === 'service-detail' && bookingData.serviceType === 'massage') {
      setCurrentStep('masseuse-preference');
    } else if (currentStep === 'staff' && bookingData.serviceType === 'massage' && !bookingData.service) {
      setCurrentStep('masseuse-preference');
    } else {
      const stepOrder = ['service', 'masseuse-preference', 'service-detail', 'staff', 'calendar', 'customer-info', 'payment', 'confirmation'];
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex > 0) {
        setCurrentStep(stepOrder[currentIndex - 1]);
      }
    }
  };

  const handleBookingSubmit = async (finalBookingData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalBookingData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentStep('confirmation');
        if (onBookingComplete) {
          onBookingComplete(data.booking);
        }
      } else {
        throw new Error(data.message || 'Booking failed');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderServiceTypeSelector = () => (
    <div className="service-type-selector">
      <h2>What would you like to book?</h2>
      <p>Choose from our curated selection of premium services</p>
      <div className="service-categories">
        {serviceCategories.map(category => (
          <div
            key={category.id}
            className="service-category-card"
            onClick={() => handleServiceTypeSelect(category.id)}
          >
            <div className="category-icon">{renderIcon(category.iconType)}</div>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMasseusePreference = () => (
    <div className="masseuse-preference-selector">
      <button onClick={handleBack} className="back-button">← Back</button>
      <div className="preference-content">
        <h2>Do you have a preferred masseuse?</h2>
        <p>Let us know if you'd like to book with someone specific</p>
        
        <div className="preference-options">
          <div 
            className="preference-card"
            onClick={() => handleMasseusePreference(true)}
          >
            <div className="preference-icon">
              {renderIcon('user')}
            </div>
            <h3>Yes, I have a preference</h3>
            <p>Choose from our expert massage therapists</p>
          </div>

          <div 
            className="preference-card"
            onClick={() => handleMasseusePreference(false)}
          >
            <div className="preference-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>No preference</h3>
            <p>We'll match you with the next available therapist</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderServiceSelector = () => (
    <div className="service-selector">
      <button onClick={handleBack} className="back-button">← Back</button>
      <h2>Choose Your Service</h2>
      {loading ? (
        <div className="loading">Loading services...</div>
      ) : (
        <div className="services-grid">
          {services.map(service => (
            <div
              key={service.id}
              className="service-card"
              onClick={() => handleServiceSelect(service)}
            >
              {service.image_url && (
                <img src={service.image_url} alt={service.name} className="service-image" />
              )}
              <div className="service-info">
                <h3>{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-details">
                  <span className="service-price">${service.price}</span>
                  <span className="service-duration">
                    {service.duration_options.join('/')} min
                  </span>
                </div>
                {bookingData.loyaltyAccount && (
                  <div className="points-earn">
                    Earn {Math.round(service.price)} points
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStaffSelector = () => (
    <div className="staff-selector">
      <button onClick={handleBack} className="back-button">← Back</button>
      <h2>Choose Your Therapist</h2>
      <div className="staff-option">
        <div
          className="staff-card any-staff"
          onClick={() => handleStaffSelect(null)}
        >
          <div className="staff-icon">{renderIcon('user')}</div>
          <h3>No Preference</h3>
          <p>Next available therapist</p>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading staff...</div>
      ) : (
        <div className="staff-grid">
          {staff.map(member => (
            <div
              key={member.id}
              className="staff-card"
              onClick={() => handleStaffSelect(member)}
            >
              {member.image_url && (
                <img src={member.image_url} alt={member.name} className="staff-image" />
              )}
              <h3>{member.name}</h3>
              <p className="staff-bio">{member.bio}</p>
              <div className="staff-specialties">
                {member.specialties.slice(0, 3).map((specialty, idx) => (
                  <span key={idx} className="specialty-tag">{specialty}</span>
                ))}
              </div>
              <div className="staff-experience">
                {member.years_experience} years experience
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCalendar = () => (
    <div className="calendar-section">
      <button onClick={handleBack} className="back-button">← Back</button>
      <h2>Select Date & Time</h2>
      <BookingCalendar
        selectedDate={bookingData.date}
        selectedTime={bookingData.time}
        availableSlots={availability}
        duration={bookingData.duration}
        onDateTimeSelect={handleDateTimeSelect}
        loading={loading}
      />
    </div>
  );

  return (
    <div className="booking-system">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {bookingData.loyaltyAccount && (
        <div className="loyalty-banner">
          <div className="loyalty-points">
            <span className="points-badge" style={{ backgroundColor: bookingData.loyaltyAccount.tier_color }}>
              {bookingData.loyaltyAccount.tier_level.toUpperCase()}
            </span>
            <span className="points-balance">{bookingData.loyaltyAccount.points_balance} points</span>
          </div>
        </div>
      )}

      <div className="booking-content">
        {currentStep === 'service' && renderServiceTypeSelector()}
        {currentStep === 'masseuse-preference' && renderMasseusePreference()}
        {currentStep === 'service-detail' && renderServiceSelector()}
        {currentStep === 'staff' && renderStaffSelector()}
        {currentStep === 'calendar' && renderCalendar()}
        {(currentStep === 'customer-info' || currentStep === 'payment' || currentStep === 'confirmation') && (
          <CustomerBookingFlow
            bookingData={bookingData}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onBookingSubmit={handleBookingSubmit}
            onBack={handleBack}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default BookingSystem;

