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

async function startSprint(sprintId) {
  try {
    const response = await fetch(
      `${JIRA_BASE_URL}/rest/agile/1.0/sprint/${sprintId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: 'active'
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // Don't throw error if sprint is already active
      if (!errorText.includes('already')) {
        throw new Error(`Failed to start sprint: ${response.status} ${errorText}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error starting sprint:', error.message);
    return false;
  }
}

async function addToProductLaunchSprint(hoursAgo = 24, autoStart = false) {
  try {
    console.log(`\n=== Adding Issues to "Product Launch" Sprint ===\n`);

    // Get board ID
    console.log('Finding board...');
    const boardId = await getBoardId();
    if (!boardId) {
      throw new Error('Could not find board');
    }
    console.log(`✓ Found board ID: ${boardId}\n`);

    // Find or create sprint
    const sprintId = await findOrCreateSprint(boardId, 'Product Launch');
    if (!sprintId) {
      throw new Error('Could not find or create sprint');
    }
    console.log();

    // Search for recently created issues (excluding epics) - use /rest/api/3/search/jql (old /search is removed)
    console.log(`Searching for issues created in the last ${hoursAgo} hour(s)...`);
    const jql = `project = ${JIRA_PROJECT_KEY} AND created >= -${hoursAgo}h AND type != Epic ORDER BY created DESC`;

    const searchResponse = await fetch(
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
          fields: ['summary', 'issuetype']
        })
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Search failed: ${searchResponse.status} ${errorText}`);
    }

    const searchData = await searchResponse.json();
    const issues = searchData.issues;

    if (issues.length === 0) {
      console.log('No issues found to add to sprint.');
      return;
    }

    console.log(`Found ${issues.length} issue(s):\n`);
    issues.forEach(issue => {
      console.log(`  - ${issue.key}: ${issue.fields.summary}`);
    });

    // Add issues to sprint
    console.log(`\nAdding issues to sprint "${sprintId}"...`);
    const issueKeys = issues.map(issue => issue.key);
    const success = await addIssuesToSprint(sprintId, issueKeys);

    if (success) {
      console.log(`✓ Successfully added ${issues.length} issue(s) to "Product Launch" sprint\n`);
    } else {
      console.log('✗ Failed to add issues to sprint\n');
      return;
    }

    // Optionally start the sprint
    if (autoStart) {
      console.log('Starting sprint...');
      const started = await startSprint(sprintId);
      if (started) {
        console.log('✓ Sprint started!\n');
      }
    } else {
      console.log('Sprint created but not started. Start it manually in Jira or run with --start flag.\n');
    }

    console.log('=== Complete! ===');
    console.log('Your issues should now appear on the board.\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const hoursAgo = args[0] && !args[0].startsWith('--') ? parseInt(args[0]) : 24;
const autoStart = args.includes('--start');

addToProductLaunchSprint(hoursAgo, autoStart);
