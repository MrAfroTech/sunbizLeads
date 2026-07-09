/**
 * Coffee & Conversations Collective - Services API
 * Manages service catalog
 */

const { sampleServiceDocuments } = require('../../schemas/services-schema');

// Initialize with sample data
let mockServices = [...sampleServiceDocuments];
let serviceIdCounter = mockServices.length + 1;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - Retrieve services
    if (req.method === 'GET') {
      const { category, active } = req.query;
      
      let filteredServices = [...mockServices];
      
      if (category) {
        filteredServices = filteredServices.filter(s => s.category === category);
      }
      
      if (active !== undefined) {
        filteredServices = filteredServices.filter(s => s.active === (active === 'true'));
      }
      
      return res.status(200).json({
        success: true,
        services: filteredServices
      });
    }
    
    // POST - Create service
    if (req.method === 'POST') {
      const serviceData = req.body;
      
      const newService = {
        id: `service_${serviceIdCounter++}`,
        ...serviceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockServices.push(newService);
      
      return res.status(201).json({
        success: true,
        service: newService
      });
    }
    
    // PUT - Update service
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updateData = req.body;
      
      const serviceIndex = mockServices.findIndex(s => s.id === id);
      
      if (serviceIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }
      
      mockServices[serviceIndex] = {
        ...mockServices[serviceIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        service: mockServices[serviceIndex]
      });
    }
    
    // DELETE - Delete service
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      const serviceIndex = mockServices.findIndex(s => s.id === id);
      
      if (serviceIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }
      
      mockServices.splice(serviceIndex, 1);
      
      return res.status(200).json({
        success: true,
        message: 'Service deleted successfully'
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Services API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

