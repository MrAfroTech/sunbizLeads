#!/usr/bin/env node
/**
 * Scans public/chaosMasteryNewsletters/*.html and writes src/generated/chaosMasteryNewsletterIssues.json
 * for ChaosMasteryNewsletterPage. Run automatically before start/build via npm hooks.
 *
 * Expected <title>: "Chaos Mastery Newsletter — Issue 006: Your Headline Here"
 * Optional: <meta name="chaos-mastery-date" content="April 13, 2026">
 * Optional: <meta name="chaos-mastery-read-time" content="5 min read">
 * Fallbacks: date from .nl-eyebrow after "·", read time from "N min read" in markup.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_NEWSLETTER_DIR = path.join(__dirname, '../public/chaosMasteryNewsletters');
const ROOT_NEWSLETTER_DIR = path.join(__dirname, '../chaosMasteryNewsletters');
const OUT_FILE = path.join(__dirname, '../src/generated/chaosMasteryNewsletterIssues.json');

function parseIssueFromHtml(html, filename) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : '';

  let id = path.basename(filename, path.extname(filename));
  let title = rawTitle || id;

  const issueFromTitle = rawTitle.match(/Issue\s*(\d+)\s*:\s*(.+)$/i);
  if (issueFromTitle) {
    id = String(parseInt(issueFromTitle[1], 10)).padStart(3, '0');
    title = issueFromTitle[2].trim();
  } else {
    title = rawTitle.replace(/^Chaos Mastery Newsletter\s*[—–-]\s*/i, '').trim() || id;
  }

  let dateLabel = '';
  const metaDate = html.match(
    /<meta\s+name=["']chaos-mastery-date["']\s+content=["']([^"']*)["']/i
  );
  if (metaDate) {
    dateLabel = metaDate[1].trim();
  } else {
    const eyebrow = html.match(/class=["']nl-eyebrow["'][^>]*>([^<]+)<\/div>/i);
    if (eyebrow) {
      const bits = eyebrow[1].split('·').map((s) => s.trim()).filter(Boolean);
      if (bits.length >= 2) {
        dateLabel = bits[bits.length - 1];
      }
    }
  }

  let readTime = '5 min read';
  const metaRead = html.match(
    /<meta\s+name=["']chaos-mastery-read-time["']\s+content=["']([^"']*)["']/i
  );
  if (metaRead && metaRead[1].trim()) {
    readTime = metaRead[1].trim();
  } else {
    const readMatch = html.match(/(\d+\s*min\s*read)/i);
    if (readMatch) {
      readTime = readMatch[1].replace(/\s+/g, ' ').trim();
    }
  }

  const href = `/chaosMasteryNewsletters/${filename}`;
  return { id, title, dateLabel, readTime, href, filename };
}

function main() {
  fs.mkdirSync(PUBLIC_NEWSLETTER_DIR, { recursive: true });
  const htmlByFilename = new Map();

  const sourceDirs = [PUBLIC_NEWSLETTER_DIR, ROOT_NEWSLETTER_DIR];
  sourceDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      return;
    }
    fs.readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.html'))
      .forEach((filename) => {
        const fullPath = path.join(dir, filename);
        const html = fs.readFileSync(fullPath, 'utf8');
        htmlByFilename.set(filename, html);
      });
  });

  if (!htmlByFilename.size) {
    console.warn(
      '[sync-chaos-mastery-newsletters] No newsletter HTML files found in',
      PUBLIC_NEWSLETTER_DIR,
      'or',
      ROOT_NEWSLETTER_DIR,
      '— writing empty list.'
    );
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, '[]\n');
    return;
  }

  // Keep public/ as the canonical served location for static newsletter files.
  htmlByFilename.forEach((html, filename) => {
    const publicPath = path.join(PUBLIC_NEWSLETTER_DIR, filename);
    fs.writeFileSync(publicPath, html);
  });

  const issues = Array.from(htmlByFilename.entries()).map(([filename, html]) =>
    parseIssueFromHtml(html, filename)
  );

  issues.sort((a, b) => {
    const na = parseInt(a.id, 10);
    const nb = parseInt(b.id, 10);
    const aOk = !Number.isNaN(na);
    const bOk = !Number.isNaN(nb);
    if (aOk && bOk && na !== nb) {
      return na - nb;
    }
    return a.filename.localeCompare(b.filename);
  });

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(issues, null, 2) + '\n');
  console.log(
    `[sync-chaos-mastery-newsletters] ${issues.length} issue(s) → ${path.relative(process.cwd(), OUT_FILE)}`
  );
}

main();
