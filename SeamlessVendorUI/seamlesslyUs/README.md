# Coffee & Conversations Collective - Booking & Loyalty System

A comprehensive appointment booking and loyalty rewards system for Coffee & Conversations Collective, built with React and designed for Vercel hosting.

## 🎯 Business Overview

Coffee & Conversations Collective is a unique venue combining:
- **Spa Services** - Professional massage therapy
- **Artisan Cafe** - Table reservations and coffee service
- **Event Space** - Private rentals for meetings and celebrations
- **Podcast Studio** - Recording and production facilities

This system enables customers to book any service while earning and redeeming loyalty points.

## 🚀 Features

### Customer Features
- ✅ Multi-service booking (Massage, Cafe, Events, Podcast)
- ✅ Staff selection for personalized service
- ✅ Interactive calendar with real-time availability
- ✅ Loyalty rewards program with 4 tiers (Bronze/Silver/Gold/Platinum)
- ✅ Points earning (1 point per $1 spent)
- ✅ Points redemption for discounts and rewards
- ✅ Referral program (500 points per referral)
- ✅ Birthday rewards (double points in birthday month)
- ✅ BOT POS payment integration
- ✅ Email/SMS confirmations and reminders

### Admin Features
- ✅ Real-time booking dashboard
- ✅ Service configuration and pricing
- ✅ Staff schedule management
- ✅ Loyalty program analytics
- ✅ Customer history tracking
- ✅ Revenue and performance metrics

## 📁 Project Structure

```
CoffeeConversationsCollective/
├── components/
│   ├── booking/
│   │   ├── BookingSystem.js           # Main booking component
│   │   ├── BookingSystem.css
│   │   ├── BookingCalendar.js         # Calendar view
│   │   ├── BookingCalendar.css
│   │   ├── CustomerBookingFlow.js     # Checkout flow
│   │   └── CustomerBookingFlow.css
│   ├── loyalty/
│   │   ├── LoyaltyRewards.js          # Rewards dashboard
│   │   └── LoyaltyRewards.css
│   └── admin/
│       ├── BookingDashboard.js        # Admin dashboard
│       ├── BookingDashboard.css
│       ├── ServiceConfig.js           # Service management
│       └── ServiceConfig.css
├── api/
│   ├── bookings/
│   │   ├── index.js                   # Booking CRUD
│   │   └── stats.js                   # Analytics
│   ├── services/
│   │   └── index.js                   # Service catalog
│   ├── staff/
│   │   └── index.js                   # Staff management
│   ├── loyalty/
│   │   ├── index.js                   # Loyalty accounts
│   │   ├── rewards.js                 # Rewards catalog
│   │   ├── history.js                 # Points history
│   │   ├── earn.js                    # Award points
│   │   └── redeem.js                  # Redeem points
│   ├── bot-pos/
│   │   ├── payment.js                 # Process payments
│   │   └── transaction.js             # Transaction status
│   └── availability.js                # Check time slots
├── schemas/
│   ├── bookings-schema.js
│   ├── services-schema.js
│   ├── staff-schema.js
│   ├── loyalty-schema.js
│   └── availability-schema.js
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js 16+ and npm
- Vercel account (for deployment)
- BOT POS account credentials

### Local Setup

1. **Navigate to the project directory:**
```bash
cd EventBrella/CoffeeConversationsCollective
```

2. **Install dependencies:**
```bash
npm install react react-dom react-router-dom
```

3. **Configure environment variables:**

Create a `.env` file in the project root:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development

# BOT POS Configuration
REACT_APP_BOT_POS_API_KEY=your_bot_pos_api_key
REACT_APP_BOT_POS_MERCHANT_ID=your_merchant_id

# Email/SMS Service (Optional)
REACT_APP_TWILIO_ACCOUNT_SID=your_twilio_sid
REACT_APP_TWILIO_AUTH_TOKEN=your_twilio_token
REACT_APP_TWILIO_PHONE_NUMBER=+1234567890

# Loyalty Program Settings
REACT_APP_POINTS_PER_DOLLAR=1
REACT_APP_REFERRAL_POINTS=500
REACT_APP_REFERRAL_BONUS=250
```

4. **Run locally:**
```bash
npm start
```

The app will be available at `http://localhost:3000`

## 🌐 Deployment to Vercel

### 1. Install Vercel CLI (if not installed):
```bash
npm install -g vercel
```

### 2. Configure `vercel.json`:

Create or update `vercel.json` in the EventBrella directory:

```json
{
  "version": 2,
  "name": "coffee-conversations-collective",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "CoffeeConversationsCollective/build"
      }
    },
    {
      "src": "CoffeeConversationsCollective/api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "^/api/(.*)",
      "dest": "/CoffeeConversationsCollective/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/CoffeeConversationsCollective/build/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "https://your-domain.vercel.app",
    "REACT_APP_ENVIRONMENT": "production"
  }
}
```

### 3. Deploy:
```bash
vercel --prod
```

### 4. Set Environment Variables in Vercel Dashboard:
- Go to your project in Vercel
- Navigate to Settings → Environment Variables
- Add all variables from your `.env` file

## 📊 Database Schema

### Key Tables

#### Bookings
- Stores all appointment bookings
- Links to customers, services, and staff
- Tracks loyalty points earned/used
- BOT POS transaction integration

#### Services
- Service catalog (massages, cafe, events, podcast)
- Pricing and duration options
- Availability rules

#### Staff
- Staff member profiles
- Working hours and specialties
- Service assignments

#### Loyalty Accounts
- Customer points balance
- Tier level (Bronze/Silver/Gold/Platinum)
- Referral codes

#### Loyalty Transactions
- Points earned and redeemed
- Transaction history
- Referral bonuses

