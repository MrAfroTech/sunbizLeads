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

async function searchJql(jql, maxResults = 5) {
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

const TASK_SUMMARY = 'build out user ticketing form';
const TASK_DESCRIPTION =
  'launching a user facing form so that they can create their own landing pages for their events. allowing for quicker updates';
const DUE_DATE = '2025-02-16'; // 2/16
const EPIC_SEARCH_TERMS = ['Market Launch', 'Marketing Launch', 'Marketing', 'Launch'];

async function run() {
  try {
    console.log('\n=== Add task under Market Launch epic ===\n');

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    let epics = [];
    for (const term of EPIC_SEARCH_TERMS) {
      const jql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "${term.replace(/"/g, '\\"')}" ORDER BY created DESC`;
      epics = await searchJql(jql, 5);
      if (epics.length > 0) break;
    }

    let epicKey;
    if (epics.length > 0) {
      epicKey = epics[0].key;
      console.log(`✓ Found epic: ${epicKey} (${epics[0].fields.summary})\n`);
    } else {
      console.log('Market Launch epic not found. Creating epic "Market Launch"...');
      epicKey = await createIssue({
        project: { key: JIRA_PROJECT_KEY },
        summary: 'Market Launch',
        description: textToAdf('Epic for market launch and marketing initiatives.'),
        issuetype: { name: 'Epic' },
      });
      console.log(`✓ Created epic: ${epicKey}\n`);
    }

    console.log(`Creating task: "${TASK_SUMMARY}"...`);
    const taskKey = await createIssue({
      project: { key: JIRA_PROJECT_KEY },
      summary: TASK_SUMMARY,
      description: textToAdf(TASK_DESCRIPTION),
      issuetype: { name: 'Task' },
      parent: { key: epicKey },
      duedate: DUE_DATE,
    });
    console.log(`✓ Created: ${taskKey} (due ${DUE_DATE})\n`);
    console.log('=== Complete! ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
