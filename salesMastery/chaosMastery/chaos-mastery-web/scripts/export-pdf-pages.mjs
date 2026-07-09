/**
 * Renders each `.page` block from a chapter HTML file to its own PDF (816×1056).
 * Requires: Playwright installed at ../../playwrightAutomation/node_modules/playwright
 * and Chromium: (cd ../../playwrightAutomation && npx playwright install chromium)
 *
 * Usage:
 *   node scripts/export-pdf-pages.mjs <path-to-chapter.html> <output-dir-for-pdfs>
 */
import { mkdir, readdir } from 'fs/promises';
import { createRequire } from 'module';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '..');
// Pin browsers under playwrightAutomation so installs are predictable (avoids broken sandbox cache paths).
const pwBrowsers = resolve(webRoot, '../../playwrightAutomation/node_modules/.cache/ms-playwright');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = pwBrowsers;
}
const require = createRequire(import.meta.url);
const { chromium } = require(resolve(webRoot, '../../playwrightAutomation/node_modules/playwright'));

const [, , htmlArg, outArg] = process.argv;
if (!htmlArg || !outArg) {
  console.error('Usage: node scripts/export-pdf-pages.mjs <chapter.html> <output-dir>');
  process.exit(1);
}

const htmlPath = resolve(htmlArg);
const outDir = resolve(outArg);

const fileUrl = new URL(`file://${htmlPath}`).href;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setViewportSize({ width: 900, height: 1100 });

await page.goto(fileUrl, { waitUntil: 'load', timeout: 120_000 });
// Avoid networkidle on file:// + CDN fonts (often never settles).
await new Promise((r) => setTimeout(r, 2500));

await page.addStyleTag({
  content: `
    .dl-bar { display: none !important; }
    body { background: #fff !important; padding: 0 !important; align-items: flex-start !important; }
  `,
});

const count = await page.locator('.page').count();
if (count === 0) {
  console.error('No .page elements found.');
  await browser.close();
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

for (let i = 0; i < count; i++) {
  await page.evaluate((idx) => {
    document.querySelectorAll('.page').forEach((el, j) => {
      el.style.display = j === idx ? 'flex' : 'none';
    });
  }, i);
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  const name = `page-${String(i + 1).padStart(2, '0')}.pdf`;
  const path = join(outDir, name);
  await page.pdf({
    path,
    width: '816px',
    height: '1056px',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  console.log('Wrote', path);
}

await browser.close();

const files = (await readdir(outDir))
  .filter((f) => /^page-\d+\.pdf$/.test(f))
  .sort();
console.log('Done.', files.length, 'PDFs in', outDir);