See `schemas/` folder for complete schema definitions.

## 🎨 Customization

### Branding Colors
The system uses the Coffee & Conversations Collective brand colors:
- **Primary Green:** `#2D5016`
- **Gold Accent:** `#DAA520`
- **Dark Background:** `#1a1a1a`

To customize, update CSS variables in component stylesheets.

### Loyalty Tiers

Edit `schemas/loyalty-schema.js` to modify tier thresholds and benefits:

```javascript
{
  bronze: { min: 0, discount: 5%, multiplier: 1.0 },
  silver: { min: 1000, discount: 10%, multiplier: 1.1 },
  gold: { min: 2500, discount: 15%, multiplier: 1.25 },
  platinum: { min: 5000, discount: 20%, multiplier: 1.5 }
}
```

### Services

Add or modify services in `api/services/index.js` or through the admin panel:

```javascript
{
  name: 'New Service',
  category: 'massage',
  price: 100,
  duration_options: [60, 90],
  points_earned: 1,
  description: 'Service description',
  requires_staff: true
}
```

## 🔌 BOT POS Integration

### Payment Flow

1. Customer completes booking
2. System creates payment request to BOT POS
3. BOT POS processes payment
4. Transaction ID stored with booking
5. Loyalty points awarded on successful payment

### API Integration Points

**Create Payment:**
```javascript
POST /api/bot-pos/payment
{
  amount: 95.00,
  customer_id: 'customer_123',
  booking_id: 'booking_456',
  description: 'Deep Tissue Massage'
}
```

**Check Transaction:**
```javascript
GET /api/bot-pos/transaction/[transaction_id]
```

### Setup BOT POS

1. Create BOT POS merchant account
2. Generate API credentials
3. Add credentials to `.env`:
```env
REACT_APP_BOT_POS_API_KEY=your_key
REACT_APP_BOT_POS_MERCHANT_ID=your_id
```

4. Test in sandbox mode before production

## 📱 API Endpoints

### Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/stats` - Analytics

### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Staff
- `GET /api/staff` - List staff
- `GET /api/staff?service_id=X` - Get staff for service

### Loyalty
- `GET /api/loyalty/:customer_id` - Get loyalty account
- `GET /api/loyalty/rewards` - List rewards
- `GET /api/loyalty/history/:customer_id` - Points history
- `POST /api/loyalty/earn` - Award points
- `POST /api/loyalty/redeem` - Redeem points

### Availability
- `GET /api/availability?date=YYYY-MM-DD&service_id=X` - Check availability

### BOT POS
- `POST /api/bot-pos/payment` - Process payment
- `GET /api/bot-pos/transaction/:id` - Get transaction

## 🧪 Sample Data

The system includes pre-populated sample data:

### Services
- Swedish Massage (60/90 min) - $85/$120
- Deep Tissue Massage (60/90 min) - $95/$135
- Hot Stone Massage (75/90 min) - $110/$140
- Aromatherapy Massage (60/90 min) - $90/$125
- Cafe Tables (various sizes)
- Event Space (half/full day)
- Podcast Studio (1/2/3 hours)

### Staff
- Sarah Thompson (Swedish, Deep Tissue, Aromatherapy)
- Michael Chen (Deep Tissue, Hot Stone)
- Jessica Martinez (Swedish, Aromatherapy, Hot Stone)
- Alex Rivera (Podcast Production)

### Loyalty Tiers
- **Bronze:** 0-999 points (5% discount)
- **Silver:** 1,000-2,499 points (10% discount, priority booking)
- **Gold:** 2,500-4,999 points (15% discount, free upgrades)
- **Platinum:** 5,000+ points (20% discount, VIP perks)

## 🎯 Usage Examples

### Customer Booking Flow

```jsx
import BookingSystem from './components/booking/BookingSystem';

function App() {
  const handleBookingComplete = (booking) => {
    console.log('Booking created:', booking);
    // Send confirmation email, etc.
  };

  return (
    <BookingSystem 
      customerId="customer_123"
      onBookingComplete={handleBookingComplete}
    />
  );
}
```

### Loyalty Dashboard

```jsx
import LoyaltyRewards from './components/loyalty/LoyaltyRewards';

function CustomerDashboard() {
  return (
    <LoyaltyRewards customerId="customer_123" />
  );
}
```

### Admin Dashboard

```jsx
import BookingDashboard from './components/admin/BookingDashboard';

function AdminPanel() {
  return (
    <BookingDashboard />
  );
}
```

## 🔧 Troubleshooting

### Common Issues

**1. API endpoints not found (404)**
- Ensure `vercel.json` routes are configured correctly
- Check that API files are in the correct directory structure

**2. CORS errors**
- Verify CORS headers in API files
- Check `Access-Control-Allow-Origin` settings

**3. Booking times not showing**
- Check staff working hours configuration
- Verify date format (YYYY-MM-DD)

**4. Loyalty points not calculating**
- Check tier benefits configuration
- Verify points_earned multiplier

**5. BOT POS payment failing**
- Verify API credentials
- Check sandbox vs. production mode
- Review BOT POS transaction logs

## 📈 Future Enhancements

- [ ] Multi-language support
- [ ] SMS appointment reminders (Twilio)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Automated marketing campaigns
- [ ] Gift certificate sales
- [ ] Membership packages
- [ ] Online check-in/check-out
- [ ] Customer review system
- [ ] Waitlist automation

## 🤝 Support

For questions or support:
- Email: support@coffeeconversations.com
- Documentation: [Link to docs]
- Issue Tracker: [GitHub issues]

## 📝 License

Proprietary - Coffee & Conversations Collective

---

**Built with ❤️ for Coffee & Conversations Collective**

*Combining exceptional service with cutting-edge technology*

