# 🌐 Deploy to Live Site - Simple Guide

## You Want a LIVE URL (Not Local)

`npm start` = Local development (localhost) ❌

**We want:** Live URL that works on the internet ✅

---

## 🚀 Deploy to Vercel (3 Steps)

### Step 1: Open Terminal

```bash
cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/orlandoPirates
```

### Step 2: Install Vercel CLI (if needed)

```bash
npm install -g vercel
```

### Step 3: Deploy to Live Site

```bash
vercel --prod
```

**That's it!** 

After deployment, you'll get a URL like:
```
https://orlando-pirates-fan-app.vercel.app
```

**This is your LIVE site URL** - share it with anyone, works on phones, tablets, computers!

---

## 🔄 To Update the Live Site

After making changes, just run again:

```bash
cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/orlandoPirates
vercel --prod
```

---

## ✅ First Time Setup

The first time you run `vercel --prod`, it will ask:

1. **Login to Vercel** (opens browser)
2. **Project name?** (press Enter for default)
3. **Directory?** (press Enter for `./`)

Then it builds and deploys automatically!

---

## 📱 Test Your Live Site

1. Copy the URL Vercel gives you
2. Open it in your browser
3. Test on your phone
4. Share with clients!

---

## ⚡ Quick Command Summary

```bash
# Navigate to project
cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/orlandoPirates

# Deploy to live site
vercel --prod
```

**No git needed!** Vercel deploys directly from your folder.

---

## 🎯 What Happens

1. ✅ Vercel builds your app (`npm run vercel-build`)
2. ✅ Creates static files in `dist/` folder
3. ✅ Uploads to Vercel's CDN
4. ✅ Gives you a live URL
5. ✅ App is accessible worldwide!

---

**Your app will be LIVE at a URL like:**
`https://orlando-pirates-fan-app.vercel.app`

**Just run:** `vercel --prod` from the orlandoPirates folder! 🚀








