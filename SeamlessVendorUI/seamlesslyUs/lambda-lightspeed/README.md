# Lightspeed Integration Lambda Function

## 🎯 **Purpose**
This Lambda function handles Lightspeed OAuth flow and API integration for production deployment. It's designed to be deployed directly to AWS Lambda with Function URL enabled.

## 🏗️ **Architecture**

### **Endpoints:**
- `GET /start-oauth` - Initiates Lightspeed OAuth flow
- `GET /oauth-callback` - Handles OAuth callback from Lightspeed
- `POST /test-connection` - Tests Lightspeed API connection

### **OAuth Flow:**
1. User clicks Lightspeed button → calls `/start-oauth`
2. Lambda generates authorization URL → redirects to Lightspeed
3. User authorizes → Lightspeed redirects to `/oauth-callback`
4. Lambda exchanges code for tokens → stores credentials
5. User redirected to success page

## 🚀 **Deployment**

### **1. Create Lambda Function**
```bash
# Function name: lightspeed-integration-handler
# Runtime: Node.js 18.x
# Architecture: x86_64
# Memory: 256 MB (sufficient for OAuth operations)
# Timeout: 30 seconds
```

### **2. Enable Function URL**
- Authentication type: NONE
- Configure CORS:
```json
{
  "AllowCredentials": false,
  "AllowHeaders": ["*"],
  "AllowMethods": ["GET", "POST", "OPTIONS"],
  "AllowOrigins": ["*"],
  "MaxAge": 86400
}
```

### **3. Environment Variables**
```
LIGHTSPEED_CLIENT_ID=lXLqYMFqq1Xr4T5OZG7a6xeheHFpYMR8
LIGHTSPEED_CLIENT_SECRET=uBi21HKNCK9fyIGP1Bkk4T0ArxmsEvj8
LIGHTSPEED_ENVIRONMENT=production
DATABASE_URL=your_production_db_url
FRONTEND_URL=https://your-app-domain.com
```

### **4. IAM Permissions**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## 🔧 **Configuration**

### **Lightspeed Application Setup:**
1. Go to [Lightspeed Developer Dashboard](https://developers.lightspeedapp.com/)
2. Create new application or use existing
3. Set OAuth redirect URI: `https://your-lambda-url/oauth-callback`
4. Copy Client ID and Secret

### **Required Scopes:**
- `employee:all` - Full access to merchant data

### **OAuth Endpoints:**
- **Authorization:** `https://cloud.lightspeedapp.com/oauth/authorize.php`
- **Token Exchange:** `https://cloud.lightspeedapp.com/oauth/access_token.php`
- **API Base:** `https://cloud.lightspeedapp.com/api/`

## 📊 **Data Storage**

### **DynamoDB Tables:**
- **`ezdrink-vendors`** - Stores vendor connection data
- **`ezdrink-websocket-connections`** - Manages real-time connections

### **Vendor Data Structure:**
```json
{
  "customer_id": "string",
  "merchantId": "string",
  "posSystem": "lightspeed",
  "accessToken": "string",
  "refreshToken": "string",
  "email": "string",
  "businessName": "string",
  "status": "active",
  "connectedAt": "ISO date",
  "lastUpdated": "ISO date",
  "tokenExpiry": "ISO date"
}
```

## 🔄 **Token Management**

### **Token Lifecycle:**
- Access tokens expire after 30 days
- Refresh tokens are provided for renewal
- Automatic token refresh implemented
- Refresh threshold: 7 days before expiry

### **Token Refresh:**
```javascript
// Automatic refresh when needed
const refreshedTokens = await refreshLightspeedToken(refreshToken);
```

## 🧪 **Testing**

### **Local Testing:**
```bash
cd lambda-lightspeed
node test-local.js
```

### **Lambda Testing:**
```bash
# Test OAuth start
curl "https://your-lambda-url/start-oauth?email=test@example.com&business=TestBusiness&customer_id=123"

# Test connection
curl "https://your-lambda-url/test-connection?merchant_id=123&access_token=test"
```

## 📈 **Monitoring**

### **CloudWatch Metrics:**
- Function invocation count
- Error rate
- Duration
- Throttles

### **Log Analysis:**
- OAuth flow success/failure rates
- Token refresh patterns
- API call performance

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

## 🔗 **Integration Points**

### **Frontend Integration:**
- Vendor registration form
- POS system selection
- OAuth flow initiation
- Success page handling

### **Backend Integration:**
- DynamoDB data storage
- Vendor management system
- WebSocket connections
- Real-time updates

## 📚 **API Reference**

### **Start OAuth:**
```
GET /start-oauth?email={email}&business={business}&customer_id={customer_id}
```

### **OAuth Callback:**
```
GET /oauth-callback?code={code}&state={state}
```

### **Test Connection:**
```
GET /test-connection?merchant_id={merchant_id}&access_token={access_token}
```

## 🚀 **Quick Start**

1. **Deploy Lambda:**
   ```bash
   cd lambda-lightspeed
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Configure Environment:**
   - Set environment variables in AWS Console
   - Update OAuth redirect URI in Lightspeed dashboard

3. **Test Integration:**
   - Test OAuth flow end-to-end
   - Verify data storage in DynamoDB

4. **Monitor & Maintain:**
   - Check CloudWatch logs regularly
   - Monitor token expiry patterns
   - Scale resources as needed
