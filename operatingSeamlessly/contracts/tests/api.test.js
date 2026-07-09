import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { createApp } from "../server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const MINIMAL_PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const VALID_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

let tempRoot;
let server;
let baseUrl;
const adminToken = "test-admin-token";

test.before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "contracts-esign-"));
  const uploadsDir = path.join(tempRoot, "uploads");
  const dataDir = path.join(tempRoot, "data");

  const app = createApp({
    root: ROOT,
    uploadsDir,
    dataDir,
    configSigners: path.join(ROOT, "config", "signers.json"),
    adminToken,
  });
  await app.ensureDirs();

  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
  if (tempRoot) {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

function adminHeaders(extra = {}) {
  return { Authorization: `Bearer ${adminToken}`, ...extra };
}

async function createEnvelope(signers = ["m1"]) {
  const fd = new FormData();
  fd.append("document", new Blob([MINIMAL_PDF], { type: "application/pdf" }), "test.pdf");
  fd.append("signers", JSON.stringify(signers));
  const res = await fetch(`${baseUrl}/api/envelopes`, {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  const body = await res.json();
  return { res, body };
}

test("GET /api/signers returns members with id and name", async () => {
  const res = await fetch(`${baseUrl}/api/signers`);
  assert.equal(res.status, 200);
  const cfg = await res.json();
  assert.ok(Array.isArray(cfg.members));
  assert.ok(cfg.members.length >= 1);
  assert.ok(cfg.members[0].id);
  assert.ok(cfg.members[0].name);
});

test("POST /api/envelopes with valid PDF and signers returns id and signUrls", async () => {
  const { res, body } = await createEnvelope(["m1"]);
  assert.equal(res.status, 200);
  assert.ok(body.id);
  assert.ok(Array.isArray(body.signers));
  assert.equal(body.signers.length, 1);
  assert.match(body.signers[0].signUrl, /^\/sign\.html\?token=/);
});

test("POST /api/envelopes with invalid signer ID returns 400", async () => {
  const fd = new FormData();
  fd.append("document", new Blob([MINIMAL_PDF], { type: "application/pdf" }), "test.pdf");
  fd.append("signers", JSON.stringify(["invalid-id"]));
  const res = await fetch(`${baseUrl}/api/envelopes`, {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.code, "INVALID_SIGNER_ID");
  assert.ok(body.error);
});

test("POST /api/envelopes with disallowed file type returns 400", async () => {
  const fd = new FormData();
  fd.append(
    "document",
    new Blob([Buffer.from("MZ")], { type: "application/octet-stream" }),
    "malware.exe"
  );
  fd.append("signers", JSON.stringify(["m1"]));
  const res = await fetch(`${baseUrl}/api/envelopes`, {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.code, "INVALID_FILE_TYPE");
});

test("GET /api/sign-context with valid token returns metadata and document URL", async () => {
  const { body: created } = await createEnvelope(["m1"]);
  const token = new URL(created.signers[0].signUrl, baseUrl).searchParams.get("token");
  const res = await fetch(`${baseUrl}/api/sign-context?token=${encodeURIComponent(token)}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.memberName);
  assert.ok(body.originalName);
  assert.match(body.documentUrl, /^\/api\/document\//);
});

test("GET /api/sign-context with invalid token returns 404", async () => {
  const res = await fetch(`${baseUrl}/api/sign-context?token=${encodeURIComponent("not-a-real-token")}`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.code, "NOT_FOUND");
});

test("POST /api/sign with valid token and PNG data URL marks signer signed", async () => {
  const { body: created } = await createEnvelope(["m1"]);
  const token = new URL(created.signers[0].signUrl, baseUrl).searchParams.get("token");
  const res = await fetch(`${baseUrl}/api/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, signatureDataUrl: VALID_PNG_DATA_URL }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test("POST /api/sign with same token again returns 410", async () => {
  const { body: created } = await createEnvelope(["m1"]);
  const token = new URL(created.signers[0].signUrl, baseUrl).searchParams.get("token");
  await fetch(`${baseUrl}/api/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, signatureDataUrl: VALID_PNG_DATA_URL }),
  });
  const res = await fetch(`${baseUrl}/api/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, signatureDataUrl: VALID_PNG_DATA_URL }),
  });
  assert.equal(res.status, 410);
  const body = await res.json();
  assert.equal(body.code, "ALREADY_SIGNED");
});

test("sequential signing: order=1 cannot sign before order=0", async () => {
  const { body: created } = await createEnvelope(["m1", "m2"]);
  const secondToken = new URL(created.signers[1].signUrl, baseUrl).searchParams.get("token");
  const res = await fetch(`${baseUrl}/api/sign-context?token=${encodeURIComponent(secondToken)}`);
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.code, "NOT_YOUR_TURN");
});

test("GET /api/envelope/:id returns full status after all signers signed", async () => {
  const { body: created } = await createEnvelope(["m1", "m2"]);
  for (const signer of created.signers) {
    const token = new URL(signer.signUrl, baseUrl).searchParams.get("token");
    const res = await fetch(`${baseUrl}/api/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, signatureDataUrl: VALID_PNG_DATA_URL }),
    });
    assert.equal(res.status, 200);
  }
  const res = await fetch(`${baseUrl}/api/envelope/${created.id}`, {
    headers: adminHeaders(),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.id, created.id);
  assert.equal(body.signers.length, 2);
  assert.ok(body.signers.every((s) => s.signedAt));
});
