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

async function searchJql(jql, maxResults = 1) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jql, maxResults, fields: ['summary', 'key'] }),
  });
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  const data = await response.json();
  return data.issues || [];
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

async function run() {
  try {
    console.log('\n=== Add task to Product Launch epic ===\n');

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    const epicName = 'Product Launch';
    const taskSummary = 'test task';

    console.log(`Finding epic "${epicName}"...`);
    let jql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "Product Launch" ORDER BY created DESC`;
    let epics = await searchJql(jql, 5);
    if (epics.length === 0) {
      jql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "Launch" ORDER BY created DESC`;
      epics = await searchJql(jql, 5);
    }
    if (epics.length === 0) {
      jql = `project = ${JIRA_PROJECT_KEY} AND type = Epic ORDER BY created DESC`;
      epics = await searchJql(jql, 10);
      if (epics.length > 0) {
        console.log('Available epics (recent):', epics.map((e) => `${e.key}: ${e.fields.summary}`).join(', '));
      }
      console.error(`\nEpic "${epicName}" not found in project ${JIRA_PROJECT_KEY}.`);
      process.exit(1);
    }

    const epicKey = epics[0].key;
    console.log(`✓ Found epic: ${epicKey}\n`);

    console.log(`Creating task "${taskSummary}"...`);
    const taskKey = await createIssue({
      project: { key: JIRA_PROJECT_KEY },
      summary: taskSummary,
      description: textToAdf(''),
      issuetype: { name: 'Task' },
      parent: { key: epicKey },
    });
    console.log(`✓ Created task: ${taskKey}\n`);
    console.log('=== Complete! ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
