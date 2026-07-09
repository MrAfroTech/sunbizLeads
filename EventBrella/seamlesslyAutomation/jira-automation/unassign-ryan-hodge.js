import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const ASSIGNEE_DISPLAY_NAME = 'Ryan Hodge';

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
const headers = {
  Authorization: `Basic ${auth}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search for issues assigned to the given user (by display name).
 */
async function searchIssuesAssignedTo(displayName) {
  const escaped = displayName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  let jql = `project = ${JIRA_PROJECT_KEY} AND assignee = "${escaped}" ORDER BY updated DESC`;
  let response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jql,
      maxResults: 100,
      fields: ['summary', 'assignee', 'key', 'issuetype'],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Search failed: ${response.status} ${err}`);
  }
  let data = await response.json();
  let issues = data.issues || [];
  if (issues.length === 0) {
    jql = `project = ${JIRA_PROJECT_KEY} AND assignee is not EMPTY ORDER BY updated DESC`;
    response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jql,
        maxResults: 200,
        fields: ['summary', 'assignee', 'key', 'issuetype'],
      }),
    });
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    data = await response.json();
    issues = (data.issues || []).filter(
      (i) => (i.fields?.assignee?.displayName || i.fields?.assignee?.name || '') === displayName
    );
  }
  return issues;
}

async function unassignIssue(issueKey) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      fields: {
        assignee: null,
      },
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Unassign failed for ${issueKey}: ${response.status} ${err}`);
  }
  return true;
}

async function run() {
  try {
    console.log('\n=== Unassign Ryan Hodge from all tasks ===\n');

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    console.log(`Finding issues assigned to "${ASSIGNEE_DISPLAY_NAME}"...`);
    const issues = await searchIssuesAssignedTo(ASSIGNEE_DISPLAY_NAME);

    if (issues.length === 0) {
      console.log('No issues found assigned to Ryan Hodge.');
      console.log('\n=== Done ===\n');
      return;
    }

    console.log(`Found ${issues.length} issue(s). Unassigning...\n`);
    for (const issue of issues) {
      const key = issue.key;
      const summary = issue.fields?.summary || '(no summary)';
      await unassignIssue(key);
      console.log(`  ✓ ${key}: ${summary}`);
      await delay(400);
    }

    console.log(`\n✓ Unassigned ${issues.length} issue(s). No other data modified.\n`);
    console.log('=== Done ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
