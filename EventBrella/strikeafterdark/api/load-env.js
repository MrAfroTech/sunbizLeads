// Load local .env / config.env into process.env (no-op on hosts that already inject env)
const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Do not overwrite env already provided by the host (e.g. Vercel dashboard).
    // Also skip blank values so empty placeholders in config.env cannot wipe real keys.
    if (process.env[key] === undefined && value !== '') {
      process.env[key] = value;
    }
  }
}

const root = path.join(__dirname, '..');
parseEnvFile(path.join(root, '.env'));
parseEnvFile(path.join(root, 'config', 'config.env'));

module.exports = {};
