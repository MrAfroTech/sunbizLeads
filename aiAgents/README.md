# aiAgents

Automation agents for speaking, recruiting, sales, and more. Shared credentials and config live here.

## Setup: Credentials

All agents require API credentials to function. These are stored locally and never committed to Git.

### Required Credentials

1. **Google Sheets Service Account** (required for all agents)
   - Used as database for opportunities, contacts, etc.
   - Located: `credentials/google-sheets-service-account.json`
   - [How to get credentials](credentials/README.md)

2. **Anthropic API Key** (optional, for AI-powered features)
   - Located: `credentials/anthropic-api-key.txt` or in `aiAgents/.env`
   - Get from: https://console.anthropic.com/

3. **Brevo API Key** (optional, for email sending)
   - Located: `credentials/brevo-api-key.txt` or in `aiAgents/.env`
   - Get from: https://app.brevo.com/

4. **SerpAPI Key** (optional, for web search)
   - Located: `credentials/serpapi-key.txt` or in `aiAgents/.env`
   - Get from: https://serpapi.com/

### Quick Start

```bash
# 1. Copy your Google Sheets credential file
cp ~/Downloads/second-flame-338521-*.json credentials/google-sheets-service-account.json

# 2. Test credentials
node config/test-credentials.js

# 3. Share your Google Sheets with the service account email shown in output
```

See [credentials/README.md](credentials/README.md) for detailed setup instructions.

## Project structure

- **credentials/** – API keys and service account JSON (git-ignored except template)
- **config/** – Shared config and credential loading (`credentials-config.js`, `test-credentials.js`)
- **workflows-speaking/** – Speaking automation
- **florida-sunbiz-scraper/** – Multi-location operator lead gen
- **.env** – Shared env vars (Claude, Brevo, SerpAPI) for agents that use dotenv
