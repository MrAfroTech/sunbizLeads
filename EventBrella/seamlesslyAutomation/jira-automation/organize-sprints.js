import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Tickets to move to Marketing Launch
const MARKETING_LAUNCH_TICKETS = [
  "Complete speaker ai agent",
  "Adjacent League/Teams Marketing Strategy",
  "Lead magnet and sales funnel for different niches Event planner marketing strategy",
  "Create video for home page",
  "1MC Presentation complete",
  "LLC Reels Conversion for press master ig posts"
];

// Tickets to move to Orlando Pirates Launch
const ORLANDO_PIRATES_TICKETS = [
  "Add specific mobile app download options (download from Google Store) for mobile users",
  "Add QR code options for specific discounts (e.g., season ticket holders), Cash App, and Venmo to the wallet feature for loading funds",
  "Build community feed and Add filters to the community feed to ensure appropriate content",
  "Prepare a limited-time question poll on the app for trivia activation during home games",
  "Add a full-width, half-height button for the game day program PDF link above the four quick action buttons on the quick actions page",
  "Update app home page for game days so that get tickets isn't the main option",
  "RSS feed for live stream of game on home page",
  "Update site with 2026 schedule"
];

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
        console.log(`Found existing sprint: "${sprintName}" (ID: ${existingSprint.id})`);
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

async function findIssuesBySummary(summaries) {
  try {
    const issueKeys = [];

    for (const summary of summaries) {
      // Escape special characters and search for the summary
      const escapedSummary = summary.replace(/"/g, '\\"');
      const jql = `project = ${JIRA_PROJECT_KEY} AND summary ~ "${escapedSummary}" ORDER BY created DESC`;

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
            fields: ['summary', 'key', 'issuetype']
          })
        }
      );

      if (!response.ok) {
        console.log(`  ✗ Failed to find: "${summary}"`);
        continue;
      }

      const data = await response.json();
      if (data.issues && data.issues.length > 0) {
        const issue = data.issues[0];
        issueKeys.push({
          key: issue.key,
          summary: issue.fields.summary,
          type: issue.fields.issuetype.name
        });
        console.log(`  ✓ Found: ${issue.key} - ${issue.fields.summary}`);
      } else {
        console.log(`  ✗ Not found: "${summary}"`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return issueKeys;
  } catch (error) {
    console.error('Error finding issues:', error.message);
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

async function organizeTicketsIntoSprints() {
  try {
    console.log(`\n=== Organizing Tickets into Sprints ===\n`);

    // Get board ID
    console.log('Finding board...');
    const boardId = await getBoardId();
    if (!boardId) {
      throw new Error('Could not find board');
    }
    console.log(`✓ Found board ID: ${boardId}\n`);

    // ===== MARKETING LAUNCH SPRINT =====
    console.log('--- Marketing Launch Sprint ---\n');

    const marketingSprintId = await findOrCreateSprint(boardId, 'Marketing Launch');
    if (!marketingSprintId) {
      throw new Error('Could not create Marketing Launch sprint');
    }

    console.log('\nFinding Marketing Launch tickets...');
    const marketingIssues = await findIssuesBySummary(MARKETING_LAUNCH_TICKETS);

    if (marketingIssues.length > 0) {
      console.log(`\nAdding ${marketingIssues.length} issues to Marketing Launch sprint...`);
      const marketingKeys = marketingIssues.map(i => i.key);
      const marketingSuccess = await addIssuesToSprint(marketingSprintId, marketingKeys);

      if (marketingSuccess) {
        console.log(`✓ Successfully added ${marketingIssues.length} issues to Marketing Launch\n`);
      } else {
        console.log('✗ Failed to add issues to Marketing Launch\n');
      }
    } else {
      console.log('No Marketing Launch tickets found\n');
    }

    // ===== ORLANDO PIRATES LAUNCH SPRINT =====
    console.log('--- Orlando Pirates Launch Sprint ---\n');

    const orlandoSprintId = await findOrCreateSprint(boardId, 'Orlando Pirates Launch');
    if (!orlandoSprintId) {
      throw new Error('Could not create Orlando Pirates Launch sprint');
    }

    console.log('\nFinding Orlando Pirates Launch tickets...');
    const orlandoIssues = await findIssuesBySummary(ORLANDO_PIRATES_TICKETS);

    if (orlandoIssues.length > 0) {
      console.log(`\nAdding ${orlandoIssues.length} issues to Orlando Pirates Launch sprint...`);
      const orlandoKeys = orlandoIssues.map(i => i.key);
      const orlandoSuccess = await addIssuesToSprint(orlandoSprintId, orlandoKeys);

      if (orlandoSuccess) {
        console.log(`✓ Successfully added ${orlandoIssues.length} issues to Orlando Pirates Launch\n`);
      } else {
        console.log('✗ Failed to add issues to Orlando Pirates Launch\n');
      }
    } else {
      console.log('No Orlando Pirates Launch tickets found\n');
    }

    console.log('=== Complete! ===');
    console.log(`\nSummary:`);
    console.log(`- Marketing Launch: ${marketingIssues.length} tickets`);
    console.log(`- Orlando Pirates Launch: ${orlandoIssues.length} tickets\n`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

organizeTicketsIntoSprints();
