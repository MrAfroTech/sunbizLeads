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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * e.g. "January 2026"
 */
function getMonthYearLabel(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  return `${MONTH_NAMES[month]} ${year}`;
}

/**
 * Last calendar day of the given date's month
 */
function getLastDayOfMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0);
}

/**
 * Trigger date: 14 days before end of current month (date only, no time)
 */
function getTriggerDate(date) {
  const lastDay = getLastDayOfMonth(date);
  const trigger = new Date(lastDay);
  trigger.setDate(lastDay.getDate() - 14);
  return new Date(trigger.getFullYear(), trigger.getMonth(), trigger.getDate());
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

/**
 * Today in local date only (no time)
 */
function getTodayDate() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
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
  console.log('\n=== Monthly Social Media Task Creation ===\n');

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    console.error('Missing required env: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY');
    process.exit(1);
  }

  const today = getTodayDate();
  const triggerDate = getTriggerDate(today);
  const isTrigger = isSameDay(today, triggerDate);

  console.log(`Date Check: ${getMonthYearLabel(today)} ${today.getDate()}, ${today.getFullYear()} (Trigger date: ${isTrigger ? '✓' : 'No'})\n`);

  if (!isTrigger) {
    console.log('Not trigger date, skipping. (Trigger is 14 days before end of month.)\n');
    process.exit(0);
  }

  const monthYearLabel = getMonthYearLabel(today);
  const epicName = `Monthly Operations Cycle - ${monthYearLabel}`;
  const lastDay = getLastDayOfMonth(today);
  const duedate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  try {
    // 1. Check for existing epic
    console.log('Checking for existing epic...');
    const epicJql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "${epicName.replace(/"/g, '\\"')}" ORDER BY created DESC`;
    const existingEpics = await searchJql(epicJql, 1);

    let epicKey;
    if (existingEpics.length > 0) {
      epicKey = existingEpics[0].key;
      console.log(`✓ Existing epic found for ${monthYearLabel}: ${epicKey}\n`);
    } else {
      console.log(`✓ No existing epic found for ${monthYearLabel}\n`);
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
      console.log(`✓ Existing story found: ${storyKey}\n`);
    } else {
      console.log(`✓ No existing story found.\n`);
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
      console.log(`✓ Existing task found: ${taskKey}\n`);
    } else {
      console.log(`✓ No existing task found.\n`);
      console.log('Creating task: "Social Media Management"');
      console.log('Description: "Schedule presmaster posts for month"');
      console.log(`Due Date: ${getMonthYearLabel(lastDay)} ${lastDay.getDate()}, ${lastDay.getFullYear()}`);
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
      // If assignee is not set in Jira, your instance may require assignee: { accountId: "..." } instead of name
      taskKey = await createIssue(taskFields);
      console.log(`✓ Task created: ${taskKey}\n`);
      await delay(DELAY_MS);
    }

    // 4. Optional: add task to active sprint
    const boardId = await getBoardId();
    if (boardId) {
      const activeSprintId = await getActiveSprintId(boardId);
      if (activeSprintId && taskKey) {
        const added = await addIssuesToSprint(activeSprintId, [taskKey]);
        if (added) {
          console.log('✓ Task added to active sprint.\n');
        }
      }
    }

    console.log('=== Complete! ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
