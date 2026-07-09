#!/bin/bash

# Deploy Lambda Functions Script
# This script packages and deploys the actual Lambda function code

set -e

echo "🚀 Deploying Lambda functions to AWS..."

# Configuration
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="ezdrink-vendor-management"
LAMBDA_BUCKET="ezdrink-lambda-deployments"

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

# Check if required files exist
if [ ! -f "vendor-management-handler.js" ]; then
    print_error "vendor-management-handler.js not found. Please run this script from the lambda-square directory."
    exit 1
fi

if [ ! -f "websocket-handler.js" ]; then
    print_error "websocket-handler.js not found. Please run this script from the lambda-square directory."
    exit 1
fi

print_status "AWS credentials verified. Proceeding with Lambda deployment..."

# Install dependencies
print_status "Installing dependencies..."
npm install

# Create deployment packages
print_status "Creating deployment packages..."

# Package vendor management function
print_status "Packaging vendor management function..."
mkdir -p dist
cp vendor-management-handler.js dist/
cp package.json dist/
cd dist
npm install --production
zip -r vendor-management-function.zip .
cd ..

# Package WebSocket handler function
print_status "Packaging WebSocket handler function..."
mkdir -p dist-websocket
cp websocket-handler.js dist-websocket/
cp package.json dist-websocket/
cd dist-websocket
npm install --production
zip -r websocket-handler-function.zip .
cd ..

# Upload to S3
print_status "Uploading packages to S3..."
aws s3 cp dist/vendor-management-function.zip s3://$LAMBDA_BUCKET/ --region $REGION
aws s3 cp dist-websocket/websocket-handler-function.zip s3://$LAMBDA_BUCKET/ --region $REGION

print_status "Packages uploaded to S3 successfully"

# Update Lambda functions with new code
print_status "Updating Lambda functions..."

# Get function names from CloudFormation stack
VENDOR_FUNCTION_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`VendorManagementFunctionArn`].OutputValue' \
  --output text | cut -d':' -f7)

WEBSOCKET_FUNCTION_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketHandlerFunctionArn`].OutputValue' \
  --output text | cut -d':' -f7)

if [ "$VENDOR_FUNCTION_NAME" = "None" ] || [ -z "$VENDOR_FUNCTION_NAME" ]; then
    print_error "Could not get vendor function name from CloudFormation stack"
    exit 1
fi

if [ "$WEBSOCKET_FUNCTION_NAME" = "None" ] || [ -z "$WEBSOCKET_FUNCTION_NAME" ]; then
    print_error "Could not get WebSocket function name from CloudFormation stack"
    exit 1
fi

print_status "Vendor function: $VENDOR_FUNCTION_NAME"
print_status "WebSocket function: $WEBSOCKET_FUNCTION_NAME"

# Update vendor management function
print_status "Updating vendor management function..."
aws lambda update-function-code \
  --function-name $VENDOR_FUNCTION_NAME \
  --zip-file fileb://dist/vendor-management-function.zip \
  --region $REGION

# Update WebSocket handler function
print_status "Updating WebSocket handler function..."
aws lambda update-function-code \
  --function-name $WEBSOCKET_FUNCTION_NAME \
  --zip-file fileb://dist-websocket/websocket-handler-function.zip \
  --region $REGION

# Wait for functions to update
print_status "Waiting for functions to update..."
aws lambda wait function-updated --function-name $VENDOR_FUNCTION_NAME --region $REGION
aws lambda wait function-updated --function-name $WEBSOCKET_FUNCTION_NAME --region $REGION

print_status "Lambda functions updated successfully!"

# Clean up
print_status "Cleaning up temporary files..."
rm -rf dist dist-websocket

print_status "🎉 Lambda function deployment completed!"
print_status "Your vendor management system is now ready to use."

echo ""
print_status "Next steps:"
echo "  1. Test the vendor registration flow in your React app"
echo "  2. Check CloudWatch logs for any errors"
echo "  3. Verify the DynamoDB tables are being populated"
echo "  4. Test the WebSocket connection from your Customer UI"
