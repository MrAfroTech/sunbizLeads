/**
 * Coffee & Conversations Collective - Bookings API
 * Handles booking creation, updates, and retrieval
 */

// Mock database - in production, replace with actual database
let mockBookings = [];
let bookingIdCounter = 1;

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - Retrieve bookings
    if (req.method === 'GET') {
      const { date, status, customer_id, staff_id } = req.query;
      
      let filteredBookings = [...mockBookings];
      
      if (date) {
        filteredBookings = filteredBookings.filter(b => b.booking_date === date);
      }
      
      if (status && status !== 'all') {
        filteredBookings = filteredBookings.filter(b => b.status === status);
      }
      
      if (customer_id) {
        filteredBookings = filteredBookings.filter(b => b.customer_id === customer_id);
      }
      
      if (staff_id) {
        filteredBookings = filteredBookings.filter(b => b.staff_id === staff_id);
      }
      
      // Sort by date and time
      filteredBookings.sort((a, b) => {
        if (a.booking_date !== b.booking_date) {
          return a.booking_date.localeCompare(b.booking_date);
        }
        return a.start_time.localeCompare(b.start_time);
      });
      
      return res.status(200).json({
        success: true,
        bookings: filteredBookings,
        total: filteredBookings.length
      });
    }
    
    // POST - Create new booking
    if (req.method === 'POST') {
      const bookingData = req.body;
      
      const newBooking = {
        id: `booking_${bookingIdCounter++}`,
        customer_id: bookingData.customer_info?.email || 'guest',
        customer_first_name: bookingData.customer_info?.firstName,
        customer_last_name: bookingData.customer_info?.lastName,
        customer_email: bookingData.customer_info?.email,
        customer_phone: bookingData.customer_info?.phone,
        service_type: bookingData.service_type,
        service_id: bookingData.service_id,
        service_name: bookingData.service_name,
        staff_id: bookingData.staff_id || null,
        staff_name: bookingData.staff_name,
        booking_date: bookingData.booking_date,
        start_time: bookingData.start_time,
        end_time: calculateEndTime(bookingData.start_time, bookingData.duration),
        duration: bookingData.duration,
        status: 'confirmed',
        price: bookingData.price,
        discount_applied: bookingData.discount_applied || 0,
        loyalty_points_used: bookingData.loyalty_points_used || 0,
        loyalty_points_earned: bookingData.loyalty_points_earned || 0,
        payment_status: bookingData.payment_method === 'pay-now' ? 'completed' : 'pending',
        payment_method: bookingData.payment_method,
        bot_pos_transaction_id: bookingData.bot_pos_transaction_id || null,
        notes: bookingData.notes || '',
        recurring: false,
        reminder_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockBookings.push(newBooking);
      
      // In production, award loyalty points here
      if (newBooking.loyalty_points_earned > 0) {
        // Call loyalty API to award points
      }
      
      return res.status(201).json({
        success: true,
        booking: newBooking,
        message: 'Booking created successfully'
      });
    }
    
    // PUT - Update booking
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updateData = req.body;
      
      const bookingIndex = mockBookings.findIndex(b => b.id === id);
      
      if (bookingIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      mockBookings[bookingIndex] = {
        ...mockBookings[bookingIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        booking: mockBookings[bookingIndex],
        message: 'Booking updated successfully'
      });
    }
    
    // DELETE - Cancel booking
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      const bookingIndex = mockBookings.findIndex(b => b.id === id);
      
      if (bookingIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      const booking = mockBookings[bookingIndex];
      
      // Refund loyalty points if used
      if (booking.loyalty_points_used > 0) {
        // Call loyalty API to refund points
      }
      
      mockBookings[bookingIndex].status = 'cancelled';
      mockBookings[bookingIndex].updated_at = new Date().toISOString();
      
      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully'
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Bookings API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
}

// Initialize with sample data
mockBookings = [
  {
    id: 'booking_001',
    customer_id: 'customer_001',
    customer_first_name: 'Emma',
    customer_last_name: 'Johnson',
    customer_email: 'emma@example.com',
    customer_phone: '555-0199',
    service_type: 'massage',
    service_id: 'service_deep_tissue',
    service_name: 'Deep Tissue Massage',
    staff_id: 'staff_sarah_thompson',
    staff_name: 'Sarah Thompson',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '14:00:00',
    end_time: '15:00:00',
    duration: 60,
    status: 'confirmed',
    price: 95.00,
    discount_applied: 9.50,
    loyalty_points_used: 0,
    loyalty_points_earned: 86,
    payment_status: 'completed',
    payment_method: 'pay-now',
    bot_pos_transaction_id: 'botpos_tx_001',
    notes: 'Customer prefers medium pressure',
    recurring: false,
    reminder_sent: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
bookingIdCounter = 2;

