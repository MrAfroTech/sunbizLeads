import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
const headers = {
  Authorization: `Basic ${auth}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function textToAdf(text) {
  if (!text || typeof text !== 'string') {
    return { version: 1, type: 'doc', content: [] };
  }
  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: text.trim() }],
      },
    ],
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchJql(jql, maxResults = 3) {
  const r = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jql, maxResults, fields: ['summary', 'key'] }),
  });
  if (!r.ok) throw new Error(`Search: ${r.status}`);
  const d = await r.json();
  return d.issues || [];
}

async function createIssue(fields) {
  const r = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error(`Create: ${r.status} ${await r.text()}`);
  const d = await r.json();
  return d.key;
}

const EPIC_NAME = "It'll Happen Boys Summer Showcase";
const TASKS = [
  { summary: 'registration splash page for teams', description: 'Registration splash page for teams.' },
  { summary: 'ticketing splash page for guests', description: 'Ticketing splash page for guests.' },
];

async function run() {
  try {
    console.log('\n=== Add tasks to It\'ll Happen Boys Summer Showcase epic ===\n');

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    const epicJql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "${EPIC_NAME.replace(/"/g, '\\"')}" ORDER BY created DESC`;
    const epics = await searchJql(epicJql, 1);
    if (!epics.length) {
      console.error(`Epic "${EPIC_NAME}" not found.`);
      process.exit(1);
    }
    const epicKey = epics[0].key;
    console.log(`✓ Found epic: ${epicKey}\n`);

    const keys = [];
    for (const task of TASKS) {
      console.log(`Creating task: "${task.summary}"...`);
      const key = await createIssue({
        project: { key: JIRA_PROJECT_KEY },
        summary: task.summary,
        description: textToAdf(task.description),
        issuetype: { name: 'Task' },
        parent: { key: epicKey },
      });
      console.log(`  ✓ ${key}`);
      keys.push(key);
      await delay(400);
    }

    console.log(`\n✓ Created ${keys.length} task(s) under ${epicKey}.\n`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
