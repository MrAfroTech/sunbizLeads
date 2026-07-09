/**
 * SEO Location Data Handler Lambda Function
 * Manages location-specific content, meta tags, and schema data
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('SEO Location Data Handler invoked:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }
  
  try {
    const { httpMethod, pathParameters, queryStringParameters, body } = event;
    const locationId = pathParameters?.locationId;
    const contentType = queryStringParameters?.contentType || 'meta_data';
    
    switch (httpMethod) {
      case 'GET':
        if (locationId) {
          return await getLocationData(locationId, contentType);
        } else {
          return await getAllLocations();
        }
        
      case 'POST':
        return await createLocationData(JSON.parse(body || '{}'));
        
      case 'PUT':
        return await updateLocationData(locationId, JSON.parse(body || '{}'));
        
      case 'DELETE':
        return await deleteLocationData(locationId, contentType);
        
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in SEO Location Data Handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

/**
 * Get location data for a specific location and content type
 */
async function getLocationData(locationId, contentType) {
  try {
    const params = {
      TableName: 'seamless-locations',
      Key: {
        location_id: locationId,
        content_type: contentType
      }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (result.Item) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: result.Item
        })
      };
    } else {
      // Return fallback data
      const fallbackData = generateFallbackLocationData(locationId, contentType);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: fallbackData,
          fallback: true
        })
      };
    }
  } catch (error) {
    console.error('Error getting location data:', error);
    throw error;
  }
}

/**
 * Get all locations
 */
async function getAllLocations() {
  try {
    const params = {
      TableName: 'seamless-locations',
      FilterExpression: 'content_type = :contentType',
      ExpressionAttributeValues: {
        ':contentType': 'meta_data'
      }
    };
    
    const result = await dynamodb.scan(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
        count: result.Items?.length || 0
      })
    };
  } catch (error) {
    console.error('Error getting all locations:', error);
    throw error;
  }
}

/**
 * Create new location data
 */
async function createLocationData(locationData) {
  try {
    // Validate required fields
    if (!locationData.location_id || !locationData.content_type) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: location_id, content_type'
        })
      };
    }
    
    // Add timestamps
    const now = new Date().toISOString();
    locationData.created_at = now;
    locationData.updated_at = now;
    
    const params = {
      TableName: 'seamless-locations',
      Item: locationData,
      ConditionExpression: 'attribute_not_exists(location_id) AND attribute_not_exists(content_type)'
    };
    
    await dynamodb.put(params).promise();
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Location data created successfully',
        data: locationData
      })
    };
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Location data already exists'
        })
      };
    }
    console.error('Error creating location data:', error);
    throw error;
  }
}

/**
 * Update existing location data
 */
async function updateLocationData(locationId, updateData) {
  try {
    if (!locationId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Missing location_id'
        })
      };
    }
    
    // Add update timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Build update expression
    const updateExpression = 'SET ' + Object.keys(updateData)
      .filter(key => key !== 'location_id' && key !== 'content_type')
      .map(key => `${key} = :${key}`)
      .join(', ');
    
    const expressionAttributeValues = {};
    Object.keys(updateData).forEach(key => {
      if (key !== 'location_id' && key !== 'content_type') {
        expressionAttributeValues[`:${key}`] = updateData[key];
      }
    });
    
    const params = {
      TableName: 'seamless-locations',
      Key: {
        location_id: locationId,
        content_type: updateData.content_type || 'meta_data'
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Location data updated successfully',
        data: result.Attributes
      })
    };
  } catch (error) {
    console.error('Error updating location data:', error);
    throw error;
  }
}

/**
 * Delete location data
 */
async function deleteLocationData(locationId, contentType) {
  try {
    if (!locationId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Missing location_id'
        })
      };
    }
    
    const params = {
      TableName: 'seamless-locations',
      Key: {
        location_id: locationId,
        content_type: contentType
      }
    };
    
    await dynamodb.delete(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Location data deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting location data:', error);
    throw error;
  }
}

/**
 * Generate fallback location data when DynamoDB data is not available
 */
function generateFallbackLocationData(locationId, contentType) {
  const cityName = locationId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  const baseData = {
    location_id: locationId,
    content_type: contentType,
    city_name: cityName,
    state: 'Florida',
    priority: 0.7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  if (contentType === 'meta_data') {
    return {
      ...baseData,
      title_tag: `Restaurant Technology Solutions in ${cityName} | Seamless`,
      meta_description: `Help your ${cityName} restaurant serve more customers and boost revenue. Seamless reduces wait times by 60% throughout ${cityName}. Free demo for business owners.`,
      h1_headline: `Increase Your ${cityName} Restaurant Revenue - Reduce Wait Times by 60%`,
      local_area_1: `downtown ${cityName}`,
      local_area_2: `${cityName} area`,
      venue_types: ['restaurant', 'bar', 'local_business']
    };
  }
  
  return baseData;
}

module.exports = {
  handler: exports.handler,
  getLocationData,
  getAllLocations,
  createLocationData,
  updateLocationData,
  deleteLocationData
};
