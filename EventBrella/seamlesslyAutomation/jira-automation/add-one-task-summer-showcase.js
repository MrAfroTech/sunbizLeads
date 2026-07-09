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
    content: [{ type: 'paragraph', content: [{ type: 'text', text: text.trim() }] }],
  };
}

async function getBoardId() {
  const r = await fetch(`${JIRA_BASE_URL}/rest/agile/1.0/board?projectKeyOrId=${JIRA_PROJECT_KEY}`, { method: 'GET', headers });
  if (!r.ok) throw new Error(`Board: ${r.status}`);
  const d = await r.json();
  if (d.values?.length > 0) return d.values[0].id;
  throw new Error('No board');
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

async function findSprint(boardId, name) {
  const r = await fetch(`${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint`, { method: 'GET', headers });
  if (!r.ok) return null;
  const d = await r.json();
  const s = (d.values || []).find((x) => x.name === name && x.state !== 'closed');
  return s ? s.id : null;
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

async function addToSprint(sprintId, issueKeys) {
  const r = await fetch(`${JIRA_BASE_URL}/rest/agile/1.0/sprint/${sprintId}/issue`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ issues: issueKeys }),
  });
  if (!r.ok) throw new Error(`Add to sprint: ${r.status}`);
  return true;
}

const EPIC_NAME = "It'll Happen Boys Summer Showcase";
const SPRINT_NAME = 'New Client Onboarding';
const TASK_SUMMARY = 'obtain list of updated client requests';

async function run() {
  const boardId = await getBoardId();
  const epicJql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "${EPIC_NAME.replace(/"/g, '\\"')}" ORDER BY created DESC`;
  const epics = await searchJql(epicJql, 1);
  if (!epics.length) throw new Error(`Epic "${EPIC_NAME}" not found`);
  const epicKey = epics[0].key;

  const sprintId = await findSprint(boardId, SPRINT_NAME);
  if (!sprintId) throw new Error(`Sprint "${SPRINT_NAME}" not found`);

  const taskKey = await createIssue({
    project: { key: JIRA_PROJECT_KEY },
    summary: TASK_SUMMARY,
    description: textToAdf('Obtain list of updated client requests.'),
    issuetype: { name: 'Task' },
    parent: { key: epicKey },
  });
  await addToSprint(sprintId, [taskKey]);
  console.log(`✓ Created ${taskKey} and added to ${SPRINT_NAME} sprint.`);
}

run().catch((e) => { console.error(e.message); process.exit(1); });
