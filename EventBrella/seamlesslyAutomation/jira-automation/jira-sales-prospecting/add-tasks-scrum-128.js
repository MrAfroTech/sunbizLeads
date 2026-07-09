/**
 * Creates the four lead tasks under existing story SCRUM-128 "Semi Pro Engaged Leads".
 *
 * Run from jira-automation root:
 *   node jira-sales-prospecting/add-tasks-scrum-128.js
 */
import dotenv from "dotenv";
import axios from "axios";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const STORY_KEY = "SCRUM-128";
const DELAY_MS = 500;
const OUTPUT_JSON_PATH = join(__dirname, "created-tasks-scrum-128.json");
const OUTPUT_LOG_PATH = join(__dirname, "run-add-tasks.log");

const TASKS = [
  { summary: "M Woods", description: "Lead: M Woods" },
  { summary: "Darren Newsome", description: "Lead: Darren Newsome" },
  { summary: "Jeff Jarnigan", description: "Lead: Jeff Jarnigan" },
  { summary: "Ted Tornow", description: "Lead: Ted Tornow" },
];

function textToAdf(text) {
  if (!text || typeof text !== "string") {
    return { version: 1, type: "doc", content: [] };
  }
  return {
    version: 1,
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: String(text).trim() }] },
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
      issuetype: { name: "Subtask" },
      parent: { key: payload.parentKey },
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

  const output = {
    createdAt: new Date().toISOString(),
    storyKey: STORY_KEY,
    tasks: [],
  };

  try {
    log("Adding tasks under story " + STORY_KEY + " (Semi Pro Engaged Leads)\n");

    for (const task of TASKS) {
      const key = await createIssue(client, {
        summary: task.summary,
        description: textToAdf(task.description),
        parentKey: STORY_KEY,
      });
      log("  Created " + key + " – " + task.summary);
      output.tasks.push({ key, summary: task.summary });
      await delay(DELAY_MS);
    }

    log("\nDone. " + output.tasks.length + " task(s) created under " + STORY_KEY + ".");
    writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2), "utf8");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    log("Output saved to: " + OUTPUT_JSON_PATH + ", " + OUTPUT_LOG_PATH);
  } catch (err) {
    const msg =
      err.response?.data?.errorMessages?.join?.(" ") ||
      JSON.stringify(err.response?.data?.errors) ||
      err.message;
    log("Jira API error: " + msg);
    if (err.response?.status) log("Status: " + err.response.status);
    output.error = String(msg);
    writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2), "utf8");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    process.exit(1);
  }
}

main();
