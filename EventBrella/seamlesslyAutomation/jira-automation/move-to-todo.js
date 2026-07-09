import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function getTransitionId(issueKey, targetStatus) {
  try {
    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get transitions for ${issueKey}`);
    }

    const data = await response.json();
    const transition = data.transitions.find(t =>
      t.name.toLowerCase() === targetStatus.toLowerCase() ||
      t.to.name.toLowerCase() === targetStatus.toLowerCase()
    );

    return transition ? transition.id : null;
  } catch (error) {
    console.error(`Error getting transitions for ${issueKey}:`, error.message);
    return null;
  }
}

async function transitionIssue(issueKey, transitionId) {
  try {
    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transition: {
            id: transitionId
          }
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error(`Error transitioning ${issueKey}:`, error.message);
    return false;
  }
}

async function moveAllToToDo(hoursAgo = 24) {
  try {
    console.log(`Finding issues created in the last ${hoursAgo} hour(s)...`);

    // Search for recently created issues (use /rest/api/3/search/jql - old /search is removed)
    const jql = `project = ${JIRA_PROJECT_KEY} AND created >= -${hoursAgo}h ORDER BY created DESC`;

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
          fields: ['summary', 'issuetype', 'status']
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
      console.log('No issues found.');
      return;
    }

    console.log(`Found ${issues.length} issue(s). Moving to TO DO...\n`);

    for (const issue of issues) {
      const currentStatus = issue.fields.status.name;
      console.log(`${issue.key} (${issue.fields.issuetype.name}): ${issue.fields.summary}`);
      console.log(`  Current status: ${currentStatus}`);

      if (currentStatus.toLowerCase() === 'to do') {
        console.log(`  ✓ Already in TO DO\n`);
        continue;
      }

      // Get the transition ID for "To Do"
      const transitionId = await getTransitionId(issue.key, 'To Do');

      if (!transitionId) {
        console.log(`  ✗ Could not find "To Do" transition\n`);
        continue;
      }

      // Perform the transition
      const success = await transitionIssue(issue.key, transitionId);

      if (success) {
        console.log(`  ✓ Moved to TO DO\n`);
      } else {
        console.log(`  ✗ Failed to move to TO DO\n`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('Status update complete!');
  } catch (error) {
    console.error('Error updating statuses:', error.message);
  }
}

// Get hours from command line argument, default to 24 hours
const hoursAgo = process.argv[2] ? parseInt(process.argv[2]) : 24;
moveAllToToDo(hoursAgo);
