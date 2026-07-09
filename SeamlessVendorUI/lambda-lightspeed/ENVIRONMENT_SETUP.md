# 🔧 Lightspeed Environment Setup Guide

## ✅ **Credentials Configured**

Your Lightspeed integration has been pre-configured with the following credentials:

### **Lightspeed OAuth Credentials:**
```
Client ID: lXLqYMFqq1Xr4T5OZG7a6xeheHFpYMR8
Client Secret: uBi21HKNCK9fyIGP1Bkk4T0ArxmsEvj8
Environment: production
```

## 🚀 **Deployment Steps**

### **1. Deploy Lambda Function**
```bash
cd SeamlessVendorUI/lambda-lightspeed
chmod +x deploy.sh
./deploy.sh
```

### **2. Set Environment Variables in AWS Lambda Console**

After deployment, go to your Lambda function and set these environment variables:

| Variable | Value |
|----------|-------|
| `LIGHTSPEED_CLIENT_ID` | `lXLqYMFqq1Xr4T5OZG7a6xeheHFpYMR8` |
| `LIGHTSPEED_CLIENT_SECRET` | `uBi21HKNCK9fyIGP1Bkk4T0ArxmsEvj8` |
| `LIGHTSPEED_ENVIRONMENT` | `production` |
| `DATABASE_URL` | `your_production_db_url` |
| `FRONTEND_URL` | `https://your-lambda-url.lambda-url.us-east-1.on.aws` |
| `FRONTEND_FRONTEND_URL` | `https://seamless.us` |

### **3. Configure Frontend Environment**

Create or update your `.env` file in the frontend directory:

```bash
# SeamlessVendorUI/.env
REACT_APP_LIGHTSPEED_LAMBDA_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws
```

### **4. Update Lightspeed OAuth Redirect URI**

In your Lightspeed Developer Dashboard, set the OAuth redirect URI to:
```
https://your-lambda-url/oauth-callback
```

## 🔍 **Verification**

### **Test Lambda Endpoints:**
```bash
# Test OAuth start
curl "https://your-lambda-url/start-oauth?email=test@example.com&business=TestBusiness&customer_id=123"

# Test connection
curl "https://your-lambda-url/test-connection?merchant_id=123&access_token=test"
```

### **Check Environment Variables:**
```bash
# In AWS Lambda Console
# Go to Configuration → Environment variables
# Verify all variables are set correctly
```

## 🚨 **Important Notes**

1. **Credentials are pre-configured** in the lambda handler as fallbacks
2. **Environment variables take precedence** over hardcoded values
3. **Update the OAuth redirect URI** in Lightspeed dashboard after deployment
4. **Test the complete flow** before going live

## 📞 **Support**

If you encounter any issues:
1. Check CloudWatch logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure OAuth redirect URI matches exactly
4. Contact support at support@seamless.us

---

**🎯 Your Lightspeed integration is now ready for deployment with the provided credentials!**
