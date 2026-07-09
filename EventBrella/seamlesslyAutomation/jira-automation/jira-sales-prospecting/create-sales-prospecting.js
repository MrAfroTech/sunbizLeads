/**
 * Creates the Sales Prospecting epic, Semi Pro Engaged Leads story, and lead tasks in Jira.
 * Reads from ./tickets.json and writes created issue keys + log to this folder.
 *
 * Run from jira-automation root:
 *   node jira-sales-prospecting/create-sales-prospecting.js
 *
 * Requires .env in parent directory with JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY.
 */
import dotenv from "dotenv";
import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from jira-automation root
dotenv.config({ path: join(__dirname, "..", ".env") });

const DELAY_MS = 500;
const TICKETS_PATH = join(__dirname, "tickets.json");
const OUTPUT_JSON_PATH = join(__dirname, "created-issues.json");
const OUTPUT_LOG_PATH = join(__dirname, "run.log");

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
        content: [{ type: "text", text: String(text).trim() }],
      },
    ],
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

const logLines = [];

function log(msg) {
  const line = typeof msg === "string" ? msg : JSON.stringify(msg);
  console.log(line);
  logLines.push(line);
}

async function main() {
  const baseURL = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!baseURL || !email || !token || !projectKey) {
    log("Missing required environment variables.");
    log("Copy .env.example to .env and set: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
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

  let data;
  try {
    data = JSON.parse(readFileSync(TICKETS_PATH, "utf8"));
  } catch (err) {
    log("Failed to read tickets.json: " + err.message);
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    process.exit(1);
  }

  const epicsList =
    Array.isArray(data.epics) ? data.epics : data.epic && data.stories ? [{ ...data.epic, stories: data.stories }] : [];

  if (!epicsList.length) {
    log("tickets.json must contain 'epics' (array) or 'epic' and 'stories'.");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    process.exit(1);
  }

  const output = {
    createdAt: new Date().toISOString(),
    epic: null,
    story: null,
    tasks: [],
    summary: { epics: 0, stories: 0, tasks: 0 },
  };

  try {
    for (const epicData of epicsList) {
      const storiesData = epicData.stories ?? [];

      log("Creating epic: " + epicData.summary);
      const epicKey = await createIssue(client, {
        summary: epicData.summary,
        description: textToAdf(epicData.description),
        issuetype: "Epic",
      });
      log("  Created epic: " + epicKey);
      output.epic = epicKey;
      output.summary.epics++;
      await delay(DELAY_MS);

      for (const story of storiesData) {
        log("  Creating story: " + story.summary);
        const storyKey = await createIssue(client, {
          summary: story.summary,
          description: textToAdf(story.description),
          issuetype: "Story",
          parentKey: epicKey,
        });
        log("    Created story: " + storyKey);
        output.story = storyKey;
        output.summary.stories++;
        await delay(DELAY_MS);

        const taskKeys = [];
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
          log("    Created task: " + taskKey + " - " + task.summary);
          taskKeys.push({ key: taskKey, summary: task.summary });
          output.summary.tasks++;
          await delay(DELAY_MS);
        }
        output.tasks = taskKeys;
      }
    }

    log("");
    log(
      "Done. " +
        output.summary.epics +
        " epic(s), " +
        output.summary.stories +
        " story(ies), " +
        output.summary.tasks +
        " task(s) created."
    );

    writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2), "utf8");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    log("");
    log("Output saved to: " + OUTPUT_JSON_PATH + ", " + OUTPUT_LOG_PATH);
  } catch (err) {
    const msg =
      err.response?.data?.errorMessages?.join?.(" ") || err.response?.data?.errors || err.message;
    log("Jira API error: " + msg);
    if (err.response?.status) log("Status: " + err.response.status);
    writeFileSync(OUTPUT_JSON_PATH, JSON.stringify({ ...output, error: String(msg) }, null, 2), "utf8");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    process.exit(1);
  }
}

main();
