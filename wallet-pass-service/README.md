# Wallet Pass Service

Standalone microservice for generating Apple Wallet and Google Wallet passes. This service handles only pass generation to keep the main Orlando Pirates app bundle size small.

## Features

- 🍎 Apple Wallet pass generation (.pkpass files)
- 🤖 Google Wallet pass generation (save URLs)
- 🔐 API key authentication
- 🚀 Lightweight Express server
- 📦 Separate from main app (reduces bundle size)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `API_SECRET_KEY` - Shared secret for API authentication
- `APPLE_PASS_TYPE_ID` - Apple Pass Type ID
- `APPLE_TEAM_ID` - Apple Team ID
- `APPLE_PASS_CERT_PATH` - Path to Apple certificate
- `APPLE_WWDR_CERT_PATH` - Path to Apple WWDR certificate
- `GOOGLE_WALLET_ISSUER_ID` - Google Wallet Issuer ID
- `GOOGLE_WALLET_SERVICE_ACCOUNT` - Path to Google service account JSON

### 3. Add Certificates

Place your certificates in the `certs/` directory:
- `certs/pass.pem` - Apple pass certificate
- `certs/wwdr.pem` - Apple WWDR certificate
- `certs/google-service-account.json` - Google service account credentials

### 4. Run Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on port 3000 by default (configurable via `PORT` env var).

## API Endpoints

### Health Check

```
GET /health
```

### Generate Apple Wallet Pass

```
POST /api/passes/apple
Headers:
  x-api-key: your-api-key
  Content-Type: application/json

Body:
{
  "wallet_id": "uuid",
  "balance_cents": 5000,
  "mode": "qr",
  "qr_token": "jwt-token-here",
  "user_name": "John Doe"
}

Response:
  Content-Type: application/vnd.apple.pkpass
  (Returns .pkpass file)
```

### Generate Google Wallet Pass

```
POST /api/passes/google
Headers:
  x-api-key: your-api-key
  Content-Type: application/json

Body:
{
  "wallet_id": "uuid",
  "balance_cents": 5000,
  "mode": "qr",
  "qr_token": "jwt-token-here",
  "user_name": "John Doe"
}

Response:
{
  "success": true,
  "platform": "google",
  "passId": "issuer.pass-id",
  "saveUrl": "https://pay.google.com/gp/v/save/...",
  "passObject": {...}
}
```

## Authentication

All pass generation endpoints require authentication via:
- `x-api-key` header, OR
- `Authorization: Bearer <api-key>` header

Set `API_SECRET_KEY` in `.env` to match the key used by the Orlando Pirates app.

## Deployment

### Railway

1. Connect GitHub repository
2. Railway auto-detects Node.js
3. Add environment variables
4. Deploy

### Render

1. Create new Web Service
2. Connect repository
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables
6. Deploy

## CORS

Configure allowed origins via `ALLOWED_ORIGINS` environment variable (comma-separated).

## Notes

- NFC mode is a placeholder until Marqeta integration (Phase 2)
- QR mode is fully functional
- Pass templates should be placed in `templates/apple/` directory
- Service is stateless - no database required

