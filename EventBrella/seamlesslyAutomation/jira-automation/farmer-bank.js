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

async function searchJql(jql, maxResults = 10, fields = ['summary', 'key', 'issuetype']) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jql, maxResults, fields }),
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

async function updateIssueParent(issueKey, parentEpicKey) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      fields: {
        parent: { key: parentEpicKey },
      },
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Update issue failed: ${response.status} ${err}`);
  }
  return true;
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
    console.log('\n=== Farmer Banks Setup ===\n');

    // 1. Create Farmer Banks Epic
    console.log('Creating Farmer Banks Epic...');
    const epicKey = await createIssue({
      project: { key: JIRA_PROJECT_KEY },
      summary: 'Farmer Banks',
      description: textToAdf('Epic for Farmer Banks platform and growth initiatives.'),
      issuetype: { name: 'Epic' },
    });
    console.log(`✓ Created epic: ${epicKey}\n`);
    await delay(400);

    // 2. Get board and create "Farmer Banks Growth" sprint
    console.log('Finding board...');
    const boardId = await getBoardId();
    console.log(`✓ Board ID: ${boardId}\n`);
    const sprintId = await findOrCreateSprint(boardId, 'Farmer Banks Growth');
    console.log();

    // 3. Find "Update farmer banks code to hide past events" and add to sprint
    console.log('Finding "Update farmer banks code to hide past events"...');
    const hidePastEventsJql = `project = ${JIRA_PROJECT_KEY} AND summary ~ "Update farmer banks code to hide past events" ORDER BY created DESC`;
    const hidePastIssues = await searchJql(hidePastEventsJql, 1);
    const ticketsForSprint = [];
    if (hidePastIssues.length > 0) {
      const key = hidePastIssues[0].key;
      ticketsForSprint.push(key);
      console.log(`✓ Found: ${key}\n`);
    } else {
      console.log('✗ Issue not found.\n');
    }

    // 4. Create new task "Market to FB 20 Groups" under Farmer Banks epic
    console.log('Creating task "Market to FB 20 Groups"...');
    const newTaskKey = await createIssue({
      project: { key: JIRA_PROJECT_KEY },
      summary: 'Market to FB 20 Groups',
      description: textToAdf('Market to Farmer Banks 20 groups.'),
      issuetype: { name: 'Task' },
      parent: { key: epicKey },
    });
    console.log(`✓ Created task: ${newTaskKey}\n`);
    ticketsForSprint.push(newTaskKey);
    await delay(400);

    // 5. Add both tickets to Farmer Banks Growth sprint
    if (ticketsForSprint.length > 0) {
      console.log('Adding tickets to Farmer Banks Growth sprint...');
      await addIssuesToSprint(sprintId, ticketsForSprint);
      console.log(`✓ Added ${ticketsForSprint.length} issue(s) to sprint.\n`);
    }

    // 6. Find Product Launch epic
    console.log('Finding Product Launch epic...');
    const productLaunchJql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "Product Launch" ORDER BY created DESC`;
    const productLaunchEpics = await searchJql(productLaunchJql, 1);
    let productLaunchEpicKey = null;
    if (productLaunchEpics.length > 0) {
      productLaunchEpicKey = productLaunchEpics[0].key;
      console.log(`✓ Found epic: ${productLaunchEpicKey}\n`);
    } else {
      console.log('✗ Product Launch epic not found. Skipping move.\n');
    }

    // 7. Find "Duplicate Farmerbanks folder..." and set parent to Product Launch epic
    if (productLaunchEpicKey) {
      console.log('Finding "Duplicate Farmerbanks folder as the template for future clients"...');
      const duplicateJql = `project = ${JIRA_PROJECT_KEY} AND summary ~ "Duplicate Farmerbanks folder" ORDER BY created DESC`;
      const duplicateIssues = await searchJql(duplicateJql, 1);
      if (duplicateIssues.length > 0) {
        const dupKey = duplicateIssues[0].key;
        await updateIssueParent(dupKey, productLaunchEpicKey);
        console.log(`✓ Moved ${dupKey} to Product Launch epic.\n`);
      } else {
        console.log('✗ Issue not found.\n');
      }
    }

    console.log('=== Complete! ===\n');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
