# 🚀 Square Lambda Deployment Guide

## 📋 **Prerequisites**

### **AWS Setup:**
- AWS CLI installed and configured
- AWS account with Lambda permissions
- IAM role for Lambda execution

### **Square Setup:**
- Square Developer account
- Production Square application created
- OAuth redirect URI configured

### **Local Setup:**
- Node.js 18+ installed
- Git repository cloned
- Environment variables prepared

## 🏗️ **Step-by-Step Deployment**

### **Step 1: Prepare Square Application**

1. **Go to Square Developer Dashboard:**
   ```
   https://developer.squareup.com/apps
   ```

2. **Create/Update Application:**
   - Application Name: `Seamless Client Square Integration`
   - Environment: `Production`
   - OAuth Redirect URI: `https://your-lambda-url/oauth-callback`

3. **Configure OAuth Scopes:**
   - `MERCHANT_PROFILE_READ`
   - `PAYMENTS_READ`
   - `ORDERS_READ`
   - `ORDERS_WRITE`

4. **Copy Credentials:**
   - Application ID
   - Application Secret

### **Step 2: Deploy Lambda Function**

1. **Navigate to lambda-square directory:**
   ```bash
   cd lambda-square
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
   - Function name: `square-integration-handler`

3. **Go to Configuration → Environment variables:**
   ```
   SQUARE_APPLICATION_ID=your_production_app_id
   SQUARE_APPLICATION_SECRET=your_production_app_secret
   SQUARE_ENVIRONMENT=production
   DATABASE_URL=your_production_db_url
   FRONTEND_URL=https://4kpajzuyfjzteslcq3sai5us6y0wqzqs.lambda-url.us-east-1.on.aws
FRONTEND_FRONTEND_URL=https://seamless.us
   ```

4. **Save changes**

### **Step 4: Update Frontend Configuration**

1. **Add environment variable to your frontend:**
   ```bash
   # .env file
   REACT_APP_SQUARE_LAMBDA_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws
   ```

2. **Update Square OAuth redirect URI in Square Dashboard:**
   ```
   https://your-lambda-url/oauth-callback
   ```

### **Step 5: Test Integration**

1. **Test Lambda endpoints:**
   ```bash
   # Test start-oauth
   curl "https://your-lambda-url/start-oauth?email=test@example.com&business=TestBusiness"
   
   # Test oauth-callback (will fail without valid code)
   curl "https://your-lambda-url/oauth-callback?code=test&state=test"
   ```

2. **Test complete OAuth flow:**
   - Go to your app
   - Select Square as POS system
   - Click connect button
   - Complete OAuth flow
   - Verify callback handling

## 🔧 **Configuration Details**

### **Lambda Function Settings:**
```
Function Name: square-integration-handler
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
| `SQUARE_APPLICATION_ID` | Square production app ID | `sq0idb-...` |
| `SQUARE_APPLICATION_SECRET` | Square production app secret | `sq0c-...` |
| `SQUARE_ENVIRONMENT` | Square environment | `production` |
| `DATABASE_URL` | Database connection string | `postgresql://...` |
| `FRONTEND_URL` | Lambda function URL for OAuth | `https://4kpajzuyfjzteslcq3sai5us6y0wqzqs.lambda-url.us-east-1.on.aws` |
| `FRONTEND_FRONTEND_URL` | Your frontend domain | `https://seamless.us` |

## 🧪 **Testing Strategy**

### **Local Testing:**
```bash
cd lambda-square
node test-local.js
```

### **Lambda Testing:**
```bash
# Test with AWS CLI
aws lambda invoke \
  --function-name square-integration-handler \
  --payload '{"httpMethod":"GET","rawPath":"/start-oauth","queryStringParameters":{"email":"test@example.com","business":"Test"}}' \
  response.json
```

### **Integration Testing:**
1. **OAuth Flow Test:**
   - Start OAuth → Get authorization URL
   - Complete OAuth → Handle callback
   - Verify token exchange
   - Check database updates

2. **Error Handling Test:**
   - Invalid OAuth code
   - Missing parameters
   - Network failures
   - Invalid credentials

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors:**
   - Check Function URL CORS settings
   - Verify AllowOrigins includes your domain

2. **OAuth Redirect Failures:**
   - Verify redirect URI in Square dashboard
   - Check Lambda URL is accessible

3. **Token Exchange Failures:**
   - Verify Square credentials
   - Check environment variables
   - Review CloudWatch logs

4. **Database Connection Errors:**
   - Verify DATABASE_URL
   - Check database permissions
   - Test database connectivity

### **Debug Steps:**
1. **Check CloudWatch Logs:**
   ```
   aws logs tail /aws/lambda/square-integration-handler --follow
   ```

2. **Verify Environment Variables:**
   ```
   aws lambda get-function-configuration --function-name square-integration-handler
   ```

3. **Test Function URL:**
   ```
   curl -v "https://your-lambda-url/"
   ```

## 📊 **Monitoring & Maintenance**

### **CloudWatch Metrics:**
- Invocation count
- Error rate
- Duration
- Throttles

### **Log Analysis:**
- OAuth success/failure rates
- API response times
- Error patterns
- User behavior

### **Regular Maintenance:**
- Monitor Square API rate limits
- Rotate credentials quarterly
- Update dependencies monthly
- Review access logs weekly

## 🔒 **Security Considerations**

### **OAuth Security:**
- State parameter validation
- HTTPS only
- Secure token storage
- Input sanitization

### **AWS Security:**
- Least privilege IAM roles
- VPC isolation (if needed)
- CloudTrail logging
- Regular security reviews

### **Data Security:**
- Encrypt sensitive data
- Secure database connections
- Token encryption at rest
- Access logging

## 📚 **Additional Resources**

### **Documentation:**
- [Square OAuth Guide](https://developer.squareup.com/docs/oauth-api/overview)
- [AWS Lambda Guide](https://docs.aws.amazon.com/lambda/)
- [React Router](https://reactrouter.com/)

### **Support:**
- Square Developer Support
- AWS Support
- Internal development team

---

## 🎯 **Success Checklist**

- [ ] Square application configured with production credentials
- [ ] Lambda function deployed successfully
- [ ] Function URL accessible and CORS configured
- [ ] Environment variables set correctly
- [ ] Frontend updated with Lambda URL
- [ ] OAuth flow tested end-to-end
- [ ] Database integration verified
- [ ] Error handling tested
- [ ] Monitoring configured
- [ ] Documentation updated

**Ready for production! 🚀**
