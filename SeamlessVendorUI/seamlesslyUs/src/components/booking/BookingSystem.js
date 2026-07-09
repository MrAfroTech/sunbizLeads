/**
 * Coffee & Conversations Collective - Main Booking System
 * Comprehensive appointment booking component
 */

import React, { useState, useEffect } from 'react';
import BookingCalendar from './BookingCalendar';
import CustomerBookingFlow from './CustomerBookingFlow';
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

  const serviceCategories = [
    { 
      id: 'massage', 
      name: 'Massage Services', 
      icon: '💆',
      description: 'Professional therapeutic and relaxation massage'
    },
    { 
      id: 'cafe', 
      name: 'Cafe Reservations', 
      icon: '☕',
      description: 'Reserve a table at our artisan cafe'
    },
    { 
      id: 'events', 
      name: 'Event Space', 
      icon: '🎪',
      description: 'Book our private event space for meetings or celebrations'
    },
    { 
      id: 'podcast', 
      name: 'Podcast Studio', 
      icon: '🎙️',
      description: 'Professional podcast recording and production'
    }
  ];

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
    setCurrentStep('service-detail');
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
    const stepOrder = ['service', 'service-detail', 'staff', 'calendar', 'customer-info', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
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
      <div className="service-categories">
        {serviceCategories.map(category => (
          <div
            key={category.id}
            className="service-category-card"
            onClick={() => handleServiceTypeSelect(category.id)}
          >
            <div className="category-icon">{category.icon}</div>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </div>
        ))}
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
        <button
          className="staff-card any-staff"
          onClick={() => handleStaffSelect(null)}
        >
          <div className="staff-icon">👤</div>
          <h3>No Preference</h3>
          <p>Next available therapist</p>
        </button>
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

