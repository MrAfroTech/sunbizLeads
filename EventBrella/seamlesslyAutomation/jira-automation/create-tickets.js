import "dotenv/config";
import axios from "axios";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DELAY_MS = 500;

/**
 * Build Atlassian Document Format (ADF) from plain text.
 * @param {string} text
 * @returns {object} ADF document
 */
function textToAdf(text) {
  if (!text || typeof text !== "string") {
    return { version: 1, type: "doc", content: [] };
  }
  return {
    version: 1,
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: text.trim() }],
      },
    ],
  };
}

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a Jira issue via REST API v3.
 * @param {object} client - Axios instance with auth
 * @param {object} payload - Issue fields
 * @returns {Promise<string>} Created issue key (e.g. PROJ-123)
 */
async function createIssue(client, payload) {
  const { data } = await client.post("/rest/api/3/issue", {
    fields: {
      project: { key: process.env.JIRA_PROJECT_KEY },
      summary: payload.summary,
      description: payload.description,
      issuetype: { name: payload.issuetype },
      ...(payload.parentKey && { parent: { key: payload.parentKey } }),
      ...(payload.timetracking && { timetracking: payload.timetracking }),
    },
  });
  return data.key;
}

async function main() {
  const baseURL = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!baseURL || !email || !token || !projectKey) {
    console.error("Missing required environment variables.");
    console.error("Copy .env.example to .env and set: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY");
    process.exit(1);
  }

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  const client = axios.create({
    baseURL,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  let ticketsPath;
  try {
    ticketsPath = join(__dirname, "tickets.json");
  } catch {
    ticketsPath = "tickets.json";
  }

  let data;
  try {
    data = JSON.parse(readFileSync(ticketsPath, "utf8"));
  } catch (err) {
    console.error("Failed to read tickets.json:", err.message);
    process.exit(1);
  }

  // Support both formats: "epics" array (multiple) or "epic" + "stories" (single)
  const epicsList = Array.isArray(data.epics)
    ? data.epics
    : data.epic && data.stories
      ? [{ ...data.epic, stories: data.stories }]
      : [];

  if (!epicsList.length) {
    console.error("tickets.json must contain 'epics' (array) or 'epic' and 'stories'.");
    process.exit(1);
  }

  let totalEpics = 0;
  let totalStories = 0;
  let totalTasks = 0;

  try {
    for (const epicData of epicsList) {
      const storiesData = epicData.stories ?? [];

      console.log(`Creating epic: ${epicData.summary}`);
      const epicKey = await createIssue(client, {
        summary: epicData.summary,
        description: textToAdf(epicData.description),
        issuetype: "Epic",
      });
      console.log(`  Created epic: ${epicKey}`);
      totalEpics++;
      await delay(DELAY_MS);

      for (const story of storiesData) {
        console.log(`  Creating story: ${story.summary}`);
        const storyKey = await createIssue(client, {
          summary: story.summary,
          description: textToAdf(story.description),
          issuetype: "Story",
          parentKey: epicKey,
        });
        console.log(`    Created story: ${storyKey}`);
        totalStories++;
        await delay(DELAY_MS);

        for (const task of story.tasks || []) {
          const timetracking =
            task.estimate && task.estimate !== "ongoing" && task.estimate !== "daily"
              ? { originalEstimate: task.estimate, remainingEstimate: task.estimate }
              : undefined;

          const taskKey = await createIssue(client, {
            summary: task.summary,
            description: textToAdf(task.description),
            issuetype: "Task",
            parentKey: storyKey,
            ...(timetracking && { timetracking }),
          });
          console.log(`    Created task: ${taskKey} - ${task.summary}`);
          totalTasks++;
          await delay(DELAY_MS);
        }
      }

      // Epic-level tasks (direct children of the epic)
      const epicTasks = epicData.tasks ?? [];
      for (const task of epicTasks) {
        const timetracking =
          task.estimate && task.estimate !== "ongoing" && task.estimate !== "daily"
            ? { originalEstimate: task.estimate, remainingEstimate: task.estimate }
            : undefined;

        const taskKey = await createIssue(client, {
          summary: task.summary,
          description: textToAdf(task.description),
          issuetype: "Task",
          parentKey: epicKey,
          ...(timetracking && { timetracking }),
        });
        console.log(`  Created task: ${taskKey} - ${task.summary}`);
        totalTasks++;
        await delay(DELAY_MS);
      }
    }

    console.log(`\nDone. ${totalEpics} epic(s), ${totalStories} story(ies), ${totalTasks} task(s) created.`);
  } catch (err) {
    const msg = err.response?.data?.errorMessages?.join?.(" ") || err.response?.data?.errors || err.message;
    console.error("\nJira API error:", msg);
    if (err.response?.status) console.error("Status:", err.response.status);
    process.exit(1);
  }
}

main();
