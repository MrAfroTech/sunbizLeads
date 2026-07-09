/**
 * Schema Data Handler Lambda Function
 * Manages structured data (JSON-LD) for SEO and location pages
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
  console.log('Schema Data Handler invoked:', JSON.stringify(event, null, 2));
  
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
    const schemaType = queryStringParameters?.schemaType || 'LocalBusiness';
    
    switch (httpMethod) {
      case 'GET':
        if (locationId) {
          return await getSchemaData(locationId, schemaType);
        } else {
          return await getAllSchemaData();
        }
        
      case 'POST':
        return await createSchemaData(JSON.parse(body || '{}'));
        
      case 'PUT':
        return await updateSchemaData(locationId, schemaType, JSON.parse(body || '{}'));
        
      case 'DELETE':
        return await deleteSchemaData(locationId, schemaType);
        
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in Schema Data Handler:', error);
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
 * Get schema data for a specific location and schema type
 */
async function getSchemaData(locationId, schemaType) {
  try {
    const params = {
      TableName: 'seamless-schema-data',
      Key: {
        location_id: locationId,
        schema_type: schemaType
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
      // Generate default schema
      const defaultSchema = generateDefaultSchema(locationId, schemaType);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: defaultSchema,
          generated: true
        })
      };
    }
  } catch (error) {
    console.error('Error getting schema data:', error);
    throw error;
  }
}

/**
 * Get all schema data
 */
async function getAllSchemaData() {
  try {
    const params = {
      TableName: 'seamless-schema-data'
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
    console.error('Error getting all schema data:', error);
    throw error;
  }
}

/**
 * Create new schema data
 */
async function createSchemaData(schemaData) {
  try {
    // Validate required fields
    if (!schemaData.location_id || !schemaData.schema_type) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: location_id, schema_type'
        })
      };
    }
    
    // Validate schema data structure
    if (!schemaData.schema_data || typeof schemaData.schema_data !== 'object') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Invalid schema_data: must be a valid JSON object'
        })
      };
    }
    
    const params = {
      TableName: 'seamless-schema-data',
      Item: schemaData,
      ConditionExpression: 'attribute_not_exists(location_id) AND attribute_not_exists(schema_type)'
    };
    
    await dynamodb.put(params).promise();
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Schema data created successfully',
        data: schemaData
      })
    };
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Schema data already exists'
        })
      };
    }
    console.error('Error creating schema data:', error);
    throw error;
  }
}

/**
 * Update existing schema data
 */
async function updateSchemaData(locationId, schemaType, updateData) {
  try {
    if (!locationId || !schemaType) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Missing location_id or schema_type'
        })
      };
    }
    
    const params = {
      TableName: 'seamless-schema-data',
      Key: {
        location_id: locationId,
        schema_type: schemaType
      },
      UpdateExpression: 'SET schema_data = :schemaData',
      ExpressionAttributeValues: {
        ':schemaData': updateData.schema_data
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Schema data updated successfully',
        data: result.Attributes
      })
    };
  } catch (error) {
    console.error('Error updating schema data:', error);
    throw error;
  }
}

/**
 * Delete schema data
 */
async function deleteSchemaData(locationId, schemaType) {
  try {
    if (!locationId || !schemaType) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Missing location_id or schema_type'
        })
      };
    }
    
    const params = {
      TableName: 'seamless-schema-data',
      Key: {
        location_id: locationId,
        schema_type: schemaType
      }
    };
    
    await dynamodb.delete(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Schema data deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting schema data:', error);
    throw error;
  }
}

/**
 * Generate default schema markup for a location
 */
function generateDefaultSchema(locationId, schemaType) {
  const cityName = locationId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  const baseSchema = {
    location_id: locationId,
    schema_type: schemaType,
    schema_data: {}
  };
  
  switch (schemaType) {
    case 'LocalBusiness':
      baseSchema.schema_data = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `Seamless Ordering - ${cityName}`,
        "description": `QR code ordering system for ${cityName} restaurants, bars, and venues`,
        "url": `https://seamless.com/locations/${locationId}`,
        "operatingSystem": "iOS, Android, Web",
        "applicationCategory": "BusinessApplication",
        "areaServed": {
          "@type": "City",
          "name": cityName,
          "containedInPlace": {
            "@type": "State",
            "name": "Florida"
          }
        },
        "offers": {
          "@type": "Offer",
          "description": `Multi-POS integration service for ${cityName} venues`,
          "businessFunction": "http://purl.org/goodrelations/v1#LeaseOut"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "POS Integration Services",
          "itemListElement": [
            {
              "@type": "OfferCatalog",
              "name": "Restaurant Integration"
            },
            {
              "@type": "OfferCatalog", 
              "name": "Bar & Club Integration"
            },
            {
              "@type": "OfferCatalog",
              "name": "Festival & Event Integration"
            }
          ]
        }
      };
      break;
      
    case 'Service':
      baseSchema.schema_data = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "POS System Integration",
        "description": "Integration with existing Point of Sale systems for mobile ordering",
        "provider": {
          "@type": "Organization",
          "name": "Seamless"
        },
        "areaServed": {
          "@type": "City",
          "name": cityName,
          "containedInPlace": {
            "@type": "State",
            "name": "Florida"
          }
        },
        "serviceType": "Business Software Integration"
      };
      break;
      
    case 'Organization':
      baseSchema.schema_data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Seamless",
        "description": "Restaurant technology solutions provider",
        "url": "https://seamless.com",
        "areaServed": {
          "@type": "City",
          "name": cityName,
          "containedInPlace": {
            "@type": "State",
            "name": "Florida"
          }
        }
      };
      break;
      
    default:
      baseSchema.schema_data = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `Seamless - ${cityName} Restaurant Technology`,
        "description": `Restaurant technology solutions for ${cityName}`,
        "url": `https://seamless.com/locations/${locationId}`
      };
  }
  
  return baseSchema;
}

module.exports = {
  handler: exports.handler,
  getSchemaData,
  getAllSchemaData,
  createSchemaData,
  updateSchemaData,
  deleteSchemaData
};
