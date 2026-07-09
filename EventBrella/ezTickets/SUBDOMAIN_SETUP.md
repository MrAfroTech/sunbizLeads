# Subdomain Setup: farmerbanks.eventbrella.com

## Current Status
The domain `farmerbanks.eventbrella.com` is already assigned to a Vercel project (likely the main EventBrella project).

## Solution Options

### Option 1: Configure in Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select the **main EventBrella project** (the one that has `farmerbanks.eventbrella.com` assigned)
3. Go to **Settings** > **Domains**
4. Verify `farmerbanks.eventbrella.com` is listed
5. The routing is now configured in `vercel.json` to serve `/farmerBanks/frontend/index.html`

### Option 2: Use Subdomain Routing

If the subdomain should point directly to the farmerBanks project:

1. In Vercel Dashboard, go to the **farmer-banks-farm-tours** project
2. Go to **Settings** > **Domains**
3. Remove `farmerbanks.eventbrella.com` from the main EventBrella project
4. Add `farmerbanks.eventbrella.com` to the farmer-banks-farm-tours project

### Option 3: Path-Based Routing (Current Setup)

The current setup routes:
- `eventbrella.com/farmerBanks` → serves Farmer Banks page
- `farmerbanks.eventbrella.com` → needs DNS/subdomain configuration

## Testing

After deployment, test:
- `https://eventbrella.com/farmerBanks` (should work)
- `https://farmerbanks.eventbrella.com` (needs DNS/subdomain config)

## DNS Configuration

If `farmerbanks.eventbrella.com` isn't working, check:

1. **DNS Records**: Ensure a CNAME record points to Vercel
   ```
   farmerbanks.eventbrella.com → cname.vercel-dns.com
   ```

2. **Vercel Domain Settings**: Verify the domain is assigned to the correct project

3. **SSL Certificate**: Vercel automatically provisions SSL, but it may take a few minutes

## Current Configuration

The main EventBrella `vercel.json` now includes:
```json
{
  "rewrites": [
    {
      "source": "/farmerBanks",
      "destination": "/farmerBanks/frontend/index.html"
    },
    {
      "source": "/farmerBanks/images/:path*",
      "destination": "/farmerBanks/frontend/images/:path*"
    },
    {
      "source": "/farmerBanks/styles/:path*",
      "destination": "/farmerBanks/frontend/styles/:path*"
    },
    {
      "source": "/farmerBanks/js/:path*",
      "destination": "/farmerBanks/frontend/js/:path*"
    },
    {
      "source": "/farmerBanks/api/:path*",
      "destination": "/farmerBanks/api/:path*"
    }
  ]
}
```

This means:
- ✅ `eventbrella.com/farmerBanks` will work
- ⚠️ `farmerbanks.eventbrella.com` needs subdomain configuration in Vercel Dashboard


