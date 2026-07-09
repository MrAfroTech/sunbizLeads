# 🔧 Lightspeed Environment Variables Setup

## ⚠️ **Current Issue**

You're seeing this error because the `REACT_APP_LIGHTSPEED_LAMBDA_URL` environment variable is not set.

## 🚀 **Quick Fix**

### **Step 1: Create .env file**

Create a file named `.env` in the `SeamlessVendorUI/` directory with this content:

```bash
# Lightspeed Integration (REQUIRED)
REACT_APP_LIGHTSPEED_LAMBDA_URL=https://your-actual-lambda-url.lambda-url.us-east-1.on.aws

# Other variables (optional)
REACT_APP_SQUARE_LAMBDA_URL=https://your-square-lambda-url.lambda-url.us-east-1.on.aws
```

### **Step 2: Get Your Lambda URL**

You need to deploy the Lightspeed lambda function first:

```bash
cd SeamlessVendorUI/lambda-lightspeed
chmod +x deploy.sh
./deploy.sh
```

The script will output your Lambda function URL. Copy that URL.

### **Step 3: Update .env file**

Replace `https://your-actual-lambda-url.lambda-url.us-east-1.on.aws` with your actual Lambda URL.

### **Step 4: Restart your development server**

```bash
# Stop your current server (Ctrl+C)
# Then restart
npm start
```

## 📋 **Complete .env Example**

```bash
# Lightspeed Integration
REACT_APP_LIGHTSPEED_LAMBDA_URL=https://abc123def456.lambda-url.us-east-1.on.aws

# Square Integration (if you have it)
REACT_APP_SQUARE_LAMBDA_URL=https://xyz789ghi012.lambda-url.us-east-1.on.aws

# Other POS Systems
REACT_APP_CLOVER_CLIENT_ID=8JBVMZPB4R54C
REACT_APP_CLOVER_REDIRECT_URI=https://seamlessly.us/api/clover/oauth/callback
```

## 🔍 **Verify Configuration**

After setting up, you should see:

1. ✅ No more "Integration Setup Required" error
2. ✅ Lightspeed appears as a configured POS system
3. ✅ You can click the Lightspeed integration button

## 🚨 **Common Issues**

1. **File not found**: Make sure `.env` is in the `SeamlessVendorUI/` directory
2. **Server not restarted**: Environment variables only load on server restart
3. **Wrong URL format**: Must be a valid HTTPS URL
4. **File permissions**: Ensure `.env` is readable

## 📞 **Need Help?**

If you're still having issues:

1. Check that `.env` file exists in the right location
2. Verify the Lambda URL is correct
3. Restart your development server
4. Check browser console for errors

---

**🎯 Once you set the `REACT_APP_LIGHTSPEED_LAMBDA_URL`, the integration will work immediately!**
