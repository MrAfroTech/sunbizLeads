/**
 * Print niche HeyYou 9-things HTML assets to PDF (same Chrome pipeline as the original).
 * Run from repo root: node scripts/generate-heyyou-niche-pdfs.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const VARIANTS = [
  {
    html: path.join(ROOT, 'public', 'assets', 'heyyou-9-things-events.html'),
    pdf: path.join(ROOT, 'public', 'downloads', 'heyyou-9-things-events.pdf'),
  },
  {
    html: path.join(ROOT, 'public', 'assets', 'heyyou-9-things-hotels.html'),
    pdf: path.join(ROOT, 'public', 'downloads', 'heyyou-9-things-hotels.pdf'),
  },
];

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'google-chrome',
  'chromium',
];

function resolveChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate.includes('/') && fs.existsSync(candidate)) return candidate;
  }
  for (const candidate of CHROME_CANDIDATES) {
    try {
      execFileSync('which', [candidate], { stdio: 'ignore' });
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

function main() {
  const chrome = resolveChrome();
  if (!chrome) {
    throw new Error('Google Chrome not found. Install Chrome or set CHROME_PATH.');
  }

  for (const variant of VARIANTS) {
    if (!fs.existsSync(variant.html)) {
      throw new Error(`Missing HTML source: ${variant.html}`);
    }

    fs.mkdirSync(path.dirname(variant.pdf), { recursive: true });
    execFileSync(
      chrome,
      [
        '--headless',
        '--disable-gpu',
        '--no-pdf-header-footer',
        `--print-to-pdf=${variant.pdf}`,
        `file://${variant.html}`,
      ],
      { stdio: 'inherit' }
    );

    // eslint-disable-next-line no-console
    console.log(`Wrote ${variant.pdf}`);
  }
}

main();
