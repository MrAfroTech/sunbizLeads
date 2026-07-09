import { chromium } from 'playwright';

const url = 'https://mainstreet.org/our-network/main-street-communities?page=1';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
const data = await page.evaluate(() => {
  const h3s = [...document.querySelectorAll('h3')].slice(0, 2).map((h) => ({
    text: h.innerText.trim(),
    outer: h.closest('article, div, li, section')?.outerHTML?.slice(0, 900),
  }));
  const nextBtns = [...document.querySelectorAll('a, button')].filter((el) => {
    const t = (el.textContent || '').trim().toLowerCase();
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
    return t === 'next' || aria.includes('next') || /next/i.test(el.className || '');
  });
  const links72 = [...document.querySelectorAll('a')].filter((a) => (a.textContent || '').trim() === '72');
  const cards = [...document.querySelectorAll('.card--page__inner')].map((c) => {
    const name = c.querySelector('h3')?.innerText?.trim() || '';
    const items = [...c.querySelectorAll('.location-list__item')].map((li) => li.innerText.trim());
    const website = c.querySelector('a.has-icon.icon--website')?.href || '';
    const tag = c.querySelector('.tag')?.innerText?.trim() || '';
    return { name, items, website, tag };
  });
  const pag = document.querySelector('.pagination, [class*="pagination"]');
  return {
    cardCount: cards.length,
    cards: cards.slice(0, 3),
    h3count: document.querySelectorAll('h3').length,
    h3samples: h3s,
    nextBtns: nextBtns.map((el) => ({
      tag: el.tagName,
      text: (el.textContent || '').trim(),
      aria: el.getAttribute('aria-label'),
      href: el.getAttribute('href'),
      class: el.className,
    })),
    links72: links72.map((a) => ({ href: a.href, class: a.className })),
    pagHtml: pag?.outerHTML?.slice(0, 3500),
    pageLinks: [...document.querySelectorAll('a')]
      .filter((a) => /page=/.test(a.href || ''))
      .slice(0, 8)
      .map((a) => ({ text: a.textContent.trim(), href: a.href })),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
