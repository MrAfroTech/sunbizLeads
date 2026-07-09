# Tech Stack - Farmer Banks Ticket System

## Frontend
- **HTML/CSS/JavaScript** - Static frontend in `/public` directory
- **No framework** - Vanilla JavaScript
- **Styling:** Custom CSS (`/public/styles/main.css`)

## Backend
- **Runtime:** Node.js
- **Platform:** Vercel Serverless Functions
- **Architecture:** Serverless (function-as-a-service)
- **No framework** - Plain Node.js handlers (no Express, no Next.js)

## API Structure
- Files in `/api/` directory
- Each file exports: `module.exports = async (req, res) => { ... }`
- Vercel automatically routes `/api/*.js` files to serverless endpoints

## Key Dependencies
- `stripe` - Stripe payment processing
- `qrcode` - QR code generation
- `axios` - HTTP requests (Klaviyo API)
- `uuid` - Unique ID generation
- `raw-body` - Raw body stream reading for webhook signature verification

## Third-Party Services
- **Stripe** - Payment processing (Checkout Sessions)
- **Klaviyo** - Email marketing & transactional emails
- **Vercel** - Hosting & serverless functions

## Deployment
- **Platform:** Vercel
- **Static files:** `/public` directory
- **API routes:** `/api` directory
- **Config:** `vercel.json` for routing and function settings

## Environment Variables
- `STRIPE_SECRET_KEY` or `STRIPE_TEST_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `KLAVIYO_PRIVATE_KEY` or `KLAVIYO_PRIVATE_API_KEY`
- `BASE_URL` (optional)
- `TEST_MODE` (optional)

## Important Notes
- **Not Next.js** - This is plain Vercel serverless functions
- **Not Express** - No Express.js framework
- **CommonJS** - Uses `module.exports`, not ES6 exports
- **Body parsing** - Disabled for webhook route (`bodyParser: false`)

