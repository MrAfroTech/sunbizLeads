#!/bin/bash

# Square Lambda Deployment Script
# This script packages and deploys the Square integration lambda to AWS

set -e

echo "🚀 Starting Square Lambda deployment..."

# Configuration
FUNCTION_NAME="square-integration-handler"
RUNTIME="nodejs18.x"
HANDLER="square-lambda-handler.handler"
MEMORY_SIZE="256"
TIMEOUT="30"
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

# Clean up previous builds
print_status "Cleaning up previous builds..."
rm -f square-lambda.zip
rm -rf node_modules

# Install dependencies (if any)
if [ -f "package.json" ]; then
    print_status "Installing dependencies..."
    npm install --production
fi

# Create deployment package
print_status "Creating deployment package..."
zip -r square-lambda.zip . -x "*.zip" "node_modules/*" ".git/*" "deploy.sh" "README.md"

if [ ! -f "square-lambda.zip" ]; then
    print_error "Failed to create deployment package"
    exit 1
fi

PACKAGE_SIZE=$(du -h square-lambda.zip | cut -f1)
print_status "Package created: square-lambda.zip ($PACKAGE_SIZE)"

# Check if function exists
FUNCTION_EXISTS=$(aws lambda list-functions --region $REGION --query "Functions[?FunctionName=='$FUNCTION_NAME'].FunctionName" --output text)

if [ "$FUNCTION_EXISTS" = "$FUNCTION_NAME" ]; then
    print_status "Updating existing function: $FUNCTION_NAME"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://square-lambda.zip \
        --region $REGION
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --region $REGION
        
    print_status "Function updated successfully"
    
else
    print_status "Creating new function: $FUNCTION_NAME"
    
    # Create function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --zip-file fileb://square-lambda.zip \
        --role "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/lambda-execution-role" \
        --region $REGION
        
    print_status "Function created successfully"
fi

# Get function ARN
FUNCTION_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)

print_status "Function ARN: $FUNCTION_ARN"

# Create or update function URL
print_status "Setting up function URL..."

# Check if function URL exists
URL_EXISTS=$(aws lambda list-function-url-configs --function-name $FUNCTION_NAME --region $REGION --query 'FunctionUrlConfigs[0].FunctionUrl' --output text)

if [ "$URL_EXISTS" = "None" ] || [ -z "$URL_EXISTS" ]; then
    print_status "Creating function URL..."
    
    aws lambda create-function-url-config \
        --function-name $FUNCTION_NAME \
        --auth-type NONE \
        --cors '{
            "AllowCredentials": false,
            "AllowHeaders": ["*"],
            "AllowMethods": ["GET", "POST", "OPTIONS"],
            "AllowOrigins": ["*"],
            "MaxAge": 86400
        }' \
        --region $REGION
        
    print_status "Function URL created"
else
    print_status "Function URL already exists: $URL_EXISTS"
fi

# Get the function URL
FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $REGION --query 'FunctionUrlConfig.FunctionUrl' --output text)

print_status "Function URL: $FUNCTION_URL"

# Add tags
print_status "Adding tags to function..."
aws lambda tag-resource \
    --resource $FUNCTION_ARN \
    --tags '{"Environment":"production","Service":"square-integration","Version":"1.0.0"}' \
    --region $REGION

# Set environment variables (you'll need to update these with your actual values)
print_warning "Remember to set environment variables in the AWS Console:"
echo "  SQUARE_APPLICATION_ID=your_production_app_id"
echo "  SQUARE_APPLICATION_SECRET=your_production_app_secret"
echo "  SQUARE_ENVIRONMENT=production"
echo "  DATABASE_URL=your_production_db_url"
echo "  FRONTEND_URL=https://4kpajzuyfjzteslcq3sai5us6y0wqzqs.lambda-url.us-east-1.on.aws"
echo "  FRONTEND_FRONTEND_URL=https://seamless.us"

# Test the function
print_status "Testing function..."
TEST_RESPONSE=$(aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"httpMethod":"GET","rawPath":"/","queryStringParameters":{}}' \
    --region $REGION \
    --cli-binary-format raw-in-base64-out \
    response.json)

if [ $? -eq 0 ]; then
    print_status "Function test successful"
    echo "Response: $(cat response.json)"
    rm -f response.json
else
    print_error "Function test failed"
    exit 1
fi

# Cleanup
print_status "Cleaning up..."
rm -f square-lambda.zip

print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Function Name: $FUNCTION_NAME"
echo "  Function ARN: $FUNCTION_ARN"
echo "  Function URL: $FUNCTION_URL"
echo "  Runtime: $RUNTIME"
echo "  Memory: ${MEMORY_SIZE}MB"
echo "  Timeout: ${TIMEOUT}s"
echo ""
echo "🔧 Next Steps:"
echo "  1. Set environment variables in AWS Console"
echo "  2. Update your frontend with the function URL"
echo "  3. Test the OAuth flow end-to-end"
echo "  4. Monitor CloudWatch logs for any issues"
echo ""
echo "📚 Documentation: See README.md for detailed setup instructions"
