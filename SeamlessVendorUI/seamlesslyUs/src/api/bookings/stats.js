/**
 * Coffee & Conversations Collective - Booking Statistics API
 * Returns analytics and stats for the admin dashboard
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
    // Mock stats - in production, calculate from database
    const stats = {
      thisMonth: 47,
      revenueThisMonth: 4250,
      loyaltyPointsAwarded: 3800,
      returnCustomerRate: 68,
      avgBookingValue: 90.43,
      completionRate: 94.5,
      noShowRate: 2.1,
      cancellationRate: 3.4,
      topServices: [
        { name: 'Deep Tissue Massage', bookings: 18 },
        { name: 'Swedish Massage', bookings: 12 },
        { name: 'Hot Stone Massage', bookings: 8 }
      ],
      topStaff: [
        { name: 'Sarah Thompson', bookings: 22, revenue: 1980 },
        { name: 'Michael Chen', bookings: 15, revenue: 1425 },
        { name: 'Jessica Martinez', bookings: 10, revenue: 845 }
      ]
    };

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

