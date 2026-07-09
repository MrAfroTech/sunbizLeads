/**
 * Coffee & Conversations Collective - Staff API
 * Manages staff members and schedules
 */

const { sampleStaffDocuments } = require('../../schemas/staff-schema');

let mockStaff = [...sampleStaffDocuments];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const { service_id, active } = req.query;
      
      let filteredStaff = [...mockStaff];
      
      if (service_id) {
        filteredStaff = filteredStaff.filter(s => 
          s.services.includes(service_id)
        );
      }
      
      if (active !== undefined) {
        filteredStaff = filteredStaff.filter(s => s.active === (active === 'true'));
      }
      
      return res.status(200).json({
        success: true,
        staff: filteredStaff
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Staff API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

