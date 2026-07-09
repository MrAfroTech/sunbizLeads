/**
 * Coffee & Conversations Collective - Availability API
 * Returns available time slots for booking
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { date, service_id, staff_id } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    // In production, this would:
    // 1. Get staff working hours for the date
    // 2. Get existing bookings
    // 3. Calculate buffer times
    // 4. Return available slots

    // Mock availability - generate time slots for demonstration
    const timeSlots = generateTimeSlots(date, staff_id);

    return res.status(200).json({
      success: true,
      timeSlots,
      date
    });
  } catch (error) {
    console.error('Availability API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

function generateTimeSlots(date, staffId) {
  // Generate slots from 9 AM to 6 PM
  const slots = [];
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay();

  // Skip if weekend (for demo purposes)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Return limited weekend hours
    for (let hour = 10; hour <= 15; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30:00`);
    }
  } else {
    // Weekday hours: 9 AM to 6 PM
    for (let hour = 9; hour <= 18; hour++) {
      // Skip lunch hour (12-1 PM)
      if (hour === 12) continue;
      
      slots.push(`${String(hour).padStart(2, '0')}:00:00`);
      if (hour < 18) {
        slots.push(`${String(hour).padStart(2, '0')}:30:00`);
      }
    }
  }

  return slots;
}

