# Wallet Pass Service - Deployment Guide

## Quick Deploy to Railway

### 1. Connect Repository

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `wallet-pass-service` repository
5. Railway auto-detects Node.js

### 2. Add Environment Variables

In Railway dashboard, add these environment variables:

```
PORT=3000
NODE_ENV=production
API_SECRET_KEY=your-shared-secret-key-here
APPLE_PASS_TYPE_ID=pass.com.orlandopirates.wallet
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_PASS_CERT_PATH=./certs/pass.pem
APPLE_WWDR_CERT_PATH=./certs/wwdr.pem
GOOGLE_WALLET_ISSUER_ID=your-issuer-id
GOOGLE_WALLET_SERVICE_ACCOUNT=./certs/google-service-account.json
ALLOWED_ORIGINS=https://orlandopirates.app,https://www.orlandopirates.app
```

### 3. Add Certificates

**Option A: Via Railway Volume (Recommended)**

1. In Railway dashboard, go to your service
2. Click "Volumes" tab
3. Create volume at `/certs`
4. Upload certificate files:
   - `pass.pem` (Apple pass certificate)
   - `wwdr.pem` (Apple WWDR certificate)
   - `google-service-account.json` (Google service account)

**Option B: Via Environment Variables (Base64)**

1. Encode certificates to base64:
   ```bash
   base64 -i certs/pass.pem > pass.pem.b64
   base64 -i certs/wwdr.pem > wwdr.pem.b64
   base64 -i certs/google-service-account.json > google-service-account.json.b64
   ```

2. Add as environment variables:
   - `APPLE_PASS_CERT_BASE64` (decoded in code)
   - `APPLE_WWDR_CERT_BASE64`
   - `GOOGLE_SERVICE_ACCOUNT_BASE64`

### 4. Deploy

Railway will automatically:
- Install dependencies (`npm install`)
- Start server (`node server.js`)
- Assign public URL (e.g., `https://wallet-pass-service.railway.app`)

### 5. Get Deployment URL

After deployment, Railway provides a public URL:
- Example: `https://wallet-pass-service-production.up.railway.app`
- Copy this URL for use in Orlando Pirates app

---

## Quick Deploy to Render

### 1. Create Web Service

1. Go to [Render](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Select `wallet-pass-service`

### 2. Configure Service

**Build Settings:**
- Build Command: `npm install`
- Start Command: `node server.js`

**Environment Variables:**
Add all environment variables from Railway section above.

### 3. Add Certificates

**Option A: Via Render Disk (Recommended)**

1. In Render dashboard, go to your service
2. Click "Environment" tab
3. Add persistent disk at `/certs`
4. Upload certificate files via SSH or Render Shell

**Option B: Via Base64 Environment Variables**

Same as Railway Option B above.

### 4. Deploy

Render will:
- Build the service
- Start the server
- Assign public URL (e.g., `https://wallet-pass-service.onrender.com`)

---

## Update Orlando Pirates App

After deploying wallet-pass-service, update Orlando Pirates environment variables:

### Vercel Environment Variables

Add to Vercel dashboard → Orlando Pirates project → Environment Variables:

```
WALLET_PASS_SERVICE_URL=https://wallet-pass-service.railway.app
WALLET_SERVICE_API_KEY=your-shared-secret-key-here
```

**Important:** Use the same `API_SECRET_KEY` value in both services!

---

## Testing

### 1. Health Check

```bash
curl https://wallet-pass-service.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "wallet-pass-service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test Apple Pass Generation

```bash
curl -X POST https://wallet-pass-service.railway.app/api/passes/apple \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "wallet_id": "test-wallet-id",
    "balance_cents": 5000,
    "mode": "qr",
    "qr_token": "test-token",
    "user_name": "Test User"
  }' \
  --output test-pass.pkpass
```

### 3. Test Google Pass Generation

```bash
curl -X POST https://wallet-pass-service.railway.app/api/passes/google \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "wallet_id": "test-wallet-id",
    "balance_cents": 5000,
    "mode": "qr",
    "qr_token": "test-token",
    "user_name": "Test User"
  }'
```

---

## Troubleshooting

### Certificate Errors

- Ensure certificate paths are correct
- Check file permissions (should be readable)
- Verify certificate format (PEM for Apple, JSON for Google)

### API Key Errors

- Verify `API_SECRET_KEY` matches in both services
- Check header name: `x-api-key` or `Authorization: Bearer <key>`
- Ensure no extra spaces in API key

### CORS Errors

- Add Orlando Pirates domain to `ALLOWED_ORIGINS`
- Check CORS configuration in `server.js`

### Service Not Starting

- Check logs in Railway/Render dashboard
- Verify all environment variables are set
- Ensure Node.js version matches (>=18.0.0)

---

## Security Notes

1. **Never commit certificates to Git** - Use `.gitignore`
2. **Use strong API keys** - Generate random 32+ character strings
3. **Enable HTTPS** - Railway/Render provide SSL by default
4. **Restrict CORS** - Only allow Orlando Pirates domains
5. **Rate limiting** - Consider adding rate limiting middleware

---

## Next Steps

1. ✅ Deploy wallet-pass-service
2. ✅ Update Orlando Pirates environment variables
3. ✅ Test pass generation
4. ✅ Monitor logs for errors
5. ✅ Set up alerts (optional)

