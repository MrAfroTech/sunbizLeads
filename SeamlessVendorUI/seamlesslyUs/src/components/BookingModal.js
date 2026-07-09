import React, { useState, useEffect } from 'react';
import '../styles/LeadCapturePopup.css';

// 30-minute blocks between 10:00 AM and 12:30 PM (inclusive)
const TIME_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];

const BookingModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setDate('');
      setTime('');
      setError(null);
      setConfirmed(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !phone) {
      setError('Please enter your name, email, and phone number.');
      return;
    }
    if (!date || !time) {
      setError('Please select a date and time slot.');
      return;
    }
    setSubmitting(true);
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch('/api/book-maurice-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          date,
          time,
          timeZone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not book appointment.');
        return;
      }
      setConfirmed(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="popup-close" onClick={onClose} aria-label="Close">×</button>
        {confirmed ? (
          <div className="thank-you-message">
            <h3>Booked</h3>
            <p>Your appointment has been scheduled. You’ll receive a calendar invite with a Microsoft Teams meeting link.</p>
            <button type="button" className="primary-button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="popup-form">
            <div className="form-step">
              <div className="form-group">
                <label htmlFor="booking-name">Name</label>
                <input
                  id="booking-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="booking-email">Email</label>
                <input
                  id="booking-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="booking-phone">Phone</label>
                <input
                  id="booking-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  autoComplete="tel"
                />
              </div>
              <div className="form-group">
                <label htmlFor="booking-date">Pick a date</label>
                <input
                  id="booking-date"
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setTime(''); }}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="form-group">
                <label>Time (30-min slots, 10:00 AM – 12:30 PM)</label>
                <div className="booking-slots">
                  {TIME_SLOTS.map((slot) => {
                    const [h] = slot.split(':').map(Number);
                    const ampm = h < 12 ? 'AM' : 'PM';
                    const label = `${slot} ${ampm}`;
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`booking-slot ${time === slot ? 'selected' : ''}`}
                        onClick={() => setTime(slot)}
                        disabled={!date}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button
                type="submit"
                className="primary-button submit-button"
                disabled={submitting}
              >
                {submitting ? 'Booking…' : 'Confirm'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
