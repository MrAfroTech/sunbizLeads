# PayPal OAuth Implementation Guide

## ✅ What We've Implemented

### 1. Environment Variables Configuration
- **`REACT_APP_PAYPAL_API_URL`**: `https://1ylbl5fjqc.execute-api.us-east-1.amazonaws.com/dev` (Lambda function for webhooks and token exchange)
- **`REACT_APP_PAYPAL_REDIRECT_URI`**: `https://seamlessly.us/paypal/callback` (Frontend callback page)

### 2. Frontend Components
- **`PayPalCallback.js`**: React component that handles the OAuth callback from PayPal
- **`PayPalCallback.css`**: Styling for the callback component
- **Updated `paypal-oauth.js`**: Now uses the correct redirect URI from environment variables

### 3. Backend Lambda Function
- **`exchange-token.js`**: New endpoint that exchanges authorization code for access token
- Handles PayPal OAuth token exchange
- Stores merchant information in DynamoDB
- Returns integration success/failure status

## 🔧 What You Need to Do Next

### 1. PayPal Developer Dashboard Configuration
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Navigate to your app settings
3. **Add this Redirect URI**: `https://seamlessly.us/paypal/callback`
4. **Keep webhooks separate** - those still point to your Lambda function

### 2. Add Route for PayPal Callback
In your React router (App.js), add this route:
```javascript
import PayPalCallback from './components/PayPalCallback';

// Add this route
<Route path="/paypal/callback" element={<PayPalCallback />} />
```

### 3. Deploy the Lambda Function
Deploy the `exchange-token.js` function to your Lambda environment at:
`https://1ylbl5fjqc.execute-api.us-east-1.amazonaws.com/dev/exchange-token`

### 4. Test the Integration
1. Start the PayPal OAuth flow
2. User gets redirected to PayPal
3. After authorization, PayPal redirects to `https://seamlessly.us/paypal/callback`
4. Your callback component exchanges the code for a token
5. User gets redirected to dashboard with success message

## 🎯 How It Works Now

1. **OAuth Initiation**: User clicks "Connect PayPal" → redirects to PayPal with `redirect_uri=https://seamlessly.us/paypal/callback`

2. **PayPal Authorization**: User authorizes on PayPal's site

3. **Callback**: PayPal redirects to `https://seamlessly.us/paypal/callback?code=AUTH_CODE&state=DATA`

4. **Token Exchange**: Your callback component sends the code to `/exchange-token` endpoint

5. **Storage**: Lambda function stores the access token and merchant info in DynamoDB

6. **Success**: User gets redirected to dashboard with confirmation

## 🚨 Important Notes

- **Redirect URI vs Webhook URL**: These are completely different concepts
- **Redirect URI**: Where users land after OAuth (frontend page)
- **Webhook URL**: Where PayPal sends server notifications (Lambda function)
- **Environment Variables**: Make sure both URLs are properly set in your environment files

## 🔍 Troubleshooting

If you still get "invalid client_id or redirect_uri":
1. Verify the redirect URI is added to your PayPal app settings
2. Check that `REACT_APP_PAYPAL_REDIRECT_URI` is set correctly
3. Ensure the callback route exists in your React app
4. Verify the Lambda function is deployed and accessible

## 📁 Files Created/Modified

- ✅ `src/components/PayPalCallback.js` (NEW)
- ✅ `src/styles/PayPalCallback.css` (NEW)
- ✅ `api/exchange-token.js` (NEW)
- ✅ `src/components/paypal-oauth.js` (UPDATED)
- ✅ Environment files (UPDATED)

This implementation separates concerns properly: frontend handles user flow, backend handles token exchange and storage.
