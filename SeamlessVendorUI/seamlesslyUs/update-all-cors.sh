#!/bin/bash

# Update CORS for all Lambda functions to allow seamless domains
# This script ensures all Lambda Function URLs allow any seamless domain

echo "🔄 Updating CORS for all Lambda functions..."

# Function to update CORS for a Lambda function
update_lambda_cors() {
    local function_name=$1
    local region=${2:-us-east-1}
    
    echo "📝 Updating CORS for: $function_name"
    
    # Update Function URL CORS configuration
    aws lambda update-function-url-config \
        --function-name "$function_name" \
        --region "$region" \
        --cors '{
            "AllowCredentials": false,
            "AllowHeaders": ["*"],
            "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "AllowOrigins": ["*"],
            "MaxAge": 86400
        }' 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ CORS updated for: $function_name"
    else
        echo "❌ Failed to update CORS for: $function_name"
    fi
}

# Update CORS for all known Lambda functions
echo "🔄 Updating Lightspeed Lambda..."
update_lambda_cors "seamless-lightspeed-integration"

echo "🔄 Updating Square Lambda..."
update_lambda_cors "seamless-square-integration"

echo "🔄 Updating Vendor Management Lambda..."
update_lambda_cors "seamless-vendor-management"

echo "🔄 Updating Klaviyo Lambda..."
update_lambda_cors "seamless-directsignup-klaviyo"

echo "🔄 Updating Customer Bridge Lambda..."
update_lambda_cors "seamless-customer-bridge"

echo "🔄 Updating Bartender Notification Lambda..."
update_lambda_cors "seamless-bartender-notification"

echo "🔄 Updating Payment Processing Lambda..."
update_lambda_cors "seamless-payment-processor"

echo "🔄 Updating Order Management Lambda..."
update_lambda_cors "seamless-order-manager"

echo "🔄 Updating Analytics Lambda..."
update_lambda_cors "seamless-analytics"

echo "✅ All Lambda CORS configurations updated!"
echo "🌐 All seamless domains should now work properly"
echo "⏱️  Changes may take 5-10 minutes to propagate"
