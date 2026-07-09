# Seamless SEO Lambda Functions

This directory contains Lambda functions for managing SEO and location-based content for the Seamless Marketplace website.

## Overview

The SEO Lambda functions provide:
- **Location Data Management**: Store and retrieve location-specific meta tags, content, and form configurations
- **Schema Data Management**: Manage structured data (JSON-LD) for SEO and search engines
- **Dynamic Content Generation**: Generate location-specific content based on DynamoDB data
- **API Endpoints**: RESTful API for frontend applications to access location data

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ React Frontend  │───▶│ API Gateway      │───▶│ Lambda Functions│
│ (Location Pages)│    │ (REST API)       │    │ (SEO Handlers)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ DynamoDB Tables │
                                                │ (Location Data) │
                                                └─────────────────┘
```

## Files

### Core Functions
- `location-data-handler.js` - Manages location-specific content and meta data
- `schema-data-handler.js` - Manages structured data (JSON-LD) for SEO
- `create-seo-tables.js` - Creates DynamoDB tables and seeds initial data

### Deployment
- `deploy-seo-lambda.sh` - Deploys Lambda functions and API Gateway
- `deploy-seo-tables.sh` - Creates DynamoDB tables
- `package.json` - Node.js dependencies and scripts

## DynamoDB Tables

### seamless-locations
**Purpose**: Stores location-specific content and meta data
**Primary Key**: `location_id` (String), `content_type` (String)
**GSI**: `priority-index` (priority, city_name)

**Attributes**:
- `location_id`: City slug (e.g., "orlando", "tampa")
- `content_type`: Type of content ("meta_data", "content", "form_config")
- `city_name`: Display name of the city
- `state`: State abbreviation
- `title_tag`: SEO title tag
- `meta_description`: SEO meta description
- `h1_headline`: Main page headline
- `local_area_1`: First local area reference
- `local_area_2`: Second local area reference
- `venue_types`: Array of venue types
- `priority`: SEO priority (0.6-0.9)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### seamless-schema-data
**Purpose**: Stores structured data (JSON-LD) for search engines
**Primary Key**: `location_id` (String), `schema_type` (String)

**Attributes**:
- `location_id`: City slug
- `schema_type`: Type of schema ("LocalBusiness", "Service", "Organization")
- `schema_data`: JSON-LD structured data object

### seamless-form-configs
**Purpose**: Stores form configurations for location-specific demo requests
**Primary Key**: `location_id` (String)

**Attributes**:
- `location_id`: City slug
- `form_title`: Form title text
- `location_options`: Array of location dropdown options
- `thank_you_message`: Thank you message after form submission
- `redirect_url`: Redirect URL after form submission

## API Endpoints

### Location Data API
- `GET /seo/locations` - Get all locations
- `GET /seo/locations/{locationId}` - Get specific location data
- `POST /seo/locations` - Create new location data
- `PUT /seo/locations/{locationId}` - Update location data
- `DELETE /seo/locations/{locationId}` - Delete location data

### Schema Data API
- `GET /seo/schema` - Get all schema data
- `GET /seo/schema/{locationId}` - Get specific schema data
- `POST /seo/schema` - Create new schema data
- `PUT /seo/schema/{locationId}` - Update schema data
- `DELETE /seo/schema/{locationId}` - Delete schema data

## Deployment

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- DynamoDB tables created

### Deploy Tables
```bash
./deploy-seo-tables.sh
```

### Deploy Lambda Functions
```bash
./deploy-seo-lambda.sh
```

### Manual Deployment
```bash
# Install dependencies
npm install

# Create tables
node create-seo-tables.js

# Deploy functions
./deploy-seo-lambda.sh
```

## Environment Variables

### Required
- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

### Optional
- `REACT_APP_AWS_REGION`: Frontend AWS region
- `REACT_APP_AWS_ACCESS_KEY_ID`: Frontend AWS access key
- `REACT_APP_AWS_SECRET_ACCESS_KEY`: Frontend AWS secret key

## Usage Examples

### Get Location Data
```javascript
const response = await fetch('https://api-id.execute-api.region.amazonaws.com/prod/seo/locations/orlando?contentType=meta_data');
const data = await response.json();
console.log(data.data);
```

### Create Location Data
```javascript
const locationData = {
  location_id: 'new-city',
  content_type: 'meta_data',
  city_name: 'New City',
  state: 'Florida',
  title_tag: 'New City Restaurant Technology | Seamless',
  meta_description: 'Help your New City restaurant...',
  h1_headline: 'Increase Your New City Restaurant Revenue',
  local_area_1: 'downtown New City',
  local_area_2: 'New City area',
  venue_types: ['restaurant', 'bar'],
  priority: 0.7
};

const response = await fetch('https://api-id.execute-api.region.amazonaws.com/prod/seo/locations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(locationData)
});
```

### Get Schema Data
```javascript
const response = await fetch('https://api-id.execute-api.region.amazonaws.com/prod/seo/schema/orlando?schemaType=LocalBusiness');
const data = await response.json();
console.log(data.data.schema_data);
```

## Testing

### Test Tables
```bash
node test-seo-functions.js
```

### Test API Endpoints
```bash
# Test location data endpoint
curl https://api-id.execute-api.region.amazonaws.com/prod/seo/locations/orlando

# Test schema data endpoint
curl https://api-id.execute-api.region.amazonaws.com/prod/seo/schema/orlando?schemaType=LocalBusiness
```

## Monitoring

### CloudWatch Logs
- Location Data Handler: `/aws/lambda/seamless-seo-location-data`
- Schema Data Handler: `/aws/lambda/seamless-seo-schema-data`

### Metrics
- Invocations
- Duration
- Errors
- Throttles

## Security

### IAM Permissions
The Lambda functions require the following permissions:
- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `dynamodb:Scan`
- `dynamodb:Query`

### CORS
All endpoints support CORS for cross-origin requests from the React frontend.

## Troubleshooting

### Common Issues

1. **DynamoDB Table Not Found**
   - Ensure tables are created using `deploy-seo-tables.sh`
   - Check table names match the code

2. **Permission Denied**
   - Verify IAM role has DynamoDB permissions
   - Check AWS credentials are configured

3. **API Gateway Not Working**
   - Ensure API Gateway is deployed
   - Check CORS configuration
   - Verify Lambda function integration

### Debug Mode
Set environment variable `DEBUG=true` for detailed logging.

## Contributing

1. Make changes to Lambda functions
2. Test locally with `node test-seo-functions.js`
3. Deploy with `./deploy-seo-lambda.sh`
4. Update documentation as needed

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review API Gateway logs
3. Test with curl commands
4. Contact the development team
