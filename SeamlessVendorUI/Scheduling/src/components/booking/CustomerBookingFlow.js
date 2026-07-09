/**
 * Coffee & Conversations Collective - Customer Booking Flow
 * Handles customer information, loyalty points, payment, and confirmation
 */

import React, { useState, useEffect } from 'react';
import './CustomerBookingFlow.css';

const CustomerBookingFlow = ({ 
  bookingData, 
  currentStep, 
  onStepChange, 
  onBookingSubmit, 
  onBack,
  loading 
}) => {
  const [customerInfo, setCustomerInfo] = useState({
    firstName: bookingData.customer?.first_name || '',
    lastName: bookingData.customer?.last_name || '',
    email: bookingData.customer?.email || '',
    phone: bookingData.customer?.phone || '',
    notes: ''
  });

  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [pointsToEarn, setPointsToEarn] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('pay-now');
  const [confirmationData, setConfirmationData] = useState(null);

  useEffect(() => {
    calculatePricing();
  }, [pointsToRedeem, bookingData]);

  const calculatePricing = () => {
    if (!bookingData.service) return;

    let basePrice = bookingData.service.price;
    if (bookingData.duration && bookingData.service.price_by_duration) {
      basePrice = bookingData.service.price_by_duration[bookingData.duration] || basePrice;
    }

    // Calculate tier discount
    let tierDiscount = 0;
    if (bookingData.loyaltyAccount) {
      const tierBenefits = getTierBenefits(bookingData.loyaltyAccount.tier_level);
      tierDiscount = (basePrice * tierBenefits.discount_percentage) / 100;
    }

    // Calculate points redemption discount ($1 off per 100 points)
    const pointsDiscount = pointsToRedeem / 100;

    const totalDiscount = tierDiscount + pointsDiscount;
    const finalCost = Math.max(0, basePrice - totalDiscount);

    // Calculate points to earn (1 point per $1 spent)
    let earnedPoints = Math.floor(finalCost);
    if (bookingData.loyaltyAccount) {
      const tierBenefits = getTierBenefits(bookingData.loyaltyAccount.tier_level);
      earnedPoints = Math.floor(earnedPoints * tierBenefits.points_multiplier);
      
      // Check if birthday month for double points
      if (isBirthdayMonth(bookingData.loyaltyAccount.birthday)) {
        earnedPoints *= 2;
      }
    }

    setDiscount(totalDiscount);
    setFinalPrice(finalCost);
    setPointsToEarn(earnedPoints);
  };

  const getTierBenefits = (tier) => {
    const benefits = {
      bronze: { discount_percentage: 5, points_multiplier: 1.0 },
      silver: { discount_percentage: 10, points_multiplier: 1.1 },
      gold: { discount_percentage: 15, points_multiplier: 1.25 },
      platinum: { discount_percentage: 20, points_multiplier: 1.5 }
    };
    return benefits[tier] || benefits.bronze;
  };

  const isBirthdayMonth = (birthday) => {
    if (!birthday) return false;
    const birthDate = new Date(birthday);
    const today = new Date();
    return birthDate.getMonth() === today.getMonth();
  };

  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePointsRedemption = (points) => {
    const maxPoints = bookingData.loyaltyAccount?.points_balance || 0;
    const maxRedeemable = Math.floor(finalPrice * 100); // Can't redeem more than price
    const validPoints = Math.min(points, maxPoints, maxRedeemable);
    setPointsToRedeem(validPoints);
  };

  const validateCustomerInfo = () => {
    const errors = [];
    if (!customerInfo.firstName.trim()) errors.push('First name is required');
    if (!customerInfo.lastName.trim()) errors.push('Last name is required');
    if (!customerInfo.email.trim()) errors.push('Email is required');
    if (!customerInfo.phone.trim()) errors.push('Phone is required');
    return errors;
  };

  const handleContinueToPayment = () => {
    const errors = validateCustomerInfo();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }
    onStepChange('payment');
  };

  const handleCompleteBooking = async () => {
    const finalBooking = {
      customer_info: customerInfo,
      service_id: bookingData.service.id,
      service_type: bookingData.serviceType,
      staff_id: bookingData.staff?.id || null,
      booking_date: bookingData.date,
      start_time: bookingData.time,
      duration: bookingData.duration,
      price: bookingData.service.price,
      discount_applied: discount,
      loyalty_points_used: pointsToRedeem,
      loyalty_points_earned: pointsToEarn,
      payment_method: paymentMethod,
      notes: customerInfo.notes
    };

    await onBookingSubmit(finalBooking);
  };

  const renderCustomerInfo = () => (
    <div className="customer-info-step">
      <button onClick={onBack} className="back-button">← Back</button>
      <h2>Your Information</h2>

      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              value={customerInfo.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              value={customerInfo.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="form-group">
          <label>Special Requests or Preferences</label>
          <textarea
            value={customerInfo.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any allergies, preferences, or special requests..."
            rows="4"
          />
        </div>
      </div>

      {bookingData.loyaltyAccount && (
        <div className="loyalty-section">
          <h3>Loyalty Rewards</h3>
          <div className="loyalty-info">
            <div className="tier-badge" style={{ 
              backgroundColor: getTierColor(bookingData.loyaltyAccount.tier_level) 
            }}>
              {bookingData.loyaltyAccount.tier_level.toUpperCase()}
            </div>
            <div className="points-display">
              <span className="points-value">{bookingData.loyaltyAccount.points_balance}</span>
              <span className="points-label">points available</span>
            </div>
          </div>

          <div className="points-redemption">
            <label>Redeem Points (100 points = $1)</label>
            <div className="points-slider-container">
              <input
                type="range"
                min="0"
                max={bookingData.loyaltyAccount.points_balance}
                step="100"
                value={pointsToRedeem}
                onChange={(e) => handlePointsRedemption(parseInt(e.target.value))}
              />
              <div className="points-values">
                <span>{pointsToRedeem} points</span>
                <span className="discount-value">-${(pointsToRedeem / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pricing-summary">
        <h3>Booking Summary</h3>
        <div className="summary-line">
          <span>{bookingData.service?.name}</span>
          <span>${bookingData.service?.price}</span>
        </div>
        {discount > 0 && (
          <div className="summary-line discount">
            <span>Discounts & Rewards</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-line total">
          <span>Total</span>
          <span>${finalPrice.toFixed(2)}</span>
        </div>
        {pointsToEarn > 0 && (
          <div className="points-to-earn">
            <span className="earn-badge">✨ You'll earn {pointsToEarn} points!</span>
            {isBirthdayMonth(bookingData.loyaltyAccount?.birthday) && (
              <span className="birthday-bonus">🎂 Birthday Month - Double Points!</span>
            )}
          </div>
        )}
      </div>

      <button onClick={handleContinueToPayment} className="continue-button">
        Continue to Payment
      </button>
    </div>
  );

  const renderPayment = () => (
    <div className="payment-step">
      <button onClick={() => onStepChange('customer-info')} className="back-button">← Back</button>
      <h2>Payment</h2>

      <div className="payment-summary">
        <h3>Booking Details</h3>
        <div className="booking-details">
          <p><strong>{bookingData.service?.name}</strong></p>
          <p>{new Date(bookingData.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}</p>
          <p>{formatTime(bookingData.time)} ({bookingData.duration} minutes)</p>
          {bookingData.staff && <p>with {bookingData.staff.name}</p>}
        </div>
        <div className="price-breakdown">
          <div className="price-line"><span>Service:</span><span>${bookingData.service?.price}</span></div>
          {discount > 0 && (
            <div className="price-line discount"><span>Savings:</span><span>-${discount.toFixed(2)}</span></div>
          )}
          <div className="price-line total"><span>Total:</span><span>${finalPrice.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="payment-options">
        <h3>Payment Method</h3>
        <div className="payment-method-selector">
          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              value="pay-now"
              checked={paymentMethod === 'pay-now'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>Pay Now (BOT POS)</span>
          </label>
          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              value="pay-later"
              checked={paymentMethod === 'pay-later'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>Pay at Location</span>
          </label>
        </div>
      </div>

      {paymentMethod === 'pay-now' && (
        <div className="bot-pos-integration">
          <p className="info-message">
            You will be redirected to our secure BOT POS payment portal to complete your transaction.
          </p>
          {/* BOT POS integration would go here */}
        </div>
      )}

      <button 
        onClick={handleCompleteBooking} 
        className="complete-booking-button"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Complete Booking'}
      </button>
    </div>
  );

  const renderConfirmation = () => (
    <div className="confirmation-step">
      <div className="confirmation-success">
        <div className="success-icon">✓</div>
        <h2>Booking Confirmed!</h2>
        <p>Your appointment has been successfully booked.</p>
      </div>

      <div className="confirmation-details">
        <h3>Appointment Details</h3>
        <div className="detail-item">
          <span className="label">Service:</span>
          <span className="value">{bookingData.service?.name}</span>
        </div>
        <div className="detail-item">
          <span className="label">Date:</span>
          <span className="value">
            {new Date(bookingData.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>
        <div className="detail-item">
          <span className="label">Time:</span>
          <span className="value">{formatTime(bookingData.time)}</span>
        </div>
        <div className="detail-item">
          <span className="label">Duration:</span>
          <span className="value">{bookingData.duration} minutes</span>
        </div>
        {bookingData.staff && (
          <div className="detail-item">
            <span className="label">Therapist:</span>
            <span className="value">{bookingData.staff.name}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="label">Total Paid:</span>
          <span className="value">${finalPrice.toFixed(2)}</span>
        </div>
      </div>

      {pointsToEarn > 0 && (
        <div className="points-earned-celebration">
          <div className="celebration-animation">✨ 🎉 ✨</div>
          <h3>You Earned {pointsToEarn} Points!</h3>
          <p>Your new balance: {(bookingData.loyaltyAccount?.points_balance || 0) - pointsToRedeem + pointsToEarn} points</p>
        </div>
      )}

      <div className="confirmation-actions">
        <p>A confirmation email has been sent to {customerInfo.email}</p>
        <p className="reminder-note">📱 You'll receive a reminder 24 hours before your appointment</p>
      </div>
    </div>
  );

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2'
    };
    return colors[tier] || colors.bronze;
  };

  return (
    <div className="customer-booking-flow">
      {currentStep === 'customer-info' && renderCustomerInfo()}
      {currentStep === 'payment' && renderPayment()}
      {currentStep === 'confirmation' && renderConfirmation()}
    </div>
  );
};

export default CustomerBookingFlow;

