import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function deleteRecentIssues(hoursAgo = 1) {
  try {
    console.log(`Searching for issues created in the last ${hoursAgo} hour(s)...`);

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
          fields: ['summary', 'issuetype', 'created'],
        }),
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Search failed: ${searchResponse.status} ${errorText}`);
    }

    const searchData = await searchResponse.json();
    const issues = searchData.issues;

    if (issues.length === 0) {
      console.log('No issues found to delete.');
      return;
    }

    console.log(`Found ${issues.length} issue(s) to delete:`);
    issues.forEach(issue => {
      console.log(`- ${issue.key}: ${issue.fields.summary}`);
    });

    // Delete each issue
    for (const issue of issues) {
      console.log(`Deleting ${issue.key}...`);

      const deleteResponse = await fetch(
        `${JIRA_BASE_URL}/rest/api/3/issue/${issue.key}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (deleteResponse.ok) {
        console.log(`✓ Deleted ${issue.key}`);
      } else {
        const errorText = await deleteResponse.text();
        console.error(`✗ Failed to delete ${issue.key}: ${deleteResponse.status} ${errorText}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\nDeletion complete!');
  } catch (error) {
    console.error('Error deleting issues:', error.message);
  }
}

// Get hours from command line argument, default to 1 hour
const hoursAgo = process.argv[2] ? parseInt(process.argv[2]) : 1;
deleteRecentIssues(hoursAgo);
