#!/usr/bin/env node
/**
 * process-client-requests.js
 * Polls Supabase for pending client_ticket_requests, builds Cursor prompt, runs Cursor Agent CLI
 * (agent chat), captures output, and updates status + agent_output in Supabase.
 * Run from EventBrella directory. Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY in .env.
 * Cursor CLI: curl https://cursor.com/install -fsSL | bash
 * Optional .env: AGENT_PATH=/full/path/to/agent (for cron); PROCESS_AGENT_CMD (use %s for prompt path).
 * When AGENT_PATH is unset, PATH is prefixed with $HOME/.local/bin so agent is found without sourcing .zshrc.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const EVENTBRELLA_DIR = path.resolve(__dirname);
const ENV_PATH = path.join(EVENTBRELLA_DIR, '.env');
const EZTICKETS_DIR = path.join(EVENTBRELLA_DIR, 'ezTickets');
const PROMPT_TEMPLATE_PATH = path.join(EZTICKETS_DIR, 'prompt-template.js');

// ——— Load .env ———
function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('Missing .env at', ENV_PATH);
    process.exit(1);
  }
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const val = m[2].replace(/^["']|["']$/g, '').trim();
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  });
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in EventBrella/.env');
  process.exit(1);
}

// ——— Supabase client (optional dependency) ———
let supabase;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} catch (e) {
  console.error('Install Supabase JS: npm install @supabase/supabase-js (from EventBrella or ezTickets)');
  process.exit(1);
}

// ——— Load buildCursorPrompt from prompt-template.js ———
function getBuildCursorPrompt() {
  const script = fs.readFileSync(PROMPT_TEMPLATE_PATH, 'utf8');
  const window = {};
  try {
    eval(script);
  } catch (err) {
    console.error('Failed to load prompt-template.js:', err.message);
    process.exit(1);
  }
  if (typeof window.buildCursorPrompt !== 'function') {
    console.error('prompt-template.js did not define buildCursorPrompt');
    process.exit(1);
  }
  return window.buildCursorPrompt;
}

// ——— Convert DB row (snake_case) to form data shape (camelCase / CLIENT_*) ———
function rowToFormData(row) {
  return {
    CLIENT_NAME: row.client_name,
    CLIENT_ORGANIZER_NAME: row.client_organizer_name,
    CLIENT_EVENT_NAME: row.client_event_name,
    CLIENT_EVENT_DATE: row.client_event_date,
    CLIENT_EVENT_START_TIME: row.client_event_start_time,
    CLIENT_EVENT_END_TIME: row.client_event_end_time,
    CLIENT_EVENT_TIME: row.client_event_time,
    CLIENT_EVENT_DESCRIPTION: row.client_event_description,
    CLIENT_APP_NAME: row.client_app_name,
    CLIENT_EVENT_TYPE_LABEL: row.client_event_type_label,
    CLIENT_EVENT_DATE_TIME: row.client_event_date_time,
    CLIENT_VENUE_NAME: row.client_venue_name,
    CLIENT_ADDRESS_LINE1: row.client_address_line1,
    CLIENT_ADDRESS_LINE2: row.client_address_line2,
    CLIENT_PHONE: row.client_phone,
    CLIENT_GOOGLE_MAPS_DESTINATION: row.client_google_maps_destination,
    CLIENT_GOOGLE_MAPS_EMBED_URL: row.client_google_maps_embed_url,
    CLIENT_WEBSITE_URL: row.client_website_url,
    CLIENT_CONTACT_EMAIL: row.client_contact_email,
    ticketingTiers: Array.isArray(row.ticketing_tiers) ? row.ticketing_tiers : (row.ticketing_tiers ? JSON.parse(JSON.stringify(row.ticketing_tiers)) : []),
    organizerImageFileName: row.organizer_image_file_name,
    heroBackgroundImageFileName: row.hero_background_image_file_name,
    eventPosterImageFileName: row.event_poster_image_file_name,
    heroLeftImageFileName: row.hero_left_image_file_name,
    heroRightImageFileName: row.hero_right_image_file_name,
    CLIENT_ORGANIZER_IMAGE_URL: row.client_organizer_image_url,
    CLIENT_HERO_BACKGROUND_IMAGE: row.client_hero_background_image,
    CLIENT_EVENT_POSTER_IMAGE_URL: row.client_event_poster_image_url,
    CLIENT_HERO_IMAGE_LEFT: row.client_hero_image_left,
    CLIENT_HERO_IMAGE_RIGHT: row.client_hero_image_right,
  };
}

// ——— Compute generated_directory_path from client name (same as prompt-template) ———
function getGeneratedDirectoryPath(clientName) {
  const slug = (clientName || 'new-client')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return path.join(EVENTBRELLA_DIR, slug) + path.sep;
}

// ——— Process one pending row ———
async function processRow(row, buildCursorPrompt) {
  const id = row.id;
  const clientName = row.client_name || 'new-client';
  console.log('Processing request', id, '—', clientName);

  const formData = rowToFormData(row);
  let promptText;
  try {
    promptText = buildCursorPrompt(formData);
  } catch (err) {
    console.error('buildCursorPrompt failed:', err.message);
    await supabase.from('client_ticket_requests').update({
      status: 'error',
      error_message: 'buildCursorPrompt: ' + (err.message || String(err)),
      processed_at: new Date().toISOString(),
    }).eq('id', id);
    return;
  }

  const promptDir = path.join(EVENTBRELLA_DIR, '.cursor-client-requests');
  if (!fs.existsSync(promptDir)) fs.mkdirSync(promptDir, { recursive: true });
  const promptFile = path.join(promptDir, `prompt-${id}.txt`);
  fs.writeFileSync(promptFile, promptText, 'utf8');
  console.log('Wrote prompt to', promptFile);

  const generatedDir = getGeneratedDirectoryPath(row.client_name);

  // Command: PROCESS_AGENT_CMD overrides full command (use %s for prompt file path).
  // Otherwise use AGENT_PATH (full path to agent binary for cron/automation) or "agent".
  const agentPath = process.env.AGENT_PATH || 'agent';
  const agentCmdTemplate = process.env.PROCESS_AGENT_CMD || `${agentPath} chat "$(cat "%s")"`;
  const cmd = agentCmdTemplate.replace(/%s/g, promptFile);

  const execOpts = {
    encoding: 'utf8',
    shell: true,
    cwd: EVENTBRELLA_DIR,
    maxBuffer: 10 * 1024 * 1024,
  };
  // So cron doesn't need .zshrc: add common agent install dir to PATH if AGENT_PATH not set
  if (!process.env.AGENT_PATH && process.env.HOME) {
    execOpts.env = { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH || '/usr/local/bin:/usr/bin:/bin'}` };
  }

  let agentOutput = '';
  try {
    agentOutput = execSync(cmd, execOpts);
    if (agentOutput && typeof agentOutput === 'string') agentOutput = agentOutput.trim();
  } catch (err) {
    const isNotFound = /command not found|not found|ENOENT/i.test(err.message || '');
    const needsAuth = /Authentication required|CURSOR_API_KEY|agent login/i.test(err.message || '') || /Authentication required|CURSOR_API_KEY|agent login/i.test(String(err.stderr || ''));
    let errorMsg;
    if (isNotFound) {
      errorMsg = `Cursor Agent CLI not installed. Prompt saved at: ${promptFile} — install with: curl https://cursor.com/install -fsSL | bash`;
    } else if (needsAuth) {
      errorMsg = `Cursor auth required. Set CURSOR_API_KEY in EventBrella/.env (get it from https://cursor.com/dashboard → Integrations → API keys). Prompt saved at: ${promptFile}`;
    } else {
      errorMsg = 'agent chat: ' + (err.message || String(err));
    }
    const stderr = (err.stderr && String(err.stderr).trim()) || '';
    const stdout = (err.stdout && String(err.stdout).trim()) || '';
    agentOutput = [stdout, stderr].filter(Boolean).join('\n--- stderr ---\n') || errorMsg;
    console.error(isNotFound ? errorMsg : 'agent chat failed:', err.message);
    await supabase.from('client_ticket_requests').update({
      status: 'error',
      error_message: errorMsg,
      agent_output: agentOutput || null,
      processed_at: new Date().toISOString(),
    }).eq('id', id);
    if (!isNotFound) {
      try { fs.unlinkSync(promptFile); } catch (_) {}
    }
    return;
  }

  await supabase.from('client_ticket_requests').update({
    status: 'completed',
    generated_directory_path: generatedDir,
    agent_output: agentOutput || null,
    processed_at: new Date().toISOString(),
    error_message: null,
  }).eq('id', id);

  console.log('Completed request', id, '—', generatedDir);
  try { fs.unlinkSync(promptFile); } catch (_) {}
}

// ——— Main ———
async function main() {
  console.log('Fetching pending client_ticket_requests...');
  const { data: rows, error } = await supabase
    .from('client_ticket_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No pending requests.');
    return;
  }

  console.log('Found', rows.length, 'pending request(s).');
  const buildCursorPrompt = getBuildCursorPrompt();

  for (const row of rows) {
    await processRow(row, buildCursorPrompt);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
