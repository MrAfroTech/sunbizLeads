#!/bin/bash

# Deploy SEO Lambda Functions
# This script deploys the SEO and location management Lambda functions

set -e

echo "🚀 Deploying SEO Lambda Functions..."

# Configuration
REGION=${AWS_REGION:-us-east-1}
FUNCTION_NAME_PREFIX="seamless-seo"
LAMBDA_BUCKET="seamless-lambda-deployments"

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

print_status "AWS credentials verified. Proceeding with SEO Lambda deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
print_status "Installing Lambda dependencies..."
npm install

# Create deployment package
print_status "Creating deployment package..."
zip -r seo-lambda-deployment.zip . -x "*.git*" "*.md" "deploy-*.sh" "test-*.js"

# Create S3 bucket for deployments if it doesn't exist
print_status "Creating S3 bucket for Lambda deployments..."
if aws s3 ls "s3://$LAMBDA_BUCKET" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$LAMBDA_BUCKET" --region $REGION
    print_status "S3 bucket created: $LAMBDA_BUCKET"
else
    print_warning "S3 bucket already exists: $LAMBDA_BUCKET"
fi

# Upload deployment package
print_status "Uploading deployment package to S3..."
aws s3 cp seo-lambda-deployment.zip "s3://$LAMBDA_BUCKET/seo-lambda-deployment.zip"

# Create IAM role for Lambda functions
print_status "Creating IAM role for SEO Lambda functions..."

ROLE_NAME="SeamlessSEOLambdaRole"
ROLE_POLICY_DOCUMENT='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Check if role exists
if aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
    print_warning "IAM role $ROLE_NAME already exists"
else
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document "$ROLE_POLICY_DOCUMENT"
    
    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    # Attach DynamoDB policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
    
    print_status "IAM role $ROLE_NAME created and policies attached"
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
print_status "Using IAM role: $ROLE_ARN"

# Wait for role to be ready
print_status "Waiting for IAM role to be ready..."
sleep 10

# Deploy Location Data Handler
print_status "Deploying Location Data Handler Lambda function..."
LOCATION_FUNCTION_NAME="${FUNCTION_NAME_PREFIX}-location-data"

if aws lambda get-function --function-name $LOCATION_FUNCTION_NAME &> /dev/null; then
    print_warning "Updating existing Lambda function: $LOCATION_FUNCTION_NAME"
    aws lambda update-function-code \
        --function-name $LOCATION_FUNCTION_NAME \
        --s3-bucket $LAMBDA_BUCKET \
        --s3-key seo-lambda-deployment.zip
else
    print_status "Creating new Lambda function: $LOCATION_FUNCTION_NAME"
    aws lambda create-function \
        --function-name $LOCATION_FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler location-data-handler.handler \
        --code S3Bucket=$LAMBDA_BUCKET,S3Key=seo-lambda-deployment.zip \
        --description "SEO Location Data Handler for Seamless Marketplace" \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables='{LOCATIONS_TABLE=seamless-locations,SCHEMA_TABLE=seamless-schema-data,FORM_CONFIGS_TABLE=seamless-form-configs}'
fi

# Deploy Schema Data Handler
print_status "Deploying Schema Data Handler Lambda function..."
SCHEMA_FUNCTION_NAME="${FUNCTION_NAME_PREFIX}-schema-data"

if aws lambda get-function --function-name $SCHEMA_FUNCTION_NAME &> /dev/null; then
    print_warning "Updating existing Lambda function: $SCHEMA_FUNCTION_NAME"
    aws lambda update-function-code \
        --function-name $SCHEMA_FUNCTION_NAME \
        --s3-bucket $LAMBDA_BUCKET \
        --s3-key seo-lambda-deployment.zip
