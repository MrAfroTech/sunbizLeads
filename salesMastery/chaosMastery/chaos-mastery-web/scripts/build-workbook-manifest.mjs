/**
 * Reads chaos_mastery_ch*.html (read-only) → chaos-mastery-landing-pages/cm-workbook-manifest.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, HTMLElement } from 'node-html-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHAOS_DIR = path.resolve(ROOT, '..');
const OUT = path.join(ROOT, 'chaos-mastery-landing-pages', 'cm-workbook-manifest.json');

function hasClass(el, name) {
  const c = el.getAttribute('class') || '';
  return new RegExp(`(^|\\s)${name}(\\s|$)`).test(c);
}

function nextFieldId(chapter, kind, idx) {
  const ch = `ch${chapter}`;
  if (kind === 'reflection') return `${ch}_reflection_${idx}`;
  if (kind === 'chk') return `${ch}_chk_${idx}`;
  return `${ch}_field_${idx}`;
}

function textClean(el) {
  if (!el) return '';
  return el.text.trim();
}

/** Matches `.fill-line` and chapter HTML that uses bordered blank rows instead */
function isLinePlaceholder(el) {
  if (!(el instanceof HTMLElement)) return false;
  if (hasClass(el, 'fill-line') || hasClass(el, 'fill-line-dark')) return true;
  if (el.tagName.toLowerCase() !== 'div') return false;
  const st = el.getAttribute('style') || '';
  return (
    (/border-bottom:\s*1px\s+solid/i.test(st) && /height:\s*\d+px/i.test(st)) ||
    (/border-bottom:\s*1px\s+solid\s+rgba/i.test(st) && /height:\s*18px/i.test(st))
  );
}

function extractFillCard(el, chapter, ids, variant) {
  const labelEl = el.querySelector('.fill-label');
  const hintSel = variant === 'fill-card-dark' ? '.hint-dark' : '.hint';
  const hintEl = el.querySelector(hintSel);
  ids.field += 1;
  return {
    type: 'textarea',
    variant,
    fieldId: nextFieldId(chapter, 'field', ids.field),
    label: textClean(labelEl),
    hint: textClean(hintEl),
  };
}

function extractReflection(el, chapter, ids) {
  const tag = textClean(el.querySelector('.reflection-tag'));
  const q = textClean(el.querySelector('.reflection-q'));
  ids.reflection += 1;
  return {
    type: 'textarea',
    variant: 'reflection-card',
    fieldId: nextFieldId(chapter, 'reflection', ids.reflection),
    label: tag,
    question: q,
  };
}

function extractChkRow(el, chapter, ids) {
  const txt = el.querySelector('.chk-text');
  ids.chk += 1;
  return {
    type: 'checkbox',
    fieldId: nextFieldId(chapter, 'chk', ids.chk),
    labelHtml: txt ? txt.innerHTML.trim() : el.innerHTML.trim(),
  };
}

function consumeFillLabelSequence(children, startIdx, chapter, ids, variantHint) {
  const first = children[startIdx];
  if (!first || !hasClass(first, 'fill-label')) return null;
  let j = startIdx + 1;
  while (j < children.length && !isLinePlaceholder(children[j])) {
    j += 1;
  }
  let lineCount = 0;
  while (j < children.length && isLinePlaceholder(children[j])) {
    lineCount += 1;
    j += 1;
  }
  if (lineCount === 0) return null;
  ids.field += 1;
  return {
    block: {
      type: 'textarea',
      variant: variantHint || 'inline-lines',
      fieldId: nextFieldId(chapter, 'field', ids.field),
      label: textClean(first),
      hint: '',
    },
    nextIndex: j,
  };
}

/** Lines after prose blocks inside a styled container (no fill-label) */
function tryAnonymousLinesBlock(el, chapter, ids, blocks) {
  const kids = el.childNodes.filter((n) => n instanceof HTMLElement);
  const lineIdx = kids.findIndex((k) => isLinePlaceholder(k));
  if (lineIdx === -1) return false;
  if (kids.slice(0, lineIdx).some((k) => hasClass(k, 'fill-label'))) return false;

  const preamble = kids.slice(0, lineIdx);
  const headlines = preamble.filter((p) => {
    const st = p.getAttribute('style') || '';
    return /uppercase|text-transform:\s*uppercase/i.test(st) || hasClass(p, 'label');
  });
  const label = headlines.length ? textClean(headlines[headlines.length - 1]) : 'Your notes';

  if (preamble.length) {
    blocks.push({
      type: 'html',
      html: preamble.map((p) => p.outerHTML.trim()).join(''),
    });
  }

  ids.field += 1;
  blocks.push({
    type: 'textarea',
    variant: 'block-lines',
    fieldId: nextFieldId(chapter, 'field', ids.field),
    label,
    hint: '',
  });

  const after = kids.slice(lineIdx).filter((k) => !isLinePlaceholder(k));
  for (const a of after) {
    walkNode(a, chapter, ids, blocks);
  }
  return true;
}

