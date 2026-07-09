# Vercel Production Deployment Guide

## Quick Deploy

### Option 1: Deploy from EventBrella/farmerBanks directory

```bash
cd EventBrella/farmerBanks
vercel --prod
```

### Option 2: Deploy from root with subdirectory

```bash
cd EventBrella
vercel --prod --cwd farmerBanks
```

### Option 3: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import project
3. Set root directory to `EventBrella/farmerBanks`
4. Deploy

## Pre-Deployment Checklist

- [x] Test mode enabled (no API keys needed)
- [x] All API routes configured
- [x] Frontend paths correct
- [x] vercel.json configured

## Environment Variables (Optional for Test Mode)

Since we're in test mode, no environment variables are required. However, if you want to set them for future production use:

```bash
vercel env add TEST_MODE
# Enter: true

# For production (when ready):
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUBLISHABLE_KEY production
vercel env add KLAVIYO_PRIVATE_API_KEY production
```

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Navigate to farmerBanks directory

```bash
cd EventBrella/farmerBanks
```

### 4. Deploy to Production

```bash
vercel --prod
```

### 5. Follow Prompts

- Set up and deploy? **Yes**
- Which scope? **Your account/team**
- Link to existing project? **No** (first time) or **Yes** (updates)
- Project name? **farmer-banks-farm-tours** (or your choice)
- Directory? **./** (current directory)
- Override settings? **No**

## Post-Deployment

### 1. Get Your Deployment URL

After deployment, Vercel will provide a URL like:
```
https://farmer-banks-farm-tours.vercel.app
```

### 2. Test the Deployment

1. Visit your deployment URL
2. Click "Select Tickets" on any tier
3. Fill in the form
4. Complete purchase (test mode - no real charge)
5. Verify success message appears

### 3. Update API Base URL (if needed)

If your API routes aren't working, check the frontend `app.js`:

```javascript
const API_BASE_URL = '/api/farmerBanks';
```

This should work with the Vercel routing configuration.

## Custom Domain (Optional)

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain
5. Follow DNS configuration instructions

## Monitoring

- Check Vercel Dashboard for deployment logs
- Monitor function logs for API calls
- Check browser console for frontend errors

## Troubleshooting

### API Routes Not Working

- Check that `api/*.js` files are in the correct location
- Verify `vercel.json` routes are correct
- Check function logs in Vercel dashboard

### Frontend Not Loading

- Verify `frontend/index.html` exists
- Check that static files are being served
- Review deployment logs

### 404 Errors

- Ensure routes in `vercel.json` match your file structure
- Check that all paths are relative correctly

## Production Checklist (When Ready)

When switching from test mode to production:

1. Set `TEST_MODE=false` in environment variables
2. Add Stripe keys:
   ```bash
   vercel env add STRIPE_SECRET_KEY production
   vercel env add STRIPE_PUBLISHABLE_KEY production
   ```
3. Add Klaviyo key:
   ```bash
   vercel env add KLAVIYO_PRIVATE_API_KEY production
   ```
4. Update frontend `app.js`:
   ```javascript
   const TEST_MODE = false;
   ```
5. Redeploy:
   ```bash
   vercel --prod
   ```

## Rollback

If something goes wrong:

```bash
vercel rollback
```

Or use Vercel Dashboard to rollback to previous deployment.

## Continuous Deployment

Vercel automatically deploys when you push to your connected Git repository:

1. Connect your Git repo in Vercel Dashboard
2. Set production branch (usually `main` or `master`)
3. Every push will trigger a new deployment

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel CLI: https://vercel.com/docs/cli
- Check deployment logs in Vercel Dashboard



