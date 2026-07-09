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

async function getBoardId() {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/agile/1.0/board?projectKeyOrId=${JIRA_PROJECT_KEY}`,
    { method: 'GET', headers }
  );
  if (!response.ok) throw new Error(`Failed to get board: ${response.status}`);
  const data = await response.json();
  if (data.values && data.values.length > 0) return data.values[0].id;
  throw new Error('No board found for project');
}

async function findOrCreateSprint(boardId, sprintName) {
  const searchRes = await fetch(
    `${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint`,
    { method: 'GET', headers }
  );
  if (searchRes.ok) {
    const data = await searchRes.json();
    const existing = (data.values || []).find(
      (s) => s.name === sprintName && s.state !== 'closed'
    );
    if (existing) {
      console.log(`Found existing sprint: "${sprintName}" (ID: ${existing.id})`);
      return existing.id;
    }
  }
  console.log(`Creating new sprint: "${sprintName}"...`);
  const createRes = await fetch(`${JIRA_BASE_URL}/rest/agile/1.0/sprint`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: sprintName, originBoardId: boardId }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create sprint: ${createRes.status} ${err}`);
  }
  const newSprint = await createRes.json();
  console.log(`✓ Created sprint: "${sprintName}" (ID: ${newSprint.id})`);
  return newSprint.id;
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

async function addIssuesToSprint(sprintId, issueKeys) {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/agile/1.0/sprint/${sprintId}/issue`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ issues: issueKeys }),
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Add to sprint failed: ${response.status} ${err}`);
  }
  return true;
}

const TICKET_2_DESCRIPTION =
  'From Supabase: To save on cloud resources I just did a scan of all our projects and identified those which have not seen sufficient activity for more than 7 days.';

async function run() {
  try {
    console.log('\n=== Add Technical Debt sprint and 2 CTO tasks ===\n');

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    console.log('Finding board...');
    const boardId = await getBoardId();
    console.log(`✓ Board ID: ${boardId}\n`);

    console.log('Finding or creating "Technical Debt" sprint...');
    const sprintId = await findOrCreateSprint(boardId, 'Technical Debt');
    console.log();

    const issueKeys = [];

    console.log('Creating ticket 1: fix supabase vulnerability...');
    const key1 = await createIssue({
      project: { key: JIRA_PROJECT_KEY },
      summary: 'fix supabase vulnerability',
      description: textToAdf('Fix Supabase vulnerability.'),
      issuetype: { name: 'Task' },
      labels: ['CTO', 'Technical-Debt'],
    });
    console.log(`✓ Created: ${key1}`);
    issueKeys.push(key1);
    await delay(400);

    console.log('Creating ticket 2: workaround for supabase going to sleep...');
    const key2 = await createIssue({
      project: { key: JIRA_PROJECT_KEY },
      summary: 'workaround for supabase going to sleep',
      description: textToAdf(TICKET_2_DESCRIPTION),
      issuetype: { name: 'Task' },
      labels: ['CTO', 'Technical-Debt'],
    });
    console.log(`✓ Created: ${key2}`);
    issueKeys.push(key2);
    await delay(400);

    console.log('\nAdding tickets to Technical Debt sprint...');
    await addIssuesToSprint(sprintId, issueKeys);
    console.log(`✓ Added ${issueKeys.length} ticket(s) to Technical Debt sprint.\n`);

    console.log('=== Complete! ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
