/**
 * API server: GET /api/leads reads Sheet and returns JSON for the dashboard.
 * Run: npm run proxy (listens on :3001)
 */
import 'dotenv/config';
import express from 'express';
import { getAllLeads } from '../scripts/sheets.js';

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

app.get('/api/leads', async (req, res) => {
  try {
    const data = await getAllLeads();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load leads' });
  }
});

app.listen(PORT, () => console.log('API running on :' + PORT));
