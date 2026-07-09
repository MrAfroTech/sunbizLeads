import 'dotenv/config';
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const PARENT_KEY = 'SCRUM-78';
const OUTPUT_FILE = join(__dirname, 'SCRUM-78-subtasks.md');

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
const headers = {
  Authorization: `Basic ${auth}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/**
 * Extract plain text from Jira ADF description (recursive).
 */
function adfToPlainText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(adfToPlainText).join('');
  }
  if (node.content) return adfToPlainText(node.content);
  return '';
}

async function searchSubtasks(parentKey) {
  const jql = `parent = ${parentKey} ORDER BY created ASC`;
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jql,
      maxResults: 50,
      fields: ['summary', 'description', 'key', 'created'],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Search failed: ${response.status} ${err}`);
  }
  const data = await response.json();
  return data.issues || [];
}

async function getParentSummary(parentKey) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${parentKey}?fields=summary`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) return parentKey;
  const data = await response.json();
  return data.fields?.summary || parentKey;
}

async function run() {
  try {
    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      console.error('Missing JIRA_BASE_URL, JIRA_EMAIL, or JIRA_API_TOKEN in .env');
      process.exit(1);
    }

    const parentTitle = await getParentSummary(PARENT_KEY);
    const issues = await searchSubtasks(PARENT_KEY);

    const lines = [
      `# Subtasks of ${PARENT_KEY}: ${parentTitle}`,
      '',
      `Exported on ${new Date().toISOString().slice(0, 10)}. Total: ${issues.length} subtask(s).`,
      '',
      '---',
      '',
    ];

    issues.forEach((issue, i) => {
      const summary = issue.fields?.summary ?? '';
      const desc = issue.fields?.description;
      const plainDesc = desc ? adfToPlainText(desc) : '';
      lines.push(`## ${i + 1}. ${issue.key}: ${summary}`);
      lines.push('');
      if (plainDesc.trim()) {
        lines.push(plainDesc.trim());
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    });

    writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');
    console.log(`✓ Wrote ${issues.length} subtask(s) to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