function gridTemplateColumnCount(el) {
  const st = el.getAttribute('style') || '';
  const m = /grid-template-columns:\s*([^;]+)/i.exec(st);
  if (!m) return 0;
  return m[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Chapter 18-style rows: rank · metric · static columns · one fill-line (current value) · target */
function tryRankedMetricRow(el, chapter, ids, blocks) {
  const kids = el.childNodes.filter((n) => n instanceof HTMLElement);
  const st = el.getAttribute('style') || '';
  if (!/display:\s*grid/i.test(st) || kids.length < 3) return false;
  const fillIdx = [];
  kids.forEach((k, i) => {
    if (hasClass(k, 'fill-line') || hasClass(k, 'fill-line-dark') || isLinePlaceholder(k)) {
      fillIdx.push(i);
    }
  });
  if (fillIdx.length !== 1) return false;
  const metric = textClean(kids[1]);
  if (!metric) return false;
  const rank = textClean(kids[0]);
  ids.field += 1;
  blocks.push({
    type: 'textarea',
    variant: 'inline-lines',
    fieldId: nextFieldId(chapter, 'field', ids.field),
    label: `${metric}${rank ? ` (${rank})` : ''} — Current value`,
    hint: '',
  });
  return true;
}

/** Chapter 10-style rows: channel label + N fill-line cells */
function tryChannelAuditRow(el, chapter, ids, blocks) {
  const kids = el.childNodes.filter((n) => n instanceof HTMLElement);
  const st = el.getAttribute('style') || '';
  if (!/display:\s*grid/i.test(st) || kids.length < 2) return false;
  const rest = kids.slice(1);
  if (!rest.every((k) => hasClass(k, 'fill-line') || hasClass(k, 'fill-line-dark') || isLinePlaceholder(k))) {
    return false;
  }
  const channel = textClean(kids[0]);
  if (!channel) return false;
  let hdrs;
  if (/130px\s+1fr\s+90px/i.test(st)) {
    hdrs = [
      '% Customers captured / notes',
      'Control score (1–10)',
      'Using for marketing?',
      'Owned %',
    ];
  } else if (/90px\s+80px\s+70px/i.test(st)) {
    hdrs = ['Current flow time', 'Friction (1–10)', 'Redesign move', 'AI boost'];
  } else {
    hdrs = rest.map((_, idx) => `Column ${idx + 1}`);
  }
  rest.forEach((_, idx) => {
    ids.field += 1;
    blocks.push({
      type: 'textarea',
      variant: 'inline-lines',
      fieldId: nextFieldId(chapter, 'field', ids.field),
      label: `${channel} — ${hdrs[idx] || `Column ${idx + 1}`}`,
      hint: '',
    });
  });
  return true;
}

function walkNode(el, chapter, ids, blocks) {
  if (!(el instanceof HTMLElement)) return;
  const tag = el.tagName.toLowerCase();
  const cls = el.getAttribute('class') || '';

  if (tag === 'div' && tryRankedMetricRow(el, chapter, ids, blocks)) return;

  if (tag === 'div' && tryChannelAuditRow(el, chapter, ids, blocks)) return;

  if (hasClass(el, 'fill-line') || hasClass(el, 'fill-line-dark')) {
    ids.field += 1;
    blocks.push({
      type: 'textarea',
      variant: 'inline-lines',
      fieldId: nextFieldId(chapter, 'field', ids.field),
      label: 'Workbook entry',
      hint: '',
    });
    return;
  }

  if (hasClass(el, 'chk-row')) {
    blocks.push(extractChkRow(el, chapter, ids));
    return;
  }

  if (hasClass(el, 'reflection-card')) {
    blocks.push(extractReflection(el, chapter, ids));
    return;
  }

  if (hasClass(el, 'fill-card-dark') || /\bfill-card-dark\b/.test(cls)) {
    blocks.push(extractFillCard(el, chapter, ids, 'fill-card-dark'));
    return;
  }

  if (hasClass(el, 'fill-card')) {
    blocks.push(extractFillCard(el, chapter, ids, 'fill-card'));
    return;
  }

  const rawText = el.text.trimStart();
  if (tag === 'div' && rawText.startsWith('☐')) {
    ids.chk += 1;
    blocks.push({
      type: 'checkbox',
      fieldId: nextFieldId(chapter, 'chk', ids.chk),
      labelHtml: el.innerHTML.trim(),
    });
    return;
  }

  const kids = el.childNodes.filter((n) => n instanceof HTMLElement);

  const colCount = gridTemplateColumnCount(el);
  const treatAsTwoColLayout =
    hasClass(el, 'grid-2') ||
    (tag === 'div' && /grid-template-columns/i.test(el.getAttribute('style') || '') && colCount > 0 && colCount <= 2);

  if (tag === 'div' && /grid-template-columns/i.test(el.getAttribute('style') || '') && colCount > 2) {
    for (const child of kids) {
      walkNode(child, chapter, ids, blocks);
    }
    return;
  }

  if (treatAsTwoColLayout) {
    const columns = [];
    for (const col of kids) {
      const inner = [];
      walkNode(col, chapter, ids, inner);
      columns.push(inner);
    }
    blocks.push({ type: 'grid', columns });
    return;
  }

  if (tag === 'p') {
    blocks.push({ type: 'html', html: el.outerHTML.trim() });
    return;
  }

  if (hasClass(el, 'callout') || hasClass(el, 'page-intro')) {
    blocks.push({ type: 'html', html: el.outerHTML.trim() });
    return;
  }

  if (tag === 'div' && kids.length && tryAnonymousLinesBlock(el, chapter, ids, blocks)) {
    return;
  }

  if (tag === 'div' && kids.length) {
    const bg = el.getAttribute('style') || '';
    const darkCell = /background:\s*#1A2A44/i.test(bg) || /background:\s*#1a2a44/i.test(bg);
    let i = 0;
    while (i < kids.length) {
      const seq = consumeFillLabelSequence(kids, i, chapter, ids, darkCell ? 'inline-dark' : 'inline-lines');
      if (seq) {
        blocks.push(seq.block);
        i = seq.nextIndex;
        continue;
      }
      walkNode(kids[i], chapter, ids, blocks);
      i += 1;
    }
    return;
  }

  if (tag === 'div') {
    blocks.push({ type: 'html', html: el.outerHTML.trim() });
  }
}

function findMainColumn(pageEl) {
  const byClass =
    pageEl.querySelector('.pc') ||
    pageEl.querySelector('.wb-pc') ||
    pageEl.querySelector('.pc-full') ||
    pageEl.querySelector('.navy-bg') ||
    pageEl.querySelector('[class*="main-column"]');
  if (byClass) return byClass;
  const kids = pageEl.childNodes.filter((n) => n instanceof HTMLElement);
  return (
    kids.find((el) => {
      const st = el.getAttribute('style') || '';
      return /flex:\s*1/.test(st) && /flex-direction:\s*column/.test(st);
    }) || null
  );
}

function pickWorkbookPages(pages) {
  const byId = new Map(
    pages.map((p) => [p.getAttribute('id') || '', p]).filter(([id]) => id),
  );
  if (byId.has('fg11') && byId.has('fg12')) {
    return [byId.get('fg11'), byId.get('fg12')];
  }
  return [pages[pages.length - 3], pages[pages.length - 2]];
}

function extractPageBlocks(pc, chapter) {
  const ids = { field: 0, reflection: 0, chk: 0 };
  const blocks = [];
  const kids = pc.childNodes.filter((n) => n instanceof HTMLElement);
  for (const k of kids) {
    walkNode(k, chapter, ids, blocks);
  }
  return { blocks, ids };
}

function extractChapter(chapter) {
  const fp = path.join(CHAOS_DIR, `chaos_mastery_ch${chapter}.html`);
  const html = fs.readFileSync(fp, 'utf8');
  const root = parse(html, { lowerCaseTagName: true });
  const pages = root.querySelectorAll('.page');
  if (pages.length < 3) {
    throw new Error(`Chapter ${chapter}: expected ≥3 .page, got ${pages.length}`);
  }
  const [pA, pB] = pickWorkbookPages(pages);

  const pcA = findMainColumn(pA);
  const pcB = findMainColumn(pB);
  if (!pcA || !pcB) throw new Error(`Chapter ${chapter}: missing main column (.pc / .wb-pc / flex column)`);

  const titleEl = pcA.querySelector('.ch-title');
  let sectionTitle = titleEl ? textClean(titleEl) : '';
  if (!sectionTitle) {
    const cand = pcA.querySelectorAll('div');
    for (const d of cand) {
      const t = textClean(d);
      if (/chapter\s+\d+\s+workbook/i.test(t) && t.length < 120) {
        sectionTitle = t;
        break;
      }
    }
  }
  if (!sectionTitle) sectionTitle = `Chapter ${chapter} Workbook Exercise`;

  const introEl =
    pcA.querySelector('.page-intro') ||
    pcA.querySelector('.ch-intro') ||
    pcA.querySelector('[style*="DM Serif Display"][style*="italic"]');

  let introHtml = '';
  if (introEl && !introEl.closest('.exercise-box')) {
    introHtml = introEl.outerHTML.trim();
  }

  const outA = extractPageBlocks(pcA, chapter);
  const outB = extractPageBlocks(pcB, chapter);

  const blocks = [...outA.blocks, ...outB.blocks];
  return {
    chapter,
    sectionTitle,
    introHtml,
    blocks,
  };
}

const manifest = {};
for (let ch = 1; ch <= 21; ch++) {
  manifest[ch] = extractChapter(ch);
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 0), 'utf8');
console.log('Wrote', OUT, 'bytes', fs.statSync(OUT).size);
