# Square Integration Lambda Function

## 🎯 **Purpose**
This Lambda function handles Square OAuth flow and API integration for production deployment. It's designed to be deployed directly to AWS Lambda with Function URL enabled.

## 🏗️ **Architecture**

### **Endpoints:**
- `GET /start-oauth` - Initiates Square OAuth flow
- `GET /oauth-callback` - Handles OAuth callback from Square
- `POST /test-connection` - Tests Square API connection

### **OAuth Flow:**
1. User clicks Square button → calls `/start-oauth`
2. Lambda generates authorization URL → redirects to Square
3. User authorizes → Square redirects to `/oauth-callback`
4. Lambda exchanges code for tokens → stores credentials
5. User redirected to success page

## 🚀 **Deployment**

### **1. Create Lambda Function**
```bash
# Function name: square-integration-handler
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
SQUARE_APPLICATION_ID=your_production_app_id
SQUARE_APPLICATION_SECRET=your_production_app_secret
SQUARE_ENVIRONMENT=production
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

### **Square Application Setup:**
1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Create new application or use existing
3. Set OAuth redirect URI: `https://your-lambda-url/oauth-callback`
4. Copy Application ID and Secret

### **Required Scopes:**
- `MERCHANT_PROFILE_READ` - Read business information
- `PAYMENTS_READ` - Read payment data
- `ORDERS_READ` - Read order data
- `ORDERS_WRITE` - Create/update orders

## 📊 **Database Schema**

### **Add to vendor_integrations table:**
```sql
ALTER TABLE vendor_integrations ADD COLUMN IF NOT EXISTS square_access_token TEXT;
ALTER TABLE vendor_integrations ADD COLUMN IF NOT EXISTS square_refresh_token TEXT;
ALTER TABLE vendor_integrations ADD COLUMN IF NOT EXISTS square_merchant_id TEXT;
ALTER TABLE vendor_integrations ADD COLUMN IF NOT EXISTS square_application_id TEXT;
ALTER TABLE vendor_integrations ADD COLUMN IF NOT EXISTS square_integration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

## 🧪 **Testing**

### **Local Testing:**
```bash
# Test OAuth start
curl "https://your-lambda-url/start-oauth?email=test@example.com&business=TestBusiness"

# Test connection (requires valid tokens)
curl -X POST "https://your-lambda-url/test-connection" \
  -H "Content-Type: application/json" \
  -d '{"access_token":"your_token","merchant_id":"your_merchant_id"}'
```

### **Production Testing:**
1. Deploy to production Lambda
2. Test complete OAuth flow end-to-end
3. Verify database updates
4. Test error scenarios
5. Monitor CloudWatch logs

## 🚨 **Security Considerations**

### **OAuth Security:**
- State parameter validation (implemented)
- HTTPS only for all endpoints
- Secure token storage in database
- Input sanitization and validation

### **Environment Security:**
- Never commit secrets to code
- Use AWS Secrets Manager for sensitive data
- Rotate Square credentials regularly
- Monitor access logs

## 📝 **Logging**

### **CloudWatch Logs:**
- OAuth flow events
- API call results
- Error details with stack traces
- Performance metrics

### **Log Format:**
```
=== SQUARE LAMBDA HANDLER ===
Event: {...}
Environment: production
Application ID: Configured
OAuth started for email: user@example.com, business: BusinessName, state: abc123...
```

## 🔄 **Token Management**

### **Access Token:**
- Short-lived (typically 30 days)
- Used for API calls
- Stored securely in database

### **Refresh Token:**
- Long-lived (typically 1 year)
- Used to get new access tokens
- Stored securely in database

### **Token Refresh Logic:**
```javascript
// Implement token refresh when access token expires
if (tokenExpired) {
  const newToken = await refreshAccessToken(refreshToken);
  await updateDatabaseWithNewToken(newToken);
}
```

## 🚀 **Performance Optimization**

### **Lambda Configuration:**
- Memory: 256 MB (adequate for OAuth operations)
- Timeout: 30 seconds (covers API call delays)
- Concurrency: Default (handles multiple OAuth flows)

### **API Optimization:**
- Efficient HTTPS request handling
- Minimal external dependencies
- Proper error handling and timeouts

## 📞 **Support & Troubleshooting**

### **Common Issues:**
1. **CORS errors** - Check Function URL CORS settings
2. **OAuth redirect failures** - Verify redirect URI in Square dashboard
3. **Token exchange failures** - Check application credentials
4. **Database connection errors** - Verify DATABASE_URL

### **Debug Steps:**
1. Check CloudWatch logs for detailed error messages
2. Verify environment variables are set correctly
3. Test OAuth flow step by step
4. Validate Square application configuration

---

**Ready for production deployment! Test thoroughly before going live.**
