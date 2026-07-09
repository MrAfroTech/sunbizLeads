/**
 * Coffee & Conversations Collective - Booking Dashboard
 * Admin dashboard for managing bookings and viewing analytics
 */

import React, { useState, useEffect } from 'react';
import './BookingDashboard.css';

const BookingDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState('today'); // 'today', 'upcoming', 'all'

  useEffect(() => {
    loadBookings();
    loadStats();
  }, [selectedDate, filterStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings?date=${selectedDate}&status=${filterStatus}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
        
        // Filter today's bookings
        const today = new Date().toISOString().split('T')[0];
        setTodayBookings(data.bookings.filter(b => b.booking_date === today));
        
        // Filter upcoming bookings (next 7 days)
        const upcoming = data.bookings.filter(b => {
          const bookingDate = new Date(b.booking_date);
          const todayDate = new Date(today);
          const weekFromNow = new Date(today);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return bookingDate > todayDate && bookingDate <= weekFromNow;
        });
        setUpcomingBookings(upcoming);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/bookings/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        loadBookings();
        alert('Booking status updated successfully');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirm = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirm) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        loadBookings();
        alert('Booking cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#4caf50',
      pending: '#ff9800',
      completed: '#2196f3',
      cancelled: '#f44336',
      'no-show': '#9e9e9e'
    };
    return colors[status] || '#999';
  };

  const renderStats = () => (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Today's Bookings</h3>
        <div className="stat-value">{todayBookings.length}</div>
        <div className="stat-label">appointments</div>
      </div>
      <div className="stat-card">
        <h3>Upcoming (7 days)</h3>
        <div className="stat-value">{upcomingBookings.length}</div>
        <div className="stat-label">appointments</div>
      </div>
      {stats && (
        <>
          <div className="stat-card">
            <h3>This Month</h3>
            <div className="stat-value">{stats.thisMonth || 0}</div>
            <div className="stat-label">completed</div>
          </div>
          <div className="stat-card">
            <h3>Revenue (MTD)</h3>
            <div className="stat-value">${(stats.revenueThisMonth || 0).toLocaleString()}</div>
            <div className="stat-label">total</div>
          </div>
          <div className="stat-card">
            <h3>Loyalty Points</h3>
            <div className="stat-value">{(stats.loyaltyPointsAwarded || 0).toLocaleString()}</div>
            <div className="stat-label">awarded this month</div>
          </div>
          <div className="stat-card">
            <h3>Customer Retention</h3>
            <div className="stat-value">{stats.returnCustomerRate || 0}%</div>
            <div className="stat-label">repeat customers</div>
          </div>
        </>
      )}
    </div>
  );

  const renderBookingItem = (booking) => (
    <div key={booking.id} className="booking-item">
      <div className="booking-time">
        <div className="time-display">{formatTime(booking.start_time)}</div>
        <div className="duration">{booking.duration} min</div>
      </div>
      
      <div className="booking-details">
        <h4>{booking.service_name || booking.service_id}</h4>
        <p className="customer-name">
          {booking.customer_first_name} {booking.customer_last_name}
        </p>
        <p className="booking-meta">
          {booking.staff_name && `with ${booking.staff_name} • `}
          ${booking.price}
        </p>
        {booking.notes && (
          <p className="booking-notes">📝 {booking.notes}</p>
        )}
        {booking.loyalty_points_earned > 0 && (
          <p className="points-earned">✨ Customer earned {booking.loyalty_points_earned} points</p>
        )}
      </div>

      <div className="booking-actions">
        <div 
          className="status-badge" 
          style={{ backgroundColor: getStatusColor(booking.status) }}
        >
          {booking.status}
        </div>
        
        <div className="action-buttons">
          {booking.status === 'confirmed' && (
            <>
              <button 
                onClick={() => handleStatusChange(booking.id, 'completed')}
                className="complete-btn"
              >
                Complete
              </button>
              <button 
                onClick={() => handleStatusChange(booking.id, 'no-show')}
                className="no-show-btn"
              >
                No-Show
              </button>
            </>
          )}
          {booking.status === 'pending' && (
            <button 
              onClick={() => handleStatusChange(booking.id, 'confirmed')}
              className="confirm-btn"
            >
              Confirm
            </button>
          )}
          {['confirmed', 'pending'].includes(booking.status) && (
            <button 
              onClick={() => handleCancelBooking(booking.id)}
              className="cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="booking-dashboard">
      <div className="dashboard-header">
        <h1>Booking Dashboard</h1>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-picker"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {renderStats()}

      <div className="view-tabs">
        <button
          className={view === 'today' ? 'active' : ''}
          onClick={() => setView('today')}
        >
          Today ({todayBookings.length})
        </button>
        <button
          className={view === 'upcoming' ? 'active' : ''}
          onClick={() => setView('upcoming')}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          className={view === 'all' ? 'active' : ''}
          onClick={() => setView('all')}
        >
          All Bookings ({bookings.length})
        </button>
      </div>

      <div className="bookings-section">
        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : (
          <>
            {view === 'today' && (
              <div className="bookings-list">
                <h2>Today's Schedule - {formatDate(new Date())}</h2>
                {todayBookings.length === 0 ? (
                  <p className="no-bookings">No bookings for today</p>
                ) : (
                  todayBookings.map(renderBookingItem)
                )}
              </div>
            )}

            {view === 'upcoming' && (
              <div className="bookings-list">
                <h2>Upcoming (Next 7 Days)</h2>
                {upcomingBookings.length === 0 ? (
                  <p className="no-bookings">No upcoming bookings</p>
                ) : (
                  upcomingBookings.map(renderBookingItem)
                )}
              </div>
            )}

            {view === 'all' && (
              <div className="bookings-list">
                <h2>All Bookings</h2>
                {bookings.length === 0 ? (
                  <p className="no-bookings">No bookings found</p>
                ) : (
                  bookings.map(renderBookingItem)
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingDashboard;

