# Vendor Integration Deployment Guide

## Overview

This guide explains how to deploy the complete vendor integration workflow that connects:
1. **DirectSignup Form** → **DynamoDB Storage** → **Klaviyo List Addition**
2. **Square OAuth Integration** → **DynamoDB Update** → **Success Page with Complete Data**

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ DirectSignup.js │───▶│ /api/vendor-    │───▶│ DynamoDB       │
│ (Form)          │    │ registration     │    │ (ezdrink-      │
└─────────────────┘    └──────────────────┘    │ vendors table) │
                                                └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ Klaviyo         │
                                                │ (Vendor List)   │
                                                └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ VendorIntegration│
                                                │ (Square OAuth)  │
                                                └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ SquareSuccess   │
                                                │ (Complete Data) │
                                                └─────────────────┘
```

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- Vercel account (for API routes)
- Klaviyo account with API key
- Square Developer account

## Step 1: Set Up DynamoDB Tables

### 1.1 Create Tables

Navigate to the `lambda-square` directory and run:

```bash
cd lambda-square
node create-tables.js
```

This creates:
- `ezdrink-vendors` table with registration ID as primary key
- `ezdrink-websocket-connections` table for real-time updates

### 1.2 Verify Table Structure

The `ezdrink-vendors` table includes:
- `registrationId` (Primary Key)
- `businessName`, `email`, `phone`, `posSystem`, `selectedPlan`
- `vendorType`, `cuisineType`
- `status` (pending_integration → active)
- `squareConnected`, `merchantId`, `squareAccessToken`, etc.

## Step 2: Deploy Lambda Functions

### 2.1 Deploy Vendor Registration Handler

```bash
cd lambda-square
chmod +x deploy-vendor-registration.sh
./deploy-vendor-registration.sh
```

**Important**: Update the `ROLE_ARN` in the script with your actual IAM role ARN.

### 2.2 Deploy Vendor Management Handler

```bash
cd lambda-square
chmod +x deploy.sh
./deploy.sh
```

## Step 3: Configure Environment Variables

### 3.1 Frontend (.env.local)

```bash
# Klaviyo Configuration
REACT_APP_KLAVIYO_COMPANY_ID=your_company_id
REACT_APP_KLAVIYO_VENDOR_LIST_ID=your_vendor_list_id

# AWS Lambda URLs (from deployment)
REACT_APP_VENDOR_REGISTRATION_LAMBDA_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws
REACT_APP_VENDOR_LAMBDA_URL=https://your-vendor-management-url.lambda-url.us-east-1.on.aws

# Square Configuration
REACT_APP_SQUARE_LAMBDA_URL=https://your-square-lambda-url.lambda-url.us-east-1.on.aws
```

### 3.2 Backend API (.env)

```bash
# Klaviyo API
KLAVIYO_PRIVATE_API_KEY=your_private_api_key
KLAVIYO_VENDOR_LIST_ID=your_vendor_list_id

# AWS Lambda URLs
VENDOR_REGISTRATION_LAMBDA_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws
```

## Step 4: Deploy Vercel API Routes

### 4.1 Deploy to Vercel

```bash
vercel --prod
```

This deploys:
- `/api/vendor-registration` - Integrated vendor registration
- `/api/klaviyo-add-client` - Klaviyo integration

## Step 5: Test the Complete Flow

### 5.1 Test Vendor Registration

1. Fill out the DirectSignup form
2. Verify data is stored in DynamoDB
3. Verify vendor is added to Klaviyo list
4. Check registration ID is generated

### 5.2 Test Square Integration

1. Navigate to VendorIntegration page
2. Start Square OAuth flow
3. Complete OAuth process
4. Verify SquareSuccess page shows complete data

## Step 6: Monitor and Debug

### 6.1 Check DynamoDB

```bash
aws dynamodb scan --table-name ezdrink-vendors --region us-east-1
```

### 6.2 Check Lambda Logs

```bash
aws logs tail /aws/lambda/vendor-registration-handler --follow
aws logs tail /aws/lambda/vendor-management-handler --follow
```

### 6.3 Check Vercel Function Logs

Visit your Vercel dashboard and check function logs for any errors.

## Troubleshooting

### Common Issues

1. **DynamoDB Permission Errors**
   - Ensure Lambda execution role has proper DynamoDB permissions
   - Check IAM policies attached to the role

2. **Klaviyo Integration Failures**
   - Verify `KLAVIYO_PRIVATE_API_KEY` is set correctly
   - Check if the vendor list ID exists in Klaviyo
   - Ensure API key has proper permissions

3. **Lambda Function URL Issues**
   - Verify Lambda functions are deployed successfully
   - Check function URLs are accessible
   - Ensure CORS is properly configured

4. **Environment Variable Issues**
   - Double-check all environment variables are set
   - Restart development server after changes
   - Verify variable names match exactly

### Debug Steps

1. Check browser console for frontend errors
2. Check Network tab for API call failures
3. Verify Lambda function responses
4. Check DynamoDB table contents
5. Verify Klaviyo list additions

## Security Considerations

1. **API Keys**: Store sensitive keys in environment variables
2. **CORS**: Configure CORS properly for production domains
3. **DynamoDB**: Use IAM roles with minimal required permissions
4. **Lambda**: Set appropriate timeout and memory limits

## Performance Optimization

1. **DynamoDB**: Use appropriate read/write capacity
2. **Lambda**: Optimize cold start times
3. **API Routes**: Implement proper error handling and timeouts
4. **Frontend**: Add loading states and error boundaries

## Monitoring and Analytics

1. **AWS CloudWatch**: Monitor Lambda function metrics
2. **Vercel Analytics**: Track API route performance
3. **Klaviyo Analytics**: Monitor vendor engagement
4. **Custom Metrics**: Track conversion rates and integration success

## Support and Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Backup Strategy**: Implement DynamoDB backup policies
3. **Error Tracking**: Set up error monitoring and alerting
4. **Documentation**: Keep deployment guides updated

## Next Steps

After successful deployment:

1. **Customize**: Adapt the workflow for your specific needs
2. **Scale**: Implement additional POS system integrations
3. **Enhance**: Add more sophisticated vendor management features
4. **Integrate**: Connect with other business systems

---

**Need Help?** Check the troubleshooting section or review the Lambda function logs for detailed error information.
