/*
 * AUDIT FINDINGS
 *
 * CRITICAL
 * - Concurrent read/write of data/envelopes.json without locking can corrupt JSON or lose updates.
 * - No authentication on admin routes (POST /api/envelopes, GET /api/envelope/:id); anyone can create envelopes or read status.
 * - Multer writes uploads to disk before signer validation; invalid requests still leave orphan files on disk.
 * - signatureDataUrl accepts any data:image/* prefix; non-PNG payloads can be stored unvalidated.
 * - No rate limiting on /api/*; vulnerable to abuse and DoS.
 *
 * MAJOR
 * - No file type restriction on uploads; arbitrary executables or scripts can be stored and served.
 * - No explicit file size limit on Multer (only JSON body limit); large uploads can exhaust disk/memory.
 * - envelopes.json parse failures silently return {} — corrupted file appears as empty state (data loss risk).
 * - No helmet or secure HTTP headers.
 * - No graceful shutdown; in-flight writes may be interrupted on SIGTERM/SIGINT.
 * - Duplicate signer IDs in signers array are not rejected.
 * - Non-string signer IDs in signers array are not validated.
 *
 * MINOR
 * - Error responses use inconsistent shapes ({ error } vs plain text on /api/document).
 * - GET /api/document errors return plain text instead of JSON error objects.
 * - No centralized error handler for unexpected exceptions (500 responses).
 * - Multer errors (size/type) not mapped to standardized JSON error responses.
 * - Admin UI does not send Authorization header when ADMIN_TOKEN is configured.
 * - No Content-Disposition or MIME type set when serving uploaded documents.
 */

import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".docx"]);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const PNG_DATA_URL_RE = /^data:image\/png;base64,([A-Za-z0-9+/]+=*?)$/;

let envelopeLock = Promise.resolve();

function withEnvelopeLock(fn) {
  const run = envelopeLock.then(fn);
  envelopeLock = run.catch(() => {});
  return run;
}

function sendError(res, status, code, message) {
  res.status(status).json({ error: message, code });
}

function extnameLower(name) {
  return path.extname(name || "").toLowerCase();
}

function isAllowedUpload(file) {
  const ext = extnameLower(file.originalname);
  return ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext);
}

function isValidPngDataUrl(value) {
  if (typeof value !== "string") return false;
  const match = PNG_DATA_URL_RE.exec(value);
  if (!match) return false;
  try {
    Buffer.from(match[1], "base64");
    return true;
  } catch {
    return false;
  }
}

function adminAuth(adminToken) {
  return (req, res, next) => {
    if (!adminToken) {
      next();
      return;
    }
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || token !== adminToken) {
      sendError(res, 401, "UNAUTHORIZED", "unauthorized");
      return;
    }
    next();
  };
}

