# 🚀 Deploy Orlando Pirates App to Live Site (Vercel)

This guide shows you how to deploy the app to a live URL using Vercel - no local server needed!

---

## ⚡ Quick Deploy (Fastest Method)

### Step 1: Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open a browser for you to login.

### Step 3: Navigate to Project Directory

```bash
cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/orlandoPirates
```

### Step 4: Deploy to Production (Live Site)

```bash
vercel --prod
```

**That's it!** Vercel will:
- Build your app
- Deploy it to a live URL
- Give you a link like: `https://orlando-pirates-fan.vercel.app`

---

## 📋 What Happens During Deployment

1. **Vercel reads your `vercel.json`** configuration
2. **Runs the build command**: `npm run vercel-build`
3. **Exports Expo web build** to `dist/` folder
4. **Deploys the static files** to a CDN
5. **Provides you with a live URL**

---

## 🔄 First Time Setup Prompts

When you run `vercel --prod` for the first time, you'll see:

```
? Set up and deploy "~/SeamlessMarketplace/EventBrella/orlandoPirates"? [Y/n] y
? Which scope do you want to deploy to? [Your Account]
? Link to existing project? [y/N] n
? What's your project's name? orlando-pirates-fan-app
? In which directory is your code located? ./
```

**Just press Enter** for defaults or customize as needed.

---

## ✅ After Deployment

You'll get a URL like:
```
✅ Production: https://orlando-pirates-fan-app.vercel.app
```

**This is your live site!** Share this URL with clients.

---

## 🔁 Update the Live Site

To update the live site after making changes:

```bash
cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/orlandoPirates
vercel --prod
```

That's it! Vercel will rebuild and deploy the new version.

---

## 📱 Test Your Live Site

1. Open the URL in your browser
2. Test on mobile (use your phone's browser)
3. Test navigation between screens
4. Check QR codes display correctly
5. Verify all features work

---

## 🌐 Alternative: Deploy via Vercel Dashboard

If you prefer using the web interface:

1. Go to [vercel.com](https://vercel.com) and login
2. Click **"Add New Project"**
3. **Import Git Repository** (if you have one) OR
4. **Upload** the `orlandoPirates` folder (drag and drop)
5. Vercel will detect the configuration automatically
6. Click **"Deploy"**

---

## 🔧 Troubleshooting

### Issue: Build fails

**Check:**
- All dependencies installed: `npm install --legacy-peer-deps`
- Node version matches (Vercel uses Node 20.x)
- No syntax errors in code

### Issue: App doesn't load

**Check:**
- `dist/` folder was created during build
- `vercel.json` configuration is correct
- All routes are configured

### Issue: Navigation doesn't work

**Check:**
- React Navigation is properly set up
- All screen components are imported correctly

---

## 📝 Deployment Checklist

Before deploying:

- [ ] All dependencies installed (`npm install --legacy-peer-deps`)
- [ ] Build works locally (`npm run vercel-build` creates `dist/` folder)
- [ ] `vercel.json` is configured correctly
- [ ] `package.json` has `vercel-build` script
- [ ] No console errors in code

---

## 🎯 Summary

**To get a live URL:**

1. `cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/orlandoPirates`
2. `vercel --prod`
3. Get your live URL! 🌐

**No git needed!** Vercel CLI can deploy directly from your local folder.








