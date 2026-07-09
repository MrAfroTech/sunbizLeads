/**
 * Injects workbook markup, stylesheet link, and scripts into each landing-*.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const LP = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  'chaos-mastery-landing-pages',
);

const FILES = fs.readdirSync(LP).filter((f) => /^landing-.*\.html$/.test(f));

function chapterFromHtml(html) {
  const m = html.match(/<div class="hero-kicker">\s*Chapter\s+(\d+)\s*<\/div>/i);
  if (!m) throw new Error('Could not parse chapter from landing hero-kicker');
  return parseInt(m[1], 10);
}

const WORKBOOK_TMPL = (chapter) => `
    <section id="cm-workbook-section" class="cm-workbook cm-loading" data-chapter="${chapter}" aria-busy="true" aria-label="Your workbook">
      <div class="cm-workbook-inner"></div>
    </section>
`;

for (const fn of FILES.sort()) {
  const fp = path.join(LP, fn);
  let html = fs.readFileSync(fp, 'utf8');
  if (html.includes('id="cm-workbook-section"')) {
    console.log('skip (already patched)', fn);
    continue;
  }

  const ch = chapterFromHtml(html);

  if (!html.includes('href="/cm-workbook.css"')) {
    html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="/cm-workbook.css">\n</head>');
  }

  const needle =
    '    </div>\n\n  </div>\n\n  <div class="nl-top-cta single-cta">';
  if (!html.includes(needle)) {
    throw new Error(`Unexpected layout in ${fn} — book-callout / nl-top-cta boundary not found`);
  }

  html = html.replace(
    needle,
    `    </div>\n${WORKBOOK_TMPL(ch).trimEnd()}\n\n  </div>\n\n  <div class="nl-top-cta single-cta">`,
  );

  const scripts =
    '\n  <script src="/cm-workbook-config.js"></script>\n  <script type="module" src="/cm-workbook.js"></script>\n';

  if (!html.includes('cm-workbook.js')) {
    html = html.replace(/<\/body>/i, `${scripts}</body>`);
  }

  fs.writeFileSync(fp, html, 'utf8');
  console.log('patched', fn, 'chapter', ch);
}
