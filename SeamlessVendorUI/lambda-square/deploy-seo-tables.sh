#!/bin/bash

# Deploy SEO and Location Management Tables
# This script creates the DynamoDB tables for location-based content management

set -e

echo "🚀 Deploying SEO and Location Management Tables..."

# Configuration
REGION=${AWS_REGION:-us-east-1}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "AWS credentials verified. Proceeding with SEO table deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Create SEO tables
print_status "Creating SEO and location management tables..."
node create-seo-tables.js

if [ $? -eq 0 ]; then
    print_status "✅ SEO tables created successfully!"
else
    print_error "❌ Failed to create SEO tables"
    exit 1
fi

# Verify tables exist
print_status "Verifying table creation..."

TABLES=("seamless-locations" "seamless-schema-data" "seamless-form-configs")

for table in "${TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$table" --region "$REGION" &> /dev/null; then
        print_status "✅ Table $table exists and is active"
    else
        print_error "❌ Table $table not found or not active"
        exit 1
    fi
done

# Test data insertion
print_status "Testing data insertion..."

# Test inserting a sample location
aws dynamodb put-item \
    --table-name "seamless-locations" \
    --item '{
        "location_id": {"S": "test-location"},
        "content_type": {"S": "meta_data"},
        "city_name": {"S": "Test City"},
        "state": {"S": "Florida"},
        "title_tag": {"S": "Test Title"},
        "meta_description": {"S": "Test Description"},
        "h1_headline": {"S": "Test Headline"},
        "local_area_1": {"S": "Test Area 1"},
        "local_area_2": {"S": "Test Area 2"},
        "venue_types": {"SS": ["restaurant", "bar"]},
        "priority": {"N": "0.7"},
        "created_at": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"},
        "updated_at": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}
    }' \
    --region "$REGION"

if [ $? -eq 0 ]; then
    print_status "✅ Test data insertion successful"
    
    # Clean up test data
    aws dynamodb delete-item \
        --table-name "seamless-locations" \
        --key '{
            "location_id": {"S": "test-location"},
            "content_type": {"S": "meta_data"}
        }' \
        --region "$REGION"
    
    print_status "✅ Test data cleaned up"
else
    print_error "❌ Test data insertion failed"
    exit 1
fi

# Display table information
print_status "📊 Table Information:"
echo ""
echo "Table Name: seamless-locations"
echo "Description: Stores location-specific meta data, content, and form configurations"
echo "Primary Key: location_id (String), content_type (String)"
echo "GSI: priority-index (priority, city_name)"
echo ""

echo "Table Name: seamless-schema-data"
echo "Description: Stores structured data (JSON-LD) for each location"
echo "Primary Key: location_id (String), schema_type (String)"
echo ""

echo "Table Name: seamless-form-configs"
echo "Description: Stores form configurations for location-specific demo requests"
echo "Primary Key: location_id (String)"
echo ""

# Display next steps
print_status "🎉 SEO table deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your React app environment variables:"
echo "   - REACT_APP_AWS_REGION=$REGION"
echo "   - REACT_APP_AWS_ACCESS_KEY_ID=your_access_key"
echo "   - REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key"
echo ""
echo "2. Deploy your React app with the new location pages"
echo ""
echo "3. Test the location pages:"
echo "   - https://your-domain.com/orlando"
echo "   - https://your-domain.com/tampa"
echo "   - https://your-domain.com/locations/winter-garden"
echo ""
echo "4. Submit your sitemap to Google Search Console:"
echo "   - https://your-domain.com/api/sitemap"
echo ""
echo "5. Monitor analytics and performance in Google Analytics 4"
echo ""

print_status "🚀 SEO optimization setup complete!"
