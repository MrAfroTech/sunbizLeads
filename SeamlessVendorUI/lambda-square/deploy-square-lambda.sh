#!/bin/bash

# Deploy Square Lambda Function Script
# This script deploys the Square OAuth lambda with correct DynamoDB configuration

set -e

echo "🚀 Deploying Square Lambda function to AWS..."

# Configuration
REGION=${AWS_REGION:-us-east-1}
FUNCTION_NAME="seamless-square-oauth"
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
if [ ! -f "square-lambda-handler.js" ]; then
    print_error "square-lambda-handler.js not found. Please run this script from the lambda-square directory."
    exit 1
fi

print_status "AWS credentials verified. Proceeding with Square Lambda deployment..."

# Install dependencies
print_status "Installing dependencies..."
npm install

# Create deployment package
print_status "Creating deployment package..."
mkdir -p dist
cp square-lambda-handler.js dist/
cp package.json dist/
cd dist
npm install --production
zip -r square-lambda-function.zip .
cd ..

# Upload to S3
print_status "Uploading package to S3..."
aws s3 cp dist/square-lambda-function.zip s3://$LAMBDA_BUCKET/ --region $REGION

print_status "Package uploaded to S3 successfully"

# Check if Lambda function exists
print_status "Checking if Lambda function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    print_status "Lambda function exists. Updating code..."
    
    # Update function code
    aws lambda update-function-code \
      --function-name $FUNCTION_NAME \
      --zip-file fileb://dist/square-lambda-function.zip \
      --region $REGION
    
    print_status "Lambda function code updated successfully"
    
    # Update environment variables
    print_status "Updating environment variables..."
    aws lambda update-function-configuration \
      --function-name $FUNCTION_NAME \
      --environment Variables="{
        VENDOR_UPDATES_TABLE=vendor-updates-table,
        VENDORS_TABLE=ezdrink-vendors,
        SQUARE_APPLICATION_ID=${SQUARE_APPLICATION_ID},
        SQUARE_APPLICATION_SECRET=${SQUARE_APPLICATION_SECRET},
        SQUARE_ENVIRONMENT=production,
        FRONTEND_URL=https://4kpajzuyfjzteslcq3sai5us6y0wqzqs.lambda-url.us-east-1.on.aws
      }" \
      --region $REGION
    
    print_status "Environment variables updated successfully"
    
else
    print_error "Lambda function $FUNCTION_NAME does not exist."
    print_error "Please create the Lambda function first using the AWS console or CloudFormation."
    print_error "Required environment variables:"
    print_error "  - VENDOR_UPDATES_TABLE=vendor-updates-table"
    print_error "  - VENDORS_TABLE=ezdrink-vendors"
    print_error "  - SQUARE_APPLICATION_ID=<your-square-app-id>"
    print_error "  - SQUARE_APPLICATION_SECRET=<your-square-app-secret>"
    print_error "  - SQUARE_ENVIRONMENT=production"
    print_error "  - FRONTEND_URL=<your-frontend-url>"
    exit 1
fi

# Wait for function to update
print_status "Waiting for function to update..."
aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION

print_status "Square Lambda function updated successfully!"

# Clean up
print_status "Cleaning up temporary files..."
rm -rf dist

print_status "🎉 Square Lambda deployment completed!"
print_status "Your Square OAuth integration is now ready to use."

echo ""
print_status "Next steps:"
echo "  1. Verify the Lambda function has the correct environment variables"
echo "  2. Test the OAuth flow in your React app"
echo "  3. Check CloudWatch logs for any errors"
echo "  4. Verify the DynamoDB table structure uses email as primary key"

echo ""
print_status "Environment variables configured:"
echo "  - VENDOR_UPDATES_TABLE: vendor-updates-table"
echo "  - VENDORS_TABLE: ezdrink-vendors"
echo "  - SQUARE_APPLICATION_ID: ${SQUARE_APPLICATION_ID:-'Not set'}"
echo "  - SQUARE_APPLICATION_SECRET: ${SQUARE_APPLICATION_SECRET:+'Set'}"
echo "  - SQUARE_ENVIRONMENT: production"
echo "  - FRONTEND_URL: https://4kpajzuyfjzteslcq3sai5us6y0wqzqs.lambda-url.us-east-1.on.aws"
