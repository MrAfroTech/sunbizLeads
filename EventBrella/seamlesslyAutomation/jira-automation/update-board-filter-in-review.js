import 'dotenv/config';
import fetch from 'node-fetch';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const STATUS_IN_REVIEW = 'In Review';
const DELAY_MS = 300;
const BOARD_ID_MIN = 1;
const BOARD_ID_MAX = 70;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
const headers = {
  Authorization: `Basic ${auth}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a single board by id (GET /rest/agile/1.0/board/{id}).
 * Returns null if board does not exist (404).
 */
async function getBoardById(boardId) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}`, {
    method: 'GET',
    headers,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to get board ${boardId}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getFilter(filterId) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/filter/${filterId}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to get filter: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function updateFilter(filterId, payload) {
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/filter/${filterId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to update filter: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function ensureInReviewInJql(currentJql) {
  const trimmed = (currentJql || '').trim();
  if (!trimmed) {
    return `status = "${STATUS_IN_REVIEW}"`;
  }
  if (trimmed.toLowerCase().includes('in review')) {
    return trimmed;
  }
  return `(${trimmed}) OR status = "${STATUS_IN_REVIEW}"`;
}

async function run() {
  try {
    console.log(`\n=== Update Board Filters: In Review Visible (scrum-${BOARD_ID_MIN} thru scrum-${BOARD_ID_MAX}) ===\n`);

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      console.error('Missing required env: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN');
      process.exit(1);
    }

    console.log(`Updating boards with ids ${BOARD_ID_MIN} to ${BOARD_ID_MAX}...\n`);

    let updated = 0;
    let skipped = 0;
    let noFilter = 0;
    let notFound = 0;
    let errors = 0;

    for (let boardId = BOARD_ID_MIN; boardId <= BOARD_ID_MAX; boardId++) {
      const label = `scrum-${boardId} (id: ${boardId})`;
      try {
        const board = await getBoardById(boardId);
        if (!board) {
          notFound++;
          continue;
        }
        const filterId = board.filter?.id ?? board.filterId;
        if (filterId == null) {
          console.log(`  ${label} "${board.name}": no filter, skip`);
          noFilter++;
          await delay(DELAY_MS);
          continue;
        }
        const filter = await getFilter(filterId);
        const currentJql = filter.jql || '';
        const newJql = ensureInReviewInJql(currentJql);
        if (newJql === currentJql) {
          console.log(`  ${label} "${board.name}": filter already includes "In Review"`);
          skipped++;
        } else {
          await updateFilter(filterId, {
            name: filter.name,
            description: filter.description ?? '',
            jql: newJql,
          });
          console.log(`  ${label} "${board.name}": ✓ filter updated`);
          updated++;
        }
      } catch (err) {
        console.log(`  ${label}: ✗ ${err.message}`);
        errors++;
      }
      await delay(DELAY_MS);
    }

    console.log('\n--- Summary ---');
    console.log(`Updated: ${updated}, Already included: ${skipped}, No filter: ${noFilter}, Not found: ${notFound}, Errors: ${errors}`);
    console.log('\n=== Complete! ===\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
