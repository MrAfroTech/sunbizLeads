import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function getBoardId() {
  try {
    const response = await fetch(
      `${JIRA_BASE_URL}/rest/agile/1.0/board?projectKeyOrId=${JIRA_PROJECT_KEY}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get board: ${response.status}`);
    }

    const data = await response.json();
    if (data.values && data.values.length > 0) {
      return data.values[0].id;
    }
    throw new Error('No board found for project');
  } catch (error) {
    console.error('Error getting board ID:', error.message);
    return null;
  }
}

async function findOrCreateSprint(boardId, sprintName) {
  try {
    // First, search for existing sprints
    const searchResponse = await fetch(
      `${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      const existingSprint = data.values.find(sprint =>
        sprint.name === sprintName && sprint.state !== 'closed'
      );

      if (existingSprint) {
        console.log(`Found existing sprint: "${sprintName}" (ID: ${existingSprint.id}, State: ${existingSprint.state})`);
        return existingSprint.id;
      }
    }

    // Create new sprint if not found
    console.log(`Creating new sprint: "${sprintName}"...`);
    const createResponse = await fetch(
      `${JIRA_BASE_URL}/rest/agile/1.0/sprint`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sprintName,
          originBoardId: boardId
        })
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create sprint: ${createResponse.status} ${errorText}`);
    }

    const newSprint = await createResponse.json();
    console.log(`✓ Created sprint: "${sprintName}" (ID: ${newSprint.id})`);
    return newSprint.id;
  } catch (error) {
    console.error('Error finding/creating sprint:', error.message);
    return null;
  }
}

async function getEpicKey(epicName) {
  try {
    const jql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "${epicName}" ORDER BY created DESC`;

    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          jql,
          maxResults: 1,
          fields: ['summary', 'key']
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to find epic: ${response.status}`);
    }

    const data = await response.json();
    if (data.issues && data.issues.length > 0) {
      return data.issues[0].key;
    }
    return null;
  } catch (error) {
    console.error('Error finding epic:', error.message);
    return null;
  }
}

async function getIssuesInEpic(epicKey) {
  try {
    // Get all stories and tasks that belong to this epic
    const jql = `parent = ${epicKey} OR "Epic Link" = ${epicKey} ORDER BY created DESC`;

    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          jql,
          maxResults: 100,
          fields: ['summary', 'issuetype', 'parent']
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get epic issues: ${response.status}`);
    }

    const data = await response.json();
    return data.issues;
  } catch (error) {
    console.error('Error getting epic issues:', error.message);
    return [];
  }
}

async function addIssuesToSprint(sprintId, issueKeys) {
  try {
    const response = await fetch(
      `${JIRA_BASE_URL}/rest/agile/1.0/sprint/${sprintId}/issue`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: issueKeys
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add issues to sprint: ${response.status} ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('Error adding issues to sprint:', error.message);
    return false;
  }
}

async function moveCVOTasksToOrlandoPiratesSprint() {
  try {
    console.log(`\n=== Moving CVO TASKS to "Orlando Pirates Launch" Sprint ===\n`);

    // Get board ID
    console.log('Finding board...');
    const boardId = await getBoardId();
    if (!boardId) {
      throw new Error('Could not find board');
    }
    console.log(`✓ Found board ID: ${boardId}\n`);

    // Find or create "Orlando Pirates Launch" sprint
    const sprintId = await findOrCreateSprint(boardId, 'Orlando Pirates Launch');
    if (!sprintId) {
      throw new Error('Could not find or create sprint');
    }
    console.log();

    // Find CVO TASKS epic
    console.log('Finding CVO TASKS epic...');
    const cvoEpicKey = await getEpicKey('CVO TASKS');
    if (!cvoEpicKey) {
      throw new Error('Could not find CVO TASKS epic');
    }
    console.log(`✓ Found epic: ${cvoEpicKey}\n`);

    // Get all issues in the CVO TASKS epic
    console.log('Finding all issues in CVO TASKS epic...');
    const issues = await getIssuesInEpic(cvoEpicKey);

    if (issues.length === 0) {
      console.log('No issues found in CVO TASKS epic.');
      return;
    }

    console.log(`Found ${issues.length} issue(s) in CVO TASKS epic:\n`);
    issues.forEach(issue => {
      console.log(`  - ${issue.key} (${issue.fields.issuetype.name}): ${issue.fields.summary}`);
    });

    // Add issues to sprint
    console.log(`\nAdding issues to "Orlando Pirates Launch" sprint...`);
    const issueKeys = issues.map(issue => issue.key);
    const success = await addIssuesToSprint(sprintId, issueKeys);

    if (success) {
      console.log(`✓ Successfully moved ${issues.length} issue(s) to "Orlando Pirates Launch" sprint\n`);
    } else {
      console.log('✗ Failed to add issues to sprint\n');
      return;
    }

    console.log('=== Complete! ===\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

moveCVOTasksToOrlandoPiratesSprint();
