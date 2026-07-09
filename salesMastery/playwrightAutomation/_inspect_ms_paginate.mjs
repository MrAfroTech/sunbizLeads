import { chromium } from 'playwright';

const url = 'https://mainstreet.org/our-network/main-street-communities?page=1';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

async function firstCardName() {
  return page.locator('.card--page__inner h3').first().innerText();
}

const p1 = await firstCardName();
const next = page.locator('a.pagination__link-icon.pagination__link--next[aria-label="Next Page"]');
await next.click();
await page.waitForTimeout(2000);
const p2 = await firstCardName();
const p2url = page.url();
console.log({ p1, p2, p2url });

await browser.close();