export function createApp(options = {}) {
  const root = options.root ?? __dirname;
  const uploadsDir = options.uploadsDir ?? path.join(root, "uploads");
  const dataDir = options.dataDir ?? path.join(root, "data");
  const configSigners =
    options.configSigners ?? path.join(root, "config", "signers.json");
  const adminToken = options.adminToken ?? process.env.ADMIN_TOKEN ?? "";

  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "15mb" }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      sendError(res, 429, "RATE_LIMITED", "too many requests");
    },
  });
  app.use("/api/", apiLimiter);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES },
    fileFilter: (_req, file, cb) => {
      if (!isAllowedUpload(file)) {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
        return;
      }
      cb(null, true);
    },
  });

  function envelopesPath() {
    return path.join(dataDir, "envelopes.json");
  }

  async function readEnvelopes() {
    try {
      const raw = await fs.readFile(envelopesPath(), "utf8");
      return JSON.parse(raw);
    } catch (err) {
      if (err && err.code === "ENOENT") return {};
      throw err;
    }
  }

  async function writeEnvelopes(obj) {
    await fs.writeFile(envelopesPath(), JSON.stringify(obj, null, 0), "utf8");
  }

  async function readEnvelopesLocked() {
    return withEnvelopeLock(() => readEnvelopes());
  }

  async function writeEnvelopesLocked(obj) {
    return withEnvelopeLock(() => writeEnvelopes(obj));
  }

  async function mutateEnvelopes(mutator) {
    return withEnvelopeLock(async () => {
      const envelopes = await readEnvelopes();
      const result = await mutator(envelopes);
      await writeEnvelopes(envelopes);
      return result;
    });
  }

  app.get("/api/signers", async (_req, res, next) => {
    try {
      const raw = await fs.readFile(configSigners, "utf8");
      res.type("json").send(raw);
    } catch (err) {
      next(err);
    }
  });

  app.post(
    "/api/envelopes",
    adminAuth(adminToken),
    (req, res, next) => {
      upload.single("document")(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              sendError(res, 400, "FILE_TOO_LARGE", "file exceeds 10MB limit");
              return;
            }
            sendError(res, 400, "INVALID_FILE_TYPE", "file type not allowed");
            return;
          }
          next(err);
          return;
        }
        next();
      });
    },
    async (req, res, next) => {
      try {
        if (!req.file) {
          sendError(res, 400, "DOCUMENT_REQUIRED", "document required");
          return;
        }

        let signersOrder;
        try {
          signersOrder = JSON.parse(req.body.signers || "[]");
        } catch {
          sendError(res, 400, "INVALID_SIGNERS", "invalid signers");
          return;
        }

        if (!Array.isArray(signersOrder) || signersOrder.length === 0) {
          sendError(res, 400, "SIGNERS_REQUIRED", "at least one signer required");
          return;
        }

        for (const id of signersOrder) {
          if (typeof id !== "string" || !id.trim()) {
            sendError(res, 400, "INVALID_SIGNERS", "invalid signers");
            return;
          }
        }

        const cfg = JSON.parse(await fs.readFile(configSigners, "utf8"));
        const validIds = new Set(cfg.members.map((m) => m.id));
        const seen = new Set();
        for (const id of signersOrder) {
          if (!validIds.has(id)) {
            sendError(res, 400, "INVALID_SIGNER_ID", "invalid signer id");
            return;
          }
          if (seen.has(id)) {
            sendError(res, 400, "INVALID_SIGNERS", "duplicate signer id");
            return;
          }
          seen.add(id);
        }

        const safe = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storedName = `${uuidv4()}_${safe}`;
        await fs.writeFile(path.join(uploadsDir, storedName), req.file.buffer);

        const envelopeId = uuidv4();
        const signers = signersOrder.map((memberId, index) => ({
          order: index,
          memberId,
          token: uuidv4(),
          signedAt: null,
          signatureDataUrl: null,
        }));

        await mutateEnvelopes((envelopes) => {
          envelopes[envelopeId] = {
            id: envelopeId,
            originalName: req.file.originalname,
            storedName,
            signers,
            createdAt: new Date().toISOString(),
          };
        });

        res.json({
          id: envelopeId,
          signers: signers.map((s) => ({
            order: s.order,
            memberId: s.memberId,
            signUrl: `/sign.html?token=${encodeURIComponent(s.token)}`,
          })),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  app.get("/api/envelope/:id", adminAuth(adminToken), async (req, res, next) => {
    try {
      const envelopes = await readEnvelopesLocked();
      const env = envelopes[req.params.id];
      if (!env) {
        sendError(res, 404, "NOT_FOUND", "not found");
        return;
      }
      const cfg = JSON.parse(await fs.readFile(configSigners, "utf8"));
      const names = Object.fromEntries(cfg.members.map((m) => [m.id, m.name]));
      res.json({
        id: env.id,
        originalName: env.originalName,
        signers: env.signers.map((s) => ({
          order: s.order,
          memberId: s.memberId,
          memberName: names[s.memberId] || s.memberId,
          signedAt: s.signedAt,
          signUrl: `/sign.html?token=${encodeURIComponent(s.token)}`,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  function findSignerByToken(envelopes, token) {
    for (const env of Object.values(envelopes)) {
      const i = env.signers.findIndex((s) => s.token === token);
      if (i !== -1) return { env, signerIndex: i };
    }
    return null;
  }

  app.get("/api/sign-context", async (req, res, next) => {
    try {
      const token = req.query.token;
      if (!token || typeof token !== "string") {
        sendError(res, 400, "TOKEN_REQUIRED", "token required");
        return;
      }
      const envelopes = await readEnvelopesLocked();
      const found = findSignerByToken(envelopes, token);
      if (!found) {
        sendError(res, 404, "NOT_FOUND", "not found");
        return;
      }
      const { env, signerIndex } = found;
      for (let i = 0; i < signerIndex; i++) {
        if (!env.signers[i].signedAt) {
          sendError(res, 403, "NOT_YOUR_TURN", "signing order: not your turn");
          return;
        }
      }
      if (env.signers[signerIndex].signedAt) {
        sendError(res, 410, "ALREADY_SIGNED", "already signed");
        return;
      }

      const cfg = JSON.parse(await fs.readFile(configSigners, "utf8"));
      const names = Object.fromEntries(cfg.members.map((m) => [m.id, m.name]));
      res.json({
        envelopeId: env.id,
        originalName: env.originalName,
        memberId: env.signers[signerIndex].memberId,
        memberName: names[env.signers[signerIndex].memberId],
        documentUrl: `/api/document/${env.id}?token=${encodeURIComponent(token)}`,
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/document/:id", async (req, res, next) => {
    try {
      const token = req.query.token;
      if (!token || typeof token !== "string") {
        sendError(res, 400, "TOKEN_REQUIRED", "token required");
        return;
      }
      const envelopes = await readEnvelopesLocked();
      const env = envelopes[req.params.id];
      if (!env) {
        sendError(res, 404, "NOT_FOUND", "not found");
        return;
      }
      const signer = env.signers.find((s) => s.token === token);
      if (!signer) {
        sendError(res, 403, "FORBIDDEN", "forbidden");
        return;
      }
      const filePath = path.join(uploadsDir, env.storedName);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/sign", async (req, res, next) => {
    try {
      const { token, signatureDataUrl } = req.body || {};
      if (!token || typeof token !== "string") {
        sendError(res, 400, "INVALID_PAYLOAD", "invalid payload");
        return;
      }
      if (!isValidPngDataUrl(signatureDataUrl)) {
        sendError(res, 400, "INVALID_PAYLOAD", "invalid payload");
        return;
      }

      const result = await mutateEnvelopes((envelopes) => {
        const found = findSignerByToken(envelopes, token);
        if (!found) {
          return { status: 404, code: "NOT_FOUND", message: "not found" };
        }
        const { env, signerIndex } = found;
        for (let i = 0; i < signerIndex; i++) {
          if (!env.signers[i].signedAt) {
            return {
              status: 403,
              code: "NOT_YOUR_TURN",
              message: "signing order: not your turn",
            };
          }
        }
        const s = env.signers[signerIndex];
        if (s.signedAt) {
          return { status: 410, code: "ALREADY_SIGNED", message: "already signed" };
        }
        s.signedAt = new Date().toISOString();
        s.signatureDataUrl = signatureDataUrl;
        return { status: 200, body: { ok: true } };
      });

      if (result.status !== 200) {
        sendError(res, result.status, result.code, result.message);
        return;
      }
      res.json(result.body);
    } catch (err) {
      next(err);
    }
  });

  app.use(express.static(path.join(root, "public")));

  app.use((err, _req, res, _next) => {
    console.error(err);
    sendError(res, 500, "INTERNAL_ERROR", "internal server error");
  });

  app.ensureDirs = async () => {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
  };

  return app;
}

async function start() {
  const app = createApp();
  await app.ensureDirs();

  if (!process.env.ADMIN_TOKEN) {
    console.error("warning: ADMIN_TOKEN is not set; admin routes are not protected");
  }

  const port = Number(process.env.PORT) || 3847;
  const server = app.listen(port, () => {
    console.error(`listening ${port}`);
  });

  const shutdown = (signal) => {
    console.error(`${signal} received, shutting down`);
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  start();
}
