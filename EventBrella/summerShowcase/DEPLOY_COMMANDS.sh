#!/bin/bash

# Quick Deploy Script for Orlando Pirates App to Vercel
# This deploys to a LIVE URL (not local)

echo "🚀 Deploying Orlando Pirates App to Live Site..."
echo ""

# Navigate to project directory
cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/orlandoPirates

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
    echo ""
fi

# Check if logged in
echo "🔐 Checking Vercel login status..."
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel:"
    vercel login
    echo ""
fi

# Deploy to production
echo "🚀 Deploying to production..."
echo ""
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is now live at the URL shown above!"








