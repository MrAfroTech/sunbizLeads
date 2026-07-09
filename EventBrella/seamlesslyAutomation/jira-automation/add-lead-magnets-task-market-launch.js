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

async function searchJql(jql, maxResults = 3) {
  const r = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jql, maxResults, fields: ['summary', 'key'] }),
  });
  if (!r.ok) throw new Error(`Search: ${r.status}`);
  const d = await r.json();
  return d.issues || [];
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

const EPIC_SEARCH_TERMS = ['Market Launch', 'Marketing Launch'];
const TASK_SUMMARY = 'Create 6 Lead Magnets';
const TASK_DESCRIPTION = 'Create six lead magnets for marketing and lead generation.';

const SUBTASKS = [
  { summary: 'Lead magnet 1: eBook / PDF guide', description: 'Create first lead magnet: eBook or PDF guide.' },
  { summary: 'Lead magnet 2: Checklist or cheat sheet', description: 'Create second lead magnet: checklist or cheat sheet.' },
  { summary: 'Lead magnet 3: Template (e.g. spreadsheet or doc)', description: 'Create third lead magnet: template.' },
  { summary: 'Lead magnet 4: Webinar or workshop replay', description: 'Create fourth lead magnet: webinar or workshop replay.' },
  { summary: 'Lead magnet 5: Free tool or calculator', description: 'Create fifth lead magnet: free tool or calculator.' },
  { summary: 'Lead magnet 6: Case study or resource list', description: 'Create sixth lead magnet: case study or resource list.' },
];

async function run() {
  try {
    console.log('\n=== Add "Create 6 Lead Magnets" task + 6 subtasks to Market Launch epic ===\n');

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error('Missing required env variables.');
      process.exit(1);
    }

    let epics = [];
    for (const term of EPIC_SEARCH_TERMS) {
      const jql = `project = ${JIRA_PROJECT_KEY} AND type = Epic AND summary ~ "${term.replace(/"/g, '\\"')}" ORDER BY created DESC`;
      epics = await searchJql(jql, 3);
      if (epics.length > 0) break;
    }

    if (!epics.length) {
      console.error('Marketing Launch / Market Launch epic not found.');
      process.exit(1);
    }

    const epicKey = epics[0].key;
    console.log(`✓ Found epic: ${epicKey} (${epics[0].fields.summary})\n`);

    console.log(`Creating task: "${TASK_SUMMARY}"...`);
    const taskKey = await createIssue({
      project: { key: JIRA_PROJECT_KEY },
      summary: TASK_SUMMARY,
      description: textToAdf(TASK_DESCRIPTION),
      issuetype: { name: 'Task' },
      parent: { key: epicKey },
    });
    console.log(`✓ Created task: ${taskKey}\n`);

    console.log('Creating 6 subtasks...');
    for (const st of SUBTASKS) {
      const key = await createIssue({
        project: { key: JIRA_PROJECT_KEY },
        summary: st.summary,
        description: textToAdf(st.description),
        issuetype: { name: 'Subtask' },
        parent: { key: taskKey },
      });
      console.log(`  ✓ ${key}: ${st.summary}`);
      await delay(400);
    }

    console.log('\n=== Done ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
