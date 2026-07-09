/**
 * Coffee & Conversations Collective - Booking Calendar Component
 * Interactive calendar with time slot selection
 */

import React, { useState, useEffect } from 'react';
import './BookingCalendar.css';

const BookingCalendar = ({ 
  selectedDate, 
  selectedTime, 
  availableSlots, 
  duration, 
  onDateTimeSelect,
  loading
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [selectedDay, setSelectedDay] = useState(selectedDate ? new Date(selectedDate) : null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (selectedDate) {
      setSelectedDay(new Date(selectedDate));
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDay) return false;
    return date.toDateString() === selectedDay.toDateString();
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    setSelectedDay(date);
    const dateStr = date.toISOString().split('T')[0];
    // Don't call onDateTimeSelect yet, wait for time selection
  };

  const handleTimeSlotClick = (timeSlot) => {
    if (!selectedDay) return;
    const dateStr = selectedDay.toISOString().split('T')[0];
    onDateTimeSelect(dateStr, timeSlot);
  };

  const formatTimeSlot = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentMonth);

    return (
      <div className="calendar-month">
        <div className="calendar-header">
          <button onClick={goToPreviousMonth} className="nav-button">←</button>
          <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
          <button onClick={goToNextMonth} className="nav-button">→</button>
        </div>

        <div className="calendar-grid">
          {daysOfWeek.map(day => (
            <div key={day} className="calendar-day-name">{day}</div>
          ))}
          {days.map((date, index) => (
            <div
              key={index}
              className={`calendar-day ${!date ? 'empty' : ''} ${
                isDateDisabled(date) ? 'disabled' : ''
              } ${isDateSelected(date) ? 'selected' : ''}`}
              onClick={() => date && handleDateClick(date)}
            >
              {date && date.getDate()}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTimeSlots = () => {
    if (!selectedDay) {
      return (
        <div className="time-slots-placeholder">
          <p>Select a date to view available times</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="time-slots-loading">
          <p>Loading available times...</p>
        </div>
      );
    }

    if (!availableSlots || availableSlots.length === 0) {
      return (
        <div className="time-slots-empty">
          <p>No available times for this date</p>
          <p className="suggestion">Try selecting a different date</p>
        </div>
      );
    }

    // Group time slots by time of day
    const morning = availableSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour < 12;
    });

    const afternoon = availableSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 12 && hour < 17;
    });

    const evening = availableSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 17;
    });

    return (
      <div className="time-slots-container">
        <h4>Available Times - {selectedDay.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })}</h4>
        
        {morning.length > 0 && (
          <div className="time-slot-group">
            <h5>Morning</h5>
            <div className="time-slots">
              {morning.map(slot => (
                <button
                  key={slot}
                  className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                  onClick={() => handleTimeSlotClick(slot)}
                >
                  {formatTimeSlot(slot)}
                </button>
              ))}
            </div>
          </div>
        )}

        {afternoon.length > 0 && (
          <div className="time-slot-group">
            <h5>Afternoon</h5>
            <div className="time-slots">
              {afternoon.map(slot => (
                <button
                  key={slot}
                  className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                  onClick={() => handleTimeSlotClick(slot)}
                >
                  {formatTimeSlot(slot)}
                </button>
              ))}
            </div>
          </div>
        )}

        {evening.length > 0 && (
          <div className="time-slot-group">
            <h5>Evening</h5>
            <div className="time-slots">
              {evening.map(slot => (
                <button
                  key={slot}
                  className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                  onClick={() => handleTimeSlotClick(slot)}
                >
                  {formatTimeSlot(slot)}
                </button>
              ))}
            </div>
          </div>
        )}

        {duration && (
          <div className="duration-note">
            <p>Duration: {duration} minutes</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="booking-calendar">
      <div className="calendar-view-toggle">
        <button 
          className={viewMode === 'month' ? 'active' : ''}
          onClick={() => setViewMode('month')}
        >
          Month
        </button>
        <button 
          className={viewMode === 'week' ? 'active' : ''}
          onClick={() => setViewMode('week')}
        >
          Week
        </button>
      </div>

      <div className="calendar-main">
        <div className="calendar-section">
          {renderMonthView()}
        </div>
        <div className="time-slots-section">
          {renderTimeSlots()}
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;

