import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const PARENT_KEY = 'SCRUM-78';

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

async function createIssue(fields) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Create issue failed: ${response.status} ${err}`);
  }
  const data = await response.json();
  return data.key;
}

const SUBTASKS = [
  { summary: 'scheduling', description: 'Scheduling.' },
  {
    summary: 'player cards integration with zortz',
    description: 'Player cards integration with Zortz.',
  },
  {
    summary: 'ticketing tiers',
    description:
      'Day Passes $20\nWeekend passes $52\nVIP pass day $60 (reserved seating)\nVIP pass weekend $152',
  },
  {
    summary: 'concession stands (pos integration)',
    description: 'Concession stands with POS integration.',
  },
  {
    summary: 'real time score updates',
    description: 'Real time score updates.',
  },
  {
    summary: 'collect tourney enrollment fees (similar ticketing tech)',
    description: 'Collect tournament enrollment fees using similar ticketing tech.',
  },
];

async function run() {
  try {
    console.log(`\n=== Add subtasks to ${PARENT_KEY} ===\n`);

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    const keys = [];
    for (const st of SUBTASKS) {
      console.log(`Creating subtask: "${st.summary}"...`);
      const key = await createIssue({
        project: { key: JIRA_PROJECT_KEY },
        summary: st.summary,
        description: textToAdf(st.description),
        issuetype: { name: 'Subtask' },
        parent: { key: PARENT_KEY },
      });
      console.log(`  ✓ ${key}`);
      keys.push(key);
      await delay(400);
    }

    console.log(`\n✓ Created ${keys.length} subtask(s) under ${PARENT_KEY}.\n`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
