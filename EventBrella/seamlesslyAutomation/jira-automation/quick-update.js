import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

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
    const existing = data.values.find(
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

async function findIssueBySummary(summary) {
  const jql = `project = ${JIRA_PROJECT_KEY} AND summary ~ "Eventbrella Marketing Implementation" ORDER BY created DESC`;
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jql,
      maxResults: 1,
      fields: ['summary', 'key'],
    }),
  });
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  const data = await response.json();
  return data.issues && data.issues.length > 0 ? data.issues[0] : null;
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

async function run() {
  try {
    console.log('\n=== Add "Eventbrella Marketing Implementation" to Product Launch ===\n');

    console.log('Finding board...');
    const boardId = await getBoardId();
    console.log(`✓ Board ID: ${boardId}\n`);

    const sprintId = await findOrCreateSprint(boardId, 'Product Launch');
    console.log();

    console.log('Finding ticket "Eventbrella Marketing Implementation"...');
    const issue = await findIssueBySummary('Eventbrella Marketing Implementation');
    if (!issue) {
      console.log('✗ Ticket not found.\n');
      return;
    }
    console.log(`✓ Found: ${issue.key}\n`);

    console.log('Adding to Product Launch sprint...');
    await addIssuesToSprint(sprintId, [issue.key]);
    console.log('✓ Done. Ticket added to Product Launch sprint.\n');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