else
    print_status "Creating new Lambda function: $SCHEMA_FUNCTION_NAME"
    aws lambda create-function \
        --function-name $SCHEMA_FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler schema-data-handler.handler \
        --code S3Bucket=$LAMBDA_BUCKET,S3Key=seo-lambda-deployment.zip \
        --description "SEO Schema Data Handler for Seamless Marketplace" \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables='{LOCATIONS_TABLE=seamless-locations,SCHEMA_TABLE=seamless-schema-data,FORM_CONFIGS_TABLE=seamless-form-configs}'
fi

# Create API Gateway (optional)
print_status "Creating API Gateway for SEO Lambda functions..."

API_NAME="SeamlessSEOAPI"
API_DESCRIPTION="API Gateway for SEO and Location Management"

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    print_status "Creating new API Gateway: $API_NAME"
    API_ID=$(aws apigateway create-rest-api \
        --name "$API_NAME" \
        --description "$API_DESCRIPTION" \
        --query 'id' \
        --output text)
else
    print_warning "API Gateway $API_NAME already exists with ID: $API_ID"
fi

print_status "API Gateway ID: $API_ID"

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/`].id' --output text)

# Create /seo resource
SEO_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part seo \
    --query 'id' \
    --output text)

# Create /seo/locations resource
LOCATIONS_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $SEO_RESOURCE_ID \
    --path-part locations \
    --query 'id' \
    --output text)

# Create /seo/locations/{locationId} resource
LOCATION_ID_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $LOCATIONS_RESOURCE_ID \
    --path-part '{locationId}' \
    --query 'id' \
    --output text)

# Create /seo/schema resource
SCHEMA_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $SEO_RESOURCE_ID \
    --path-part schema \
    --query 'id' \
    --output text)

# Create /seo/schema/{locationId} resource
SCHEMA_ID_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $SCHEMA_RESOURCE_ID \
    --path-part '{locationId}' \
    --query 'id' \
    --output text)

# Add methods to resources (GET, POST, PUT, DELETE)
for resource_id in $LOCATION_ID_RESOURCE_ID $SCHEMA_ID_RESOURCE_ID; do
    for method in GET POST PUT DELETE; do
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --resource-id $resource_id \
            --http-method $method \
            --authorization-type NONE
    done
done

# Add methods to parent resources (GET, POST)
for resource_id in $LOCATIONS_RESOURCE_ID $SCHEMA_RESOURCE_ID; do
    for method in GET POST; do
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --resource-id $resource_id \
            --http-method $method \
            --authorization-type NONE
    done
done

print_status "API Gateway resources and methods created"

# Deploy API Gateway
print_status "Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod

# Get API Gateway URL
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
print_status "API Gateway URL: $API_URL"

# Clean up deployment package
rm -f seo-lambda-deployment.zip

# Display deployment summary
print_status "🎉 SEO Lambda deployment completed successfully!"
echo ""
echo "Deployment Summary:"
echo "=================="
echo "Location Data Handler: $LOCATION_FUNCTION_NAME"
echo "Schema Data Handler: $SCHEMA_FUNCTION_NAME"
echo "API Gateway URL: $API_URL"
echo ""
echo "API Endpoints:"
echo "- GET $API_URL/seo/locations - Get all locations"
echo "- GET $API_URL/seo/locations/{locationId} - Get location data"
echo "- POST $API_URL/seo/locations - Create location data"
echo "- PUT $API_URL/seo/locations/{locationId} - Update location data"
echo "- DELETE $API_URL/seo/locations/{locationId} - Delete location data"
echo "- GET $API_URL/seo/schema - Get all schema data"
echo "- GET $API_URL/seo/schema/{locationId} - Get schema data"
echo "- POST $API_URL/seo/schema - Create schema data"
echo "- PUT $API_URL/seo/schema/{locationId} - Update schema data"
echo "- DELETE $API_URL/seo/schema/{locationId} - Delete schema data"
echo ""
echo "Next steps:"
echo "1. Update your React app to use the new API endpoints"
echo "2. Test the API endpoints with sample data"
echo "3. Deploy your React app with the updated configuration"
echo ""

print_status "🚀 SEO Lambda deployment complete!"
