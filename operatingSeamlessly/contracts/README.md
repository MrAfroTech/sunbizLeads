# contracts-esign

Self-hosted e-signature workflow for uploading a document, assigning signers in order, and collecting canvas-drawn signatures. Built with Node.js (ESM), Express 4, Multer, and vanilla HTML/JS. State is stored in `data/envelopes.json`; uploads live in `uploads/`; allowed signers are defined in `config/signers.json`.

## Install and run

```bash
npm install
npm start
```

The server listens on port **3847** by default (`http://localhost:3847`).

- **Admin UI:** `/` — upload a document and choose signers in order.
- **Signer UI:** `/sign.html?token=<uuid>` — view the document and submit a drawn signature.

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default: `3847`) |
| `ADMIN_TOKEN` | Bearer token required for `POST /api/envelopes` and `GET /api/envelope/:id`. Send as `Authorization: Bearer <token>`. If unset, a startup warning is logged and those routes are not protected. |

## Tests

```bash
npm test
```

Integration tests use Node's built-in `node:test` runner and isolated temporary `uploads/` and `data/` directories so production state is not touched.

## API overview

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/api/signers` | None |
| `POST` | `/api/envelopes` | `ADMIN_TOKEN` when set |
| `GET` | `/api/envelope/:id` | `ADMIN_TOKEN` when set |
| `GET` | `/api/sign-context?token=` | Signer token |
| `GET` | `/api/document/:id?token=` | Signer token |
| `POST` | `/api/sign` | Signer token in body |

Error responses use `{ "error": string, "code": string }`.

## Known limitations

- Signatures are stored as PNG data URLs in JSON; they are **not** embedded or annotated onto the uploaded PDF.
- No email delivery, reminders, or webhooks — signing links must be shared manually.
- File-based storage only (`envelopes.json` + `uploads/`); no database or horizontal scaling story.
- Not ESIGN/UETA compliant; suitable for internal or low-stakes workflows only.
- When `ADMIN_TOKEN` is set, the bundled admin HTML UI does not send the Bearer header; use API clients or leave `ADMIN_TOKEN` unset for local browser-based admin.
