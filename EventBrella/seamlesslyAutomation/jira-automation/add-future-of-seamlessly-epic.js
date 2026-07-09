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
      { type: 'paragraph', content: [{ type: 'text', text: text.trim() }] },
    ],
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createIssue(fields) {
  const r = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error(`Create: ${r.status} ${await r.text()}`);
  const d = await r.json();
  return d.key;
}

const EPIC_SUMMARY = 'The Future of Seamlessly';
const EPIC_DESCRIPTION = 'Epic for the future of Seamlessly: demand forecasting, queue/wait time, customer retention, staff retention, and market intelligence agents.';

const STORIES = [
  {
    summary: 'Demand Forecasting Agent',
    description: 'Predict busy periods so venues can staff correctly and prepare inventory accurately.',
    subtasks: [
      'Define data inputs — order volume history, event calendar, weather, and time-of-day patterns',
      'Build forecasting model logic that outputs predicted demand by hour and day',
      'Create alert system that notifies venue managers of upcoming high-demand windows',
      'Integrate forecast output with scheduling module to suggest staffing levels',
      'Connect forecast output with inventory module to surface restock recommendations',
    ],
  },
  {
    summary: 'Dynamic Queue & Wait Time Agent',
    description: 'Monitor order volume in real time and surface alerts when wait times approach the 8-minute threshold.',
    subtasks: [
      'Define real-time data inputs — active orders, fulfillment speed, and station capacity',
      'Build logic that calculates live wait time per vendor or station',
      'Create threshold trigger that fires an alert when wait time approaches 8 minutes',
      'Build guest-facing output that surfaces shorter queue options or redirects',
      'Build manager-facing dashboard widget showing live queue status across all stations',
    ],
  },
  {
    summary: 'Customer Retention Agent',
    description: 'Analyze order history across the Seamlessly network and surface personalized recommendations to bring guests back.',
    subtasks: [
      'Define data inputs — guest order history, frequency, preferences, and spend per visit',
      'Build segmentation logic that groups guests by behavior patterns',
      'Create personalized recommendation engine that surfaces relevant venues and items per guest',
      'Build trigger logic for re-engagement — lapsed guests, post-event follow-up, and milestone moments',
      'Connect recommendations output to guest-facing notification and messaging layer',
    ],
  },
  {
    summary: 'Staff Retention Intelligence Agent',
    description: 'Track workload patterns and flag burnout signals before staff resign.',
    subtasks: [
      'Define data inputs — shift length, order volume per staff member, complaint frequency, and overtime hours',
      'Build scoring logic that calculates a burnout risk score per employee',
      'Create alert system that flags high-risk employees to the manager before the 59-day turnover window',
      'Build intervention recommendation output — schedule adjustment, role change, or recognition trigger',
      'Track retention outcomes over time and feed results back into the scoring model',
    ],
  },
  {
    summary: 'Competitor & Market Intelligence Agent',
    description: 'Keep venue owners informed about new openings, local trends, and pricing shifts in their market.',
    subtasks: [
      'Define data inputs — local business registrations, review platforms, social signals, and pricing data',
      'Build monitoring logic that detects new hospitality openings within a defined radius',
      'Create trend detection layer that surfaces shifts in guest preferences and popular categories',
      'Build pricing intelligence output that benchmarks client pricing against local competitors',
      'Deliver a weekly market intelligence digest to venue owners inside the Seamlessly platform',
    ],
  },
];

async function run() {
  try {
    console.log('\n=== The Future of Seamlessly: Epic + 5 Stories × 5 Subtasks ===\n');

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    console.log('Creating epic: "' + EPIC_SUMMARY + '"...');
    const epicKey = await createIssue({
      project: { key: JIRA_PROJECT_KEY },
      summary: EPIC_SUMMARY,
      description: textToAdf(EPIC_DESCRIPTION),
      issuetype: { name: 'Epic' },
    });
    console.log('  ✓ ' + epicKey + '\n');
    await delay(500);

    for (let s = 0; s < STORIES.length; s++) {
      const story = STORIES[s];
      console.log('Story ' + (s + 1) + ': ' + story.summary);
      const storyKey = await createIssue({
        project: { key: JIRA_PROJECT_KEY },
        summary: story.summary,
        description: textToAdf(story.description),
        issuetype: { name: 'Story' },
        parent: { key: epicKey },
      });
      console.log('  ✓ ' + storyKey);
      await delay(400);

      for (let i = 0; i < story.subtasks.length; i++) {
        const subSummary = story.subtasks[i];
        const subKey = await createIssue({
          project: { key: JIRA_PROJECT_KEY },
          summary: subSummary,
          description: textToAdf(subSummary),
          issuetype: { name: 'Subtask' },
          parent: { key: storyKey },
        });
        console.log('    ' + (i + 1) + '. ' + subKey + ': ' + subSummary.slice(0, 50) + (subSummary.length > 50 ? '…' : ''));
        await delay(350);
      }
      console.log('');
    }

    console.log('=== Done ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
