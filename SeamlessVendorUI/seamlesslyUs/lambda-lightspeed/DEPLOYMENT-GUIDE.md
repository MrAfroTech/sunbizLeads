# 🚀 Lightspeed Lambda Deployment Guide

## 📋 **Prerequisites**

### **AWS Setup:**
- AWS CLI installed and configured
- AWS account with Lambda permissions
- IAM role for Lambda execution

### **Lightspeed Setup:**
- Lightspeed Developer account
- Production Lightspeed application created
- OAuth redirect URI configured

### **Local Setup:**
- Node.js 18+ installed
- Git repository cloned
- Environment variables prepared

## 🏗️ **Step-by-Step Deployment**

### **Step 1: Prepare Lightspeed Application**

1. **Go to Lightspeed Developer Dashboard:**
   ```
   https://developers.lightspeedapp.com/
   ```

2. **Create/Update Application:**
   - Application Name: `Seamless Client Lightspeed Integration`
   - Environment: `Production`
   - OAuth Redirect URI: `https://your-lambda-url/oauth-callback`

3. **Configure OAuth Scopes:**
   - `employee:all` (for full access to merchant data)

4. **Copy Credentials:**
   - Client ID
   - Client Secret

### **Step 2: Deploy Lambda Function**

1. **Navigate to lambda-lightspeed directory:**
   ```bash
   cd lambda-lightspeed
   ```

2. **Make deploy script executable:**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run deployment:**
   ```bash
   ./deploy.sh
   ```

4. **Note the Function URL** from the output

### **Step 3: Configure Environment Variables**

1. **Go to AWS Lambda Console:**
   ```
   https://console.aws.amazon.com/lambda/
   ```

2. **Select your function:**
   - Function name: `lightspeed-integration-handler`

3. **Go to Configuration → Environment variables:**
   ```
   LIGHTSPEED_CLIENT_ID=your_production_client_id
   LIGHTSPEED_CLIENT_SECRET=your_production_client_secret
   LIGHTSPEED_ENVIRONMENT=production
   DATABASE_URL=your_production_db_url
   FRONTEND_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws
   FRONTEND_FRONTEND_URL=https://seamless.us
   ```

4. **Save changes**

### **Step 4: Update Frontend Configuration**

1. **Add environment variable to your frontend:**
   ```bash
   # .env file
   REACT_APP_LIGHTSPEED_LAMBDA_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws
   ```

2. **Update Lightspeed OAuth redirect URI in Lightspeed Dashboard:**
   ```
   https://your-lambda-url/oauth-callback
   ```

### **Step 5: Test Integration**

1. **Test Lambda endpoints:**
   ```bash
   # Test start-oauth
   curl "https://your-lambda-url/start-oauth?email=test@example.com&business=TestBusiness&customer_id=123"
   
   # Test oauth-callback (will fail without valid code)
   curl "https://your-lambda-url/oauth-callback?code=test&state=test"
   ```

2. **Test complete OAuth flow:**
   - Go to your app
   - Select Lightspeed as POS system
   - Click connect button
   - Complete OAuth flow
   - Verify callback handling

## 🔧 **Configuration Details**

### **Lambda Function Settings:**
```
Function Name: lightspeed-integration-handler
Runtime: Node.js 18.x
Memory: 256 MB
Timeout: 30 seconds
Architecture: x86_64
```

### **Function URL CORS:**
```json
{
  "AllowCredentials": false,
  "AllowHeaders": ["*"],
  "AllowMethods": ["GET", "POST", "OPTIONS"],
  "AllowOrigins": ["*"],
  "MaxAge": 86400
}
```

### **Environment Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| `LIGHTSPEED_CLIENT_ID` | Lightspeed production client ID | `lXLqYMFqq1Xr4T5OZG7a6xeheHFpYMR8` |
| `LIGHTSPEED_CLIENT_SECRET` | Lightspeed production client secret | `uBi21HKNCK9fyIGP1Bkk4T0ArxmsEvj8` |
| `LIGHTSPEED_ENVIRONMENT` | Lightspeed environment | `production` |
| `DATABASE_URL` | Database connection string | `postgresql://...` |
| `FRONTEND_URL` | Lambda function URL for OAuth | `https://your-lambda-url.lambda-url.us-east-1.on.aws` |
| `FRONTEND_FRONTEND_URL` | Your frontend domain | `https://seamless.us` |

## 🧪 **Testing Strategy**

### **Local Testing:**
```bash
cd lambda-lightspeed
node test-local.js
```

### **Lambda Testing:**
```bash
# Test with AWS CLI
aws lambda invoke \
  --function-name lightspeed-integration-handler \
  --payload '{"httpMethod":"GET","rawPath":"/start-oauth","queryStringParameters":{"email":"test@example.com","business":"Test","customer_id":"123"}}' \
  --region us-east-1 \
  response.json
```

## 🔐 **Lightspeed OAuth Flow**

### **OAuth Endpoints:**
- **Authorization:** `https://cloud.lightspeedapp.com/oauth/authorize.php`
- **Token Exchange:** `https://cloud.lightspeedapp.com/oauth/access_token.php`
- **API Base:** `https://cloud.lightspeedapp.com/api/`

### **Required Scopes:**
- `employee:all` - Full access to merchant data

### **Token Management:**
- Access tokens expire after 30 days
- Refresh tokens are provided for renewal
- Automatic token refresh implemented

## 📊 **DynamoDB Tables**

### **Tables Created:**
1. **`ezdrink-vendors`** - Stores vendor connection data
2. **`ezdrink-websocket-connections`** - Manages real-time connections

### **Key Schema:**
- **Partition Key:** `customer_id` (from vendor signup)
- **GSI:** `merchantId-index` for Lightspeed merchant lookups
- **GSI:** `status-index` for vendor status management

## 🚨 **Troubleshooting**

### **Common Issues:**
1. **OAuth redirect URI mismatch** - Ensure exact match in Lightspeed dashboard
2. **Invalid client credentials** - Verify client ID and secret
3. **CORS errors** - Check Lambda function URL CORS configuration
4. **DynamoDB permissions** - Ensure Lambda has proper IAM roles

### **Debug Steps:**
1. Check CloudWatch logs for detailed error messages
2. Verify environment variables are set correctly
3. Test OAuth endpoints individually
4. Validate DynamoDB table permissions

## 📈 **Monitoring & Maintenance**

### **CloudWatch Metrics:**
- Function invocation count
- Error rate
- Duration
- Throttles

### **Log Analysis:**
- OAuth flow success/failure rates
- Token refresh patterns
- API call performance

### **Regular Maintenance:**
- Monitor token expiry patterns
- Review error logs monthly
- Update client credentials as needed
- Scale DynamoDB capacity based on usage
