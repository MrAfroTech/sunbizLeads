import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load shared aiAgents/.env first, then local .env (local overrides)
const aiAgentsEnv = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: aiAgentsEnv });
dotenv.config();

const categoriesPath = path.join(process.cwd(), 'config', 'categories.json');
let categoriesConfig: { categories: Array<{ name: string; enabled: boolean; sunbiz_keywords: string[]; min_locations: number; decision_maker_titles: string[]; priority: number }> } = { categories: [] };

try {
  const raw = fs.readFileSync(categoriesPath, 'utf-8');
  categoriesConfig = JSON.parse(raw) as typeof categoriesConfig;
} catch {
  // defaults if file missing
}

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY!,
    listId: parseInt(process.env.BREVO_LIST_ID || '2', 10),
  },
  google: {
    placesApiKey: process.env.GOOGLE_PLACES_API_KEY!,
  },
  hunter: {
    apiKey: process.env.HUNTER_IO_API_KEY!,
  },
  serpApi: {
    apiKey: process.env.SERPAPI_API_KEY,
  },
  linkedin: {
    apiKey: process.env.LINKEDIN_API_KEY,
  },
  notification: {
    email: process.env.NOTIFICATION_EMAIL || '',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  run: {
    costAlertThresholdUsd: 75,
    costCapUsd: 100,
    pipelineTimeoutMinutes: 120,
    delayBetweenRequestsMs: 1500,
  },
  multiLocation: {
    minLocations: 10,
    maxLocations: 200,
    minConfirmationSources: 2,
    categories: categoriesConfig.categories,
  },
} as const;
