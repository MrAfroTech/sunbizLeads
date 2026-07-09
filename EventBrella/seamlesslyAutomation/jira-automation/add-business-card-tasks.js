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

async function createIssue(summary, description) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        project: { key: JIRA_PROJECT_KEY },
        summary,
        description: textToAdf(description),
        issuetype: { name: 'Task' },
      },
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Create issue failed: ${response.status} ${err}`);
  }
  const data = await response.json();
  return data.key;
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

async function findSprintByName(boardId, sprintName) {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint`,
    { method: 'GET', headers }
  );
  if (!response.ok) return null;
  const data = await response.json();
  const sprint = (data.values || []).find(
    (s) => s.name === sprintName && s.state !== 'closed'
  );
  return sprint ? sprint.id : null;
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

const TASKS = [
  {
    summary: 'Seamlessly Business Cards for Maurie Sanders',
    description: 'Order/create Seamlessly business cards for Maurie Sanders.',
  },
  {
    summary: 'Seamlessly Business Cards for Ryan Hodge',
    description: 'Order/create Seamlessly business cards for Ryan Hodge.',
  },
];

async function run() {
  try {
    console.log('\n=== Add Business Card Tasks to Product Launch Sprint ===\n');

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    const keys = [];
    for (const task of TASKS) {
      console.log(`Creating task: "${task.summary}"`);
      const key = await createIssue(task.summary, task.description);
      console.log(`✓ Created: ${key}`);
      keys.push(key);
      await delay(400);
    }

    console.log('\nFinding Product Launch sprint...');
    const boardId = await getBoardId();
    const sprintId = await findSprintByName(boardId, 'Product Launch');
    if (!sprintId) {
      console.log('✗ Product Launch sprint not found. Tasks created but not in sprint.\n');
      return;
    }

    console.log('Adding tasks to Product Launch sprint...');
    await addIssuesToSprint(sprintId, keys);
    console.log(`✓ Added ${keys.length} task(s) to Product Launch sprint.\n`);
    console.log('=== Complete! ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
