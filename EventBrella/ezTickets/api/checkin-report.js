// api/checkin-report.js - View check-in report (who showed up, when, etc.)
// Note: This uses in-memory storage. In production, replace with database queries.

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Use GET to view report.'
    });
  }

  try {
    // Import the check-in log from validate-ticket.js
    // Note: In production, this should query a database
    // For now, we'll need to access the shared store
    
    // This is a placeholder - in production, query your database
    // For now, return instructions on how to access the data
    
    return res.status(200).json({
      success: true,
      message: 'Check-in report endpoint',
      note: 'In production, this should query your database for all check-ins. Currently using in-memory storage in validate-ticket.js',
      instructions: 'Check-in data is stored in the validate-ticket.js module. To view reports, you can: 1) Query your database directly, 2) Add database integration to store check-ins, 3) Export check-in logs via API'
    });

  } catch (error) {
    console.error('❌ Check-in report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};








