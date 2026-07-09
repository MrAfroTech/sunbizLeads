# 🍀 Clover OAuth Setup Guide

## Overview
This guide will help you set up the Clover OAuth callback endpoint that's currently failing with an internal service error.

## 🔧 Current Issue
The OAuth callback URL `https://tdp2ycqujf.execute-api.us-east-1.amazonaws.com/prod/clover/oauth/callback` is returning an internal service error because:
1. The AWS Lambda function is not properly configured, OR
2. We need to switch to using Vercel API routes instead

## 🚀 Solution: Use Vercel API Routes

### Step 1: Deploy to Vercel
```bash
cd SeamlessVendorUI
vercel --prod
```

### Step 2: Set Environment Variables
After deployment, set these environment variables in your Vercel dashboard:

```bash
# Required for OAuth to work
CLOVER_CLIENT_ID=8JBVMZPB4R54C
CLOVER_CLIENT_SECRET=your_clover_client_secret_here

# AWS Configuration
AWS_REGION=us-east-1
DYNAMODB_CLOVER_TABLE=seamless-clover-tokens

# Frontend URL
CLOVER_FRONTEND_URL=https://seamlessly.us
```

### Step 3: Update OAuth Redirect URI
Once deployed, update your Clover app configuration to use the new Vercel endpoint:

**New Redirect URI:** `https://your-vercel-domain.vercel.app/api/clover/oauth/callback`

## 🔍 Testing the Integration

### Test 1: Check if API is working
```bash
curl https://your-vercel-domain.vercel.app/api/clover/oauth/test
```

### Test 2: Test OAuth callback
Visit the OAuth callback URL with test parameters:
```
https://your-vercel-domain.vercel.app/api/clover/oauth/callback?code=test&merchant_id=VH42MXF75NHJ1&employee_id=2N27GZZW4SDNY&client_id=8JBVMZPB4R54C
```

## 🐛 Troubleshooting

### If you still get internal service errors:

1. **Check Vercel logs** in your dashboard
2. **Verify environment variables** are set correctly
3. **Check AWS credentials** have proper permissions
4. **Verify DynamoDB table** exists and is accessible

### Common Issues:

- **Missing environment variables**: CLOVER_CLIENT_ID or CLOVER_CLIENT_SECRET not set
- **AWS permissions**: Lambda function doesn't have access to DynamoDB
- **Invalid redirect URI**: Clover app still pointing to old AWS endpoint

## 🔄 Alternative: Fix AWS Lambda

If you prefer to keep using AWS Lambda:

1. Check the Lambda function logs in CloudWatch
2. Verify the function has proper IAM permissions
3. Ensure environment variables are set in Lambda configuration
4. Test the function directly with the test payload

## 📝 Next Steps

1. Deploy to Vercel
2. Set environment variables
3. Update Clover app redirect URI
4. Test the OAuth flow
5. Monitor logs for any errors

## 🆘 Support

If you continue to have issues:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Test with the `/api/clover/oauth/test` endpoint
4. Check AWS CloudWatch logs if using Lambda
