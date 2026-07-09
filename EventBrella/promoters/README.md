# Promoters — Tuesday Reset (Sayles Orlando)

React frontend + mock Node API for the Sayles Orlando promoter landing page. Matches the `sayles-tuesday-reset.html` mockup exactly.

## Structure

```
promoters/
├── api/                 # Vercel serverless stubs (no real payments)
│   ├── health.js
│   ├── tiers.js
│   └── checkout.js
├── src/
│   ├── components/      # Nav, Hero, Tiers, Flow, Checkout, Footer
│   ├── data/content.js
│   ├── styles.css       # Exact mockup styles
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vercel.json
└── vite.config.js
```

## Local development

```bash
cd promoters
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Set project root to `EventBrella/promoters` (or deploy from this folder).
2. Vercel uses `vercel.json`:
   - **Build:** `npm run vercel-build` → `dist/`
   - **API:** `/api/*` → serverless functions in `api/`
   - **SPA:** all other routes → `index.html`

```bash
cd promoters
npx vercel
```

## Mock API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health stub |
| GET | `/api/tiers` | Tier ladder JSON |
| GET | `/api/checkout` | Checkout preview JSON |
| POST | `/api/checkout` | Mock payment response (no processing) |

The frontend renders static content from the mockup; API stubs exist for future wiring only.
