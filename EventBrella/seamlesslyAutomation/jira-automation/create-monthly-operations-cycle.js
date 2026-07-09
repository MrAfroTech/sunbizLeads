import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const SOCIAL_MEDIA_ASSIGNEE = process.env.SOCIAL_MEDIA_ASSIGNEE || 'Maurice Sanders';

const DELAY_MS = 500;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
const headers = {
  Authorization: `Basic ${auth}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// --- Date helpers ---

/**
 * Epic name: "Monthly Operations Cycle - February 2026"
 */
function getEpicName(date) {
  const currentMonth = date.toLocaleString('default', { month: 'long' });
  const currentYear = date.getFullYear();
  return `Monthly Operations Cycle - ${currentMonth} ${currentYear}`;
}

/**
 * Last day of current month; due date string "YYYY-MM-DD"
 */
function getDueDateString(date) {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return lastDayOfMonth.toISOString().split('T')[0];
}

/**
 * Human-readable due date for logging, e.g. "February 28, 2026"
 */
function getDueDateDisplay(date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const month = lastDay.toLocaleString('default', { month: 'long' });
  return `${month} ${lastDay.getDate()}, ${lastDay.getFullYear()}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

// --- Jira API ---

async function searchJql(jql, maxResults = 5, fields = ['summary', 'key', 'issuetype']) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jql, maxResults, fields }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Search failed: ${response.status} ${err}`);
  }
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

async function getBoardId() {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/agile/1.0/board?projectKeyOrId=${JIRA_PROJECT_KEY}`,
    { method: 'GET', headers }
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (data.values && data.values.length > 0) return data.values[0].id;
  return null;
}

async function getActiveSprintId(boardId) {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?state=active`,
    { method: 'GET', headers }
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (data.values && data.values.length > 0) return data.values[0].id;
  return null;
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
  return response.ok;
}

// --- Main logic ---

async function run() {
  console.log('\n=== Monthly Operations Cycle Creation ===\n');

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    console.error('Missing required env: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY');
    process.exit(1);
  }

  const currentDate = new Date();
  const epicName = getEpicName(currentDate);
  const monthYearLabel = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
  const duedate = getDueDateString(currentDate);
  const dueDateDisplay = getDueDateDisplay(currentDate);

  try {
    // 1. Check for existing epic for current month
    console.log(`Checking for existing epic for ${monthYearLabel}...`);
    const escapedEpicName = epicName.replace(/"/g, '\\"');
    const epicJql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "${escapedEpicName}" ORDER BY created DESC`;
    const existingEpics = await searchJql(epicJql, 1);

    let epicKey;
    if (existingEpics.length > 0) {
      epicKey = existingEpics[0].key;
      console.log(`✓ Epic already exists: ${epicKey}\n`);
    } else {
      console.log('✓ No existing epic found\n');
      console.log(`Creating epic: "${epicName}"`);
      epicKey = await createIssue({
        project: { key: JIRA_PROJECT_KEY },
        summary: epicName,
        description: textToAdf(`Monthly operations cycle for ${monthYearLabel}.`),
        issuetype: { name: 'Epic' },
      });
      console.log(`✓ Epic created: ${epicKey}\n`);
      await delay(DELAY_MS);
    }

    // 2. Check for existing story under epic
    console.log('Checking for existing story "Social Media Engagement"...');
    const storyJql = `project = ${JIRA_PROJECT_KEY} AND type = Story AND summary = "Social Media Engagement" AND parent = ${epicKey} ORDER BY created DESC`;
    const existingStories = await searchJql(storyJql, 1);

    let storyKey;
    if (existingStories.length > 0) {
      storyKey = existingStories[0].key;
      console.log(`✓ Story already exists: ${storyKey}\n`);
    } else {
      console.log('✓ No existing story found\n');
      console.log('Creating story: "Social Media Engagement"');
      storyKey = await createIssue({
        project: { key: JIRA_PROJECT_KEY },
        summary: 'Social Media Engagement',
        description: textToAdf('Social media engagement for the month.'),
        issuetype: { name: 'Story' },
        parent: { key: epicKey },
      });
      console.log(`✓ Story created: ${storyKey}\n`);
      await delay(DELAY_MS);
    }

    // 3. Check for existing task under story
    console.log('Checking for existing task "Social Media Management"...');
    const taskJql = `project = ${JIRA_PROJECT_KEY} AND type = Task AND summary = "Social Media Management" AND parent = ${storyKey} ORDER BY created DESC`;
    const existingTasks = await searchJql(taskJql, 1);

    let taskKey;
    if (existingTasks.length > 0) {
      taskKey = existingTasks[0].key;
      console.log(`✓ Task already exists: ${taskKey}\n`);
    } else {
      console.log('✓ No existing task found\n');
      console.log('Creating task: "Social Media Management"');
      console.log('Description: "Schedule presmaster posts for month"');
      console.log(`Due Date: ${dueDateDisplay}`);
      console.log(`Assignee: ${SOCIAL_MEDIA_ASSIGNEE}\n`);

      const taskFields = {
        project: { key: JIRA_PROJECT_KEY },
        summary: 'Social Media Management',
        description: textToAdf('Schedule presmaster posts for month'),
        issuetype: { name: 'Task' },
        parent: { key: storyKey },
        duedate,
        assignee: { name: SOCIAL_MEDIA_ASSIGNEE },
      };
      taskKey = await createIssue(taskFields);
      console.log(`✓ Task created: ${taskKey}\n`);
      await delay(DELAY_MS);
    }

    // 4. Optional: add task to active sprint
    const boardId = await getBoardId();
    if (boardId && taskKey) {
      const activeSprintId = await getActiveSprintId(boardId);
      if (activeSprintId) {
        const added = await addIssuesToSprint(activeSprintId, [taskKey]);
        if (added) {
          console.log('✓ Task added to active sprint.\n');
        }
      }
    }

    console.log('=== Complete! ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    if (err.message.includes('assignee') || err.message.includes('user') || err.message.includes('Maurice')) {
      console.error('Tip: If assignee failed, ensure "Maurice Sanders" exists in Jira or set SOCIAL_MEDIA_ASSIGNEE to a valid user.');
    }
    process.exit(1);
  }
}

run();
