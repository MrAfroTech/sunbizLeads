#!/usr/bin/env node
/**
 * Local static server for toolbox (no extra deps). Vercel still serves files directly — this is only for npm start.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.env.PORT || '4173', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent((reqPath || '/').split('?')[0]);
  const rel = decoded.replace(/^\/+/, '');
  const full = path.normalize(path.join(root, rel));
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }

  let filePath = safeJoin(ROOT, req.url === '/' ? '/' : req.url || '/');
  if (!filePath) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let st;
  try {
    st = fs.statSync(filePath);
  } catch {
    res.writeHead(404).end('Not found');
    return;
  }

  if (st.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    try {
      st = fs.statSync(filePath);
    } catch {
      res.writeHead(404).end('Not found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');

  if (req.method === 'HEAD') {
    res.writeHead(200).end();
    return;
  }

  fs.createReadStream(filePath)
    .on('error', () => {
      res.writeHead(500).end();
    })
    .pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`salesmastery-toolbox → http://127.0.0.1:${PORT}/`);
});
