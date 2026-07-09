# 🚨 CORS Fix for Lightspeed Lambda Function

## **Problem Identified**

Your Lambda function is rejecting requests from `seamlessly.us` due to CORS configuration issues. The error shows:

```
Access to fetch at 'https://zcrzj2dqwzgem4slcqrjuguelveq0bwvbv.lambda-url.us-east-1.on.aws/' from origin 'https://www.seamlessly.us' has been blocked by CORS policy
```

## **Root Cause**

The Lambda function had **dual CORS configuration**:
1. **Function URL CORS settings** (configured via AWS CLI)
2. **Hardcoded CORS headers** in the Lambda function code

This caused conflicts where the Function URL CORS was being overridden by the code-level headers.

## **Solution Implemented**

### **1. Updated Lambda Function Code**

- **File:** `lightspeed-lambda-handler.js`
- **Changes:** Added consistent CORS headers to all response functions
- **CORS Origin:** `*` (allows all domains including seamlessly.us)
- **Methods:** GET, POST, OPTIONS
- **Headers:** Content-Type, Authorization

### **2. Updated Deployment Script**

- **File:** `deploy.sh`
- **Changes:** Modified Function URL CORS configuration to be more specific
- **Allowed Origins:** `https://www.seamlessly.us`, `https://seamlessly.us`
- **Methods:** GET, POST, OPTIONS

### **3. Created CORS Update Script**

- **File:** `update-cors.sh`
- **Purpose:** Update CORS for existing Lambda functions without full redeployment

## **Immediate Actions Required**

### **Option A: Quick CORS Update (Recommended)**

If your Lambda function is already deployed, just update the CORS configuration:

```bash
cd SeamlessVendorUI/lambda-lightspeed
./update-cors.sh
```

This will update the Function URL CORS settings without redeploying the entire function.

### **Option B: Full Redeployment**

If you want to deploy the updated code with all CORS fixes:

```bash
cd SeamlessVendorUI/lambda-lightspeed
./deploy.sh
```

## **What Was Fixed**

### **Before (Problematic):**
```javascript
// CORS was handled inconsistently
// Some responses had headers, others didn't
// Function URL CORS conflicted with code-level CORS
```

### **After (Fixed):**
```javascript
// Consistent CORS headers for all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://www.seamlessly.us',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

// All responses now include these headers
return {
    statusCode: 200,
    headers: corsHeaders,  // ← Added to all responses
    body: JSON.stringify({...})
};
```

## **CORS Configuration Details**

### **Function URL CORS (AWS Level):**
```json
{
    "AllowCredentials": false,
    "AllowHeaders": ["*"],
    "AllowMethods": ["GET", "POST", "OPTIONS"],
    "AllowOrigins": ["*"],
    "MaxAge": 86400
}
```

### **Lambda Function CORS (Code Level):**
```javascript
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};
```

## **Testing the Fix**

### **1. Update CORS Configuration:**
```bash
./update-cors.sh
```

### **2. Test from Browser Console:**
```javascript
// Test the Lambda function endpoint
fetch('https://your-lambda-url/start-oauth?email=test@example.com&business=Test&customer_id=123')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### **3. Check Network Tab:**
- Look for CORS errors in the Console
- Verify the `Access-Control-Allow-Origin` header is present
- Confirm the response includes your domain

## **Security Considerations**

### **Why Not `*` (Wildcard)?**
- **Security:** More restrictive than allowing all origins
- **Compliance:** Better for production environments
- **Control:** Explicit control over allowed domains

### **Future Domains:**
If you need to add more domains later, update both:
1. **Function URL CORS:** Via `update-cors.sh` or AWS Console
2. **Lambda Code CORS:** Update the `corsHeaders` object

## **Troubleshooting**

### **CORS Still Not Working?**
1. **Wait 5-10 minutes** - CORS changes can take time to propagate
2. **Clear browser cache** - Old CORS policies might be cached
3. **Check CloudWatch logs** - Verify the Lambda function is receiving requests
4. **Verify Function URL CORS** - Check AWS Console for current settings

### **Common Issues:**
- **Mixed Content:** Ensure both frontend and Lambda use HTTPS
- **Cache Headers:** Some CDNs cache CORS headers
- **Browser Extensions:** Disable CORS-related browser extensions for testing

## **Monitoring**

### **CloudWatch Metrics to Watch:**
- **Function invocation count** - Ensure requests are reaching Lambda
- **Error rate** - Monitor for CORS-related failures
- **Duration** - Check if CORS processing adds latency

### **Log Analysis:**
- **CORS preflight requests** (OPTIONS method)
- **Origin header values** in incoming requests
- **Response header inclusion** in Lambda responses

## **Next Steps**

1. **Run the CORS update script** immediately
2. **Test the integration** from your frontend
3. **Monitor CloudWatch logs** for any remaining issues
4. **Consider implementing** environment-specific CORS origins for dev/staging/prod

## **Contact**

If you continue to experience CORS issues after implementing these fixes, check:
- CloudWatch logs for detailed error messages
- Network tab in browser DevTools for request/response details
- AWS Lambda Function URL configuration in the console

---

**Remember:** CORS is a browser security feature, so the fix must be implemented on the **server side** (your Lambda function), not in the frontend code.
