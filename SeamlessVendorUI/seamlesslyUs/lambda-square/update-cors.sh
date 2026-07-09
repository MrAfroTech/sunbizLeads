#!/bin/bash

# Update CORS Configuration for Square Lambda Function URL
# This script updates the CORS settings to allow seamlessly.us

set -e

echo "🔧 Updating CORS configuration for Square Lambda..."

# Configuration
FUNCTION_NAME="square-integration-handler"
REGION="us-east-1"

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

print_status "AWS credentials verified"

# Check if function exists
FUNCTION_EXISTS=$(aws lambda list-functions --region $REGION --query "Functions[?FunctionName=='$FUNCTION_NAME'].FunctionName" --output text)

if [ "$FUNCTION_EXISTS" != "$FUNCTION_NAME" ]; then
    print_error "Function $FUNCTION_NAME does not exist. Please deploy it first."
    exit 1
fi

print_status "Function $FUNCTION_NAME found"

# Get function URL
FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $REGION --query 'FunctionUrlConfig.FunctionUrl' --output text)

if [ "$FUNCTION_URL" = "None" ] || [ -z "$FUNCTION_URL" ]; then
    print_error "Function URL does not exist. Please create it first."
    exit 1
fi

print_status "Function URL: $FUNCTION_URL"

# Update CORS configuration
print_status "Updating CORS configuration..."

aws lambda update-function-url-config \
    --function-name $FUNCTION_NAME \
    --cors '{
        "AllowCredentials": false,
        "AllowHeaders": ["*"],
        "AllowMethods": ["GET", "POST", "OPTIONS"],
        "AllowOrigins": ["*"],
        "MaxAge": 86400
    }' \
    --region $REGION

if [ $? -eq 0 ]; then
    print_status "✅ CORS configuration updated successfully!"
    print_status "Allowed origins: * (all domains)"
    print_status "Allowed methods: GET, POST, OPTIONS"
    print_status "Function URL: $FUNCTION_URL"
else
    print_error "Failed to update CORS configuration"
    exit 1
fi

print_status "🎉 CORS update completed!"
print_warning "Note: It may take a few minutes for the changes to propagate."
