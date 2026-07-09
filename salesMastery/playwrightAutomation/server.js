import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function sanitizeUrl(url) {
  const s = firstNonEmpty(url);
  if (!s) throw new Error("Missing url");
  let parsed;
  try {
    parsed = new URL(s);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("URL must start with http(s)://");
  }
  return parsed.toString();
}

function scoreStaffyText(text) {
  const t = (text || "").toLowerCase();
  const hits = [
    "staff",
    "team",
    "leadership",
    "management",
    "coaches",
    "front office",
    "directory",
    "people",
    "our team",
    "meet the team"
  ];
  let score = 0;
  for (const h of hits) if (t.includes(h)) score += 1;
  return score;
}

function buildCardCandidates(snapshot) {
  const { candidates, bySelector } = snapshot;
  const all = [];
  for (const sel of Object.keys(candidates)) {
    const cards = candidates[sel] || [];
    const entry = {
      selector: sel,
      count: cards.length,
      examples: cards.slice(0, 6),
      hintScore:
        (bySelector?.[sel]?.classHintScore || 0) +
        (bySelector?.[sel]?.textHintScore || 0) +
        (bySelector?.[sel]?.repeatabilityScore || 0)
    };
    all.push(entry);
  }
  all.sort((a, b) => b.hintScore - a.hintScore || b.count - a.count);
  return all;
}

app.post("/api/analyze", async (req, res) => {
  const startedAt = Date.now();
  let url;
  try {
    url = sanitizeUrl(req.body?.url);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
    return;
  }

  const headless = req.body?.headless !== false;

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  });

  let page;
  try {
    page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

    // Try to settle common SPA/lazy content without over-waiting.
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const analysis = await page.evaluate(() => {
      const pick = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className: el.className ? String(el.className) : null,
          text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140),
          href: el.getAttribute?.("href") || null,
          imgAlt:
            el.querySelector?.("img")?.getAttribute?.("alt") ||
            el.querySelector?.("img")?.getAttribute?.("aria-label") ||
            null,
          imgSrc: el.querySelector?.("img")?.getAttribute?.("src") || null,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            w: Math.round(rect.width),
            h: Math.round(rect.height)
          },
          computed: {
            display: style.display,
            position: style.position,
            borderRadius: style.borderRadius,
            boxShadow: style.boxShadow
          }
        };
      };

      const cssEscape = (s) => {
        // minimal CSS.escape polyfill enough for ids/classes
        return String(s).replace(/[^a-zA-Z0-9_-]/g, (m) => `\\${m}`);
      };

      const buildSelectorFor = (el) => {
        if (!el || el.nodeType !== 1) return null;
        if (el.id) return `#${cssEscape(el.id)}`;

        const parts = [];
        let cur = el;
        for (let depth = 0; depth < 5 && cur && cur.nodeType === 1; depth++) {
          let part = cur.tagName.toLowerCase();
          const cls = (cur.className ? String(cur.className) : "")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3);
          if (cls.length) part += "." + cls.map(cssEscape).join(".");
          parts.unshift(part);
          cur = cur.parentElement;
        }
        return parts.join(" > ");
      };

      const classHints = [
        "staff",
        "team",
        "roster",
        "directory",
        "coach",
        "bio",
        "card",
        "grid",
        "person",
        "profile",
        "member",
        "people"
      ];

      const elements = Array.from(document.querySelectorAll("a, article, section, li, div"));
      const bySelector = {};
      const candidates = {};

      const addCandidate = (sel, el) => {
        if (!sel) return;
        const key = sel;
        if (!candidates[key]) candidates[key] = [];
        candidates[key].push(pick(el));
      };

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 240 || rect.height < 80) continue;
        if (rect.y < -400 || rect.y > window.innerHeight * 3) continue;

        const className = el.className ? String(el.className) : "";
        const classLower = className.toLowerCase();
        const textLower = (el.textContent || "").toLowerCase();

        const classHintScore = classHints.reduce(
          (acc, h) => acc + (classLower.includes(h) ? 1 : 0),
          0
        );
        const textHintScore = ["coach", "director", "manager", "vp", "head", "assistant"].reduce(
          (acc, h) => acc + (textLower.includes(h) ? 1 : 0),
          0
        );

        const sel = buildSelectorFor(el);
        if (!sel) continue;

        if (!bySelector[sel]) bySelector[sel] = { classHintScore: 0, textHintScore: 0, repeatabilityScore: 0 };
        bySelector[sel].classHintScore += classHintScore;
        bySelector[sel].textHintScore += textHintScore;

        if (classHintScore + textHintScore >= 1) addCandidate(sel, el);
      }

      // Add some generic fallbacks that often represent “cards”.
      const genericSelectors = [
        "[class*='staff'] [class*='card']",
        "[class*='team'] [class*='card']",
        "[class*='directory'] [class*='card']",
        "[class*='people'] [class*='card']",
        "[class*='roster'] [class*='card']",
        "[class*='staff'] article",
        "[class*='team'] article"
      ];

      for (const s of genericSelectors) {
        try {
          const els = Array.from(document.querySelectorAll(s)).slice(0, 60);
          bySelector[s] = bySelector[s] || { classHintScore: 0, textHintScore: 0, repeatabilityScore: 0 };
          bySelector[s].repeatabilityScore += Math.min(els.length, 20);
          for (const el of els) addCandidate(s, el);
        } catch {
          // ignore invalid selectors
        }
      }

      const titleText =
        document.querySelector("h1")?.textContent ||
        document.title ||
        "";

      return {
        title: String(titleText).replace(/\s+/g, " ").trim().slice(0, 140),
        url: location.href,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        bySelector,
        candidates
      };
    });

    const cardCandidates = buildCardCandidates(analysis);

    // “Staff page likelihood” is just a hint for you during testing.
    const likelyStaffScore = scoreStaffyText(analysis.title);

    res.json({
      ok: true,
      url,
      title: analysis.title,
      likelyStaffScore,
      elapsedMs: Date.now() - startedAt,
      candidates: cardCandidates.slice(0, 30)
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e?.message || String(e),
      elapsedMs: Date.now() - startedAt
    });
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3177;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`playwrightAutomation server running on http://localhost:${PORT}`);
});

