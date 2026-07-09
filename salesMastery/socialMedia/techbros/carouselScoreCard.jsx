import { useState } from "react";

const LAYERS = [
  {
    id: "hook",
    label: "Hook Layer",
    tag: "Card 1",
    color: "#C8A96E",
    field: "title",
    fieldLabel: "Title Slide (hook)",
    criteria: [
      { id: "h1", do: true,  text: "Opens with a scenario or reframe — drops them in a moment they've lived or flips a belief" },
      { id: "h2", do: true,  text: "Hook is left open — question or incomplete thought that forces the swipe" },
      { id: "h3", do: true,  text: "Talks directly to the operator — 'your staff', 'your floor', 'your venue'" },
      { id: "h4", do: true,  text: "Has a clear thesis — a point of view underneath the post, not just a statement" },
      { id: "h5", do: false, text: "Hook resolves itself — full story told in slide 1 before they swipe" },
      { id: "h6", do: false, text: "Opens with a market stat or generic industry claim as the hook" },
      { id: "h7", do: false, text: "Product or brand name appears in the hook slide" },
    ]
  },
  {
    id: "body",
    label: "Body Slides (screens)",
    tag: "Card 1–2",
    color: "#9B8AFF",
    field: "screens",
    fieldLabel: "Body Slides (screens array)",
    criteria: [
      { id: "b1", do: true,  text: "Each slide builds tension — each one raises the stakes or adds a layer to the argument" },
      { id: "b2", do: true,  text: "Written as a practitioner — sounds like someone who's been on the floor, not read about it" },
      { id: "b3", do: true,  text: "Uses operator language — 'your floor', 'your shift', 'your table', 'your staff'" },
      { id: "b4", do: true,  text: "Names an invisible loss or unmeasured moment — something real happening that nobody tracks" },
      { id: "b5", do: false, text: "Product or brand name appears anywhere in the body slides" },
      { id: "b6", do: false, text: "Body slides repeat the same idea — multiple slides making the same point differently" },
      { id: "b7", do: false, text: "Written like an educator — informs instead of resonates, explains instead of implicates" },
    ]
  },
  {
    id: "ending",
    label: "Open Loop Ending (finalSetup)",
    tag: "Card 2",
    color: "#6FCF97",
    field: "finalSetup",
    fieldLabel: "Final Setup Slide (finalSetup)",
    criteria: [
      { id: "e1", do: true,  text: "Ends on an unfinished implication — reader has a question they didn't have before" },
      { id: "e2", do: true,  text: "Final question can't be answered in one word — pulls a real story or a real number" },
      { id: "e3", do: true,  text: "Question is operator-specific — not a consumer question, not a generic reflection" },
      { id: "e4", do: true,  text: "Hints at a larger pattern — this is one moment inside a system they haven't seen fully" },
      { id: "e5", do: false, text: "Final slide summarizes what the carousel already said — closes the loop" },
      { id: "e6", do: false, text: "Ends with a clean takeaway or neat answer — no tension left" },
      { id: "e7", do: false, text: "Question is too broad — 'what do you think?' or 'drop a comment' energy" },
    ]
  },
  {
    id: "profile",
    label: "Profile Curiosity",
    tag: "Card 3",
    color: "#56CCF2",
    criteria: [
      { id: "p1", do: true,  text: "Post feels like part of a system — one chapter in a larger framework, not a standalone idea" },
      { id: "p2", do: true,  text: "Uses pattern language — 'most venues never measure this', 'this shows up everywhere'" },
      { id: "p3", do: true,  text: "Creates the 'what else does this person know?' feeling — gaps left intentionally" },
      { id: "p4", do: false, text: "Explains everything — full resolution, no reason to follow or visit the profile" },
      { id: "p5", do: false, text: "Sounds like general marketing advice — interchangeable with any content creator" },
    ]
  },
  {
    id: "cta",
    label: "CTA Integration",
    tag: "Card 4",
    color: "#EB5757",
    criteria: [
      { id: "c1", do: true,  text: "If CTA present — framed as a diagnostic tool, not a pitch ('see this in your own numbers')" },
      { id: "c2", do: true,  text: "Thought leadership post — no CTA present (curiosity is the close)" },
      { id: "c3", do: false, text: "CTA uses urgency language — 'don't miss this', 'start now', 'see results instantly'" },
      { id: "c4", do: false, text: "CTA is the conclusion of the post — content feels like it was built to funnel" },
    ]
  }
];

const SCORE_BANDS = [
  { min: 0,  max: 3,  label: "Don't post",        color: "#EB5757", sub: "Fundamental rules violated. Rewrite before publishing." },
  { min: 4,  max: 5,  label: "Needs work",         color: "#F2994A", sub: "Some rules broken. Fix the flagged items first." },
  { min: 6,  max: 7,  label: "Post with caution",  color: "#C8A96E", sub: "Mostly clean. One or two gaps that could hurt reach." },
  { min: 8,  max: 9,  label: "Strong — post it",   color: "#6FCF97", sub: "All major rules met. Expect solid distribution." },
  { min: 10, max: 10, label: "Post immediately",   color: "#56CCF2", sub: "Perfect score. Built to travel." },
];

const PREDICTIONS = [
  { score: [0,3],   views: "< 500",    saves: "0",    shares: "0",    profile: "Low" },
  { score: [4,5],   views: "500–1K",   saves: "0–1",  shares: "0–1",  profile: "Low" },
  { score: [6,7],   views: "1K–3K",    saves: "1–3",  shares: "1–2",  profile: "Medium" },
  { score: [8,9],   views: "3K–7K",    saves: "2–5",  shares: "2–4",  profile: "High" },
  { score: [10,10], views: "7K+",      saves: "5+",   shares: "4+",   profile: "Very High" },
];

function getBand(score) {
  return SCORE_BANDS.find(b => score >= b.min && score <= b.max);
}
function getPrediction(score) {
  return PREDICTIONS.find(p => score >= p.score[0] && score <= p.score[1]);
}

// ── Parser: extract carousels from pasted DATA array ──
function parseDataBlock(raw) {
  const carousels = [];
  // Match each object block between outermost { }
  const dayMatches = [...raw.matchAll(/day:\s*['"`](.*?)['"`]/g)];
  const titleMatches = [...raw.matchAll(/title:\s*['"`]([\s\S]*?)['"`]\s*,?\s*\n/g)];
  const finalMatches = [...raw.matchAll(/finalSetup:\s*['"`]([\s\S]*?)['"`]\s*\n/g)];

  // Extract screens arrays
  const screensMatches = [...raw.matchAll(/screens:\s*\[([\s\S]*?)\]/g)];

  dayMatches.forEach((dm, i) => {
    const title = titleMatches[i]?.[1]?.trim() || "";
    const finalSetup = finalMatches[i]?.[1]?.trim() || "";
    const screensRaw = screensMatches[i]?.[1] || "";
    const screens = [...screensRaw.matchAll(/['"`]([\s\S]*?)['"`]/g)]
      .map(m => m[1].trim())
      .filter(s => s.length > 0);

    carousels.push({
      day: dm[1],
      title,
      screens,
      finalSetup,
    });
  });

  return carousels;
}

export default function CarouselScorer() {
  const [mode, setMode] = useState("paste"); // "paste" | "manual"
  const [pasteInput, setPasteInput] = useState("");
  const [carousels, setCarousels] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [parseError, setParseError] = useState("");
  const [checks, setChecks] = useState({});
  const [na, setNa] = useState({});
  const [postType, setPostType] = useState("thought");
  const [submitted, setSubmitted] = useState(false);

  const handleParse = () => {
    try {
      const parsed = parseDataBlock(pasteInput);
      if (!parsed.length) {
        setParseError("Could not find any carousels. Make sure you pasted the full DATA array including day, title, screens, and finalSetup fields.");
        return;
      }
      setCarousels(parsed);
      setSelectedIdx(0);
      setParseError("");
      setChecks({});
      setNa({});
      setSubmitted(false);
      setMode("score");
    } catch(e) {
      setParseError("Parse error — " + e.message);
    }
  };

  const selected = carousels[selectedIdx];

  const toggle = (id) => setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleNa = (id) => {
    setNa(prev => ({ ...prev, [id]: !prev[id] }));
    setChecks(prev => ({ ...prev, [id]: false }));
  };

  const calcScore = () => {
    let score = 0; let total = 0;
    LAYERS.forEach(layer => {
      layer.criteria.forEach(c => {
        if (na[c.id]) return;
        total++;
        const checked = !!checks[c.id];
        if (c.do && checked) score++;
        if (!c.do && !checked) score++;
      });
    });
    return total === 0 ? 0 : Math.round((score / total) * 10);
  };

  const getViolations = () => {
    const v = [];
    LAYERS.forEach(layer => {
      layer.criteria.forEach(c => {
        if (na[c.id]) return;
        const checked = !!checks[c.id];
        if (c.do && !checked) v.push({ ...c, layer: layer.label, color: layer.color });
        if (!c.do && checked) v.push({ ...c, layer: layer.label, color: layer.color });
      });
    });
    return v;
  };

  const score = calcScore();
  const band = getBand(score);
  const pred = getPrediction(score);
  const violations = getViolations();

  const switchCarousel = (idx) => {
    setSelectedIdx(idx);
    setChecks({});
    setNa({});
    setSubmitted(false);
  };

  const s = { background: "#0a0a0a", minHeight: "100vh", fontFamily: "system-ui, sans-serif", color: "#e0e0e0", paddingBottom: 80 };

  // ── PASTE MODE ──
  if (mode === "paste") return (
    <div style={s}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "36px 48px 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8A96E", marginBottom: 8 }}>Pre-Post Scoring System</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#f0f0f0" }}>CAROUSEL SCORECARD</div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>Paste your DATA array to score any carousel against all 4 rule layers.</div>
      </div>

      <div style={{ padding: "32px 48px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>
          Paste DATA array from your carousel HTML file
        </div>
        <textarea
          value={pasteInput}
          onChange={e => setPasteInput(e.target.value)}
          placeholder={`Paste the const DATA = [ ... ] block here.\n\nEach entry needs: day, title, screens, finalSetup`}
          style={{
            width: "100%", height: 280,
            background: "#0f0f0f", border: "1px solid #222",
            borderRadius: 6, padding: "16px 18px",
            color: "#c8c8c8", fontSize: 12, fontFamily: "monospace",
            lineHeight: 1.6, resize: "vertical", outline: "none"
          }}
        />
        {parseError && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#EB5757", lineHeight: 1.5 }}>{parseError}</div>
        )}

        {/* Format reference */}
        <div style={{ marginTop: 20, padding: "16px 20px", background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C8A96E", marginBottom: 10 }}>Expected Format</div>
          <pre style={{ fontSize: 11, color: "#555", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{`const DATA = [
  {
    day: 'Reel 1 — The Willingness Gap',
    title: 'YOUR HOOK GOES HERE.',
    screens: [
      'Body slide 1 text.',
      'Body slide 2 text.',
      'Body slide 3 text.',
    ],
    finalSetup: 'Your engagement question goes here?'
  },
  ...
]`}</pre>
          <div style={{ marginTop: 12, fontSize: 11, color: "#444", lineHeight: 1.6 }}>
            <span style={{ color: "#C8A96E", fontWeight: 700 }}>title</span> = hook slide · <span style={{ color: "#9B8AFF", fontWeight: 700 }}>screens</span> = body slides · <span style={{ color: "#6FCF97", fontWeight: 700 }}>finalSetup</span> = closing question
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            onClick={handleParse}
            style={{ flex: 1, padding: "14px 0", background: "linear-gradient(135deg, #9A7828, #C8A96E)", border: "none", borderRadius: 6, color: "#0a0a0a", fontSize: 13, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" }}
          >Parse & Score Carousels</button>
          <button
            onClick={() => setMode("manual")}
            style={{ padding: "14px 24px", background: "transparent", border: "1px solid #222", borderRadius: 6, color: "#555", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
          >Manual Mode</button>
        </div>
      </div>
    </div>
  );

  // ── SCORE MODE ──
  return (
    <div style={s}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "28px 48px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8A96E", marginBottom: 6 }}>Carousel Scorecard</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0" }}>SELECT A CAROUSEL TO SCORE</div>
        </div>
        <button onClick={() => { setMode("paste"); setCarousels([]); }} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #222", borderRadius: 4, color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>← Back</button>
      </div>

      {/* Carousel selector */}
      <div style={{ padding: "20px 48px 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {carousels.map((c, i) => (
          <button key={i} onClick={() => switchCarousel(i)} style={{
            padding: "8px 14px",
            borderRadius: 4,
            border: i === selectedIdx ? "1px solid #C8A96E" : "1px solid #1e1e1e",
            background: i === selectedIdx ? "rgba(200,169,110,0.12)" : "#0f0f0f",
            color: i === selectedIdx ? "#C8A96E" : "#555",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            cursor: "pointer", textAlign: "left"
          }}>{c.day}</button>
        ))}
      </div>

      {selected && (
        <>
          {/* Selected carousel preview */}
          <div style={{ margin: "20px 48px 0", padding: "18px 22px", background: "#0c0c0c", border: "1px solid #181818", borderRadius: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>Carousel Preview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "#C8A96E", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Hook (title)</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{selected.title}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#9B8AFF", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Body ({selected.screens.length} slides)</div>
                {selected.screens.map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#555", lineHeight: 1.5, marginBottom: 4, borderLeft: "2px solid #1e1e1e", paddingLeft: 8 }}>
                    <span style={{ color: "#333", marginRight: 6 }}>{i+1}.</span>{s.length > 60 ? s.slice(0,60) + "…" : s}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#6FCF97", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Close (finalSetup)</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{selected.finalSetup}</div>
              </div>
            </div>
          </div>

          {/* Post type */}
          <div style={{ padding: "20px 48px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Post Type</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["thought","Thought Leadership"],["educational","Educational"],["activation","Activation"]].map(([val,label]) => (
                <button key={val} onClick={() => setPostType(val)} style={{
                  padding: "7px 16px", borderRadius: 4,
                  border: postType === val ? "1px solid #C8A96E" : "1px solid #1e1e1e",
                  background: postType === val ? "rgba(200,169,110,0.1)" : "transparent",
                  color: postType === val ? "#C8A96E" : "#444",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer"
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Scoring layers */}
          <div style={{ padding: "24px 48px 0" }}>
            {LAYERS.map((layer) => (
              <div key={layer.id} style={{ marginBottom: 24, border: "1px solid #141414", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "14px 22px", background: "#0c0c0c", borderBottom: "1px solid #141414", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: layer.color, background: `${layer.color}15`, padding: "2px 8px", borderRadius: 3, border: `1px solid ${layer.color}25` }}>{layer.tag}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#d0d0d0" }}>{layer.label}</div>
                  {layer.fieldLabel && <div style={{ fontSize: 11, color: "#333", marginLeft: "auto" }}>→ {layer.fieldLabel}</div>}
                </div>
                {layer.criteria.map((c, ci) => {
                  const isNa = !!na[c.id];
                  const isChecked = !!checks[c.id];
                  const passing = isNa ? null : (c.do ? isChecked : !isChecked);
                  return (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 22px",
                      borderBottom: ci < layer.criteria.length - 1 ? "1px solid #0f0f0f" : "none",
                      background: submitted && !isNa ? (passing ? "rgba(111,207,151,0.03)" : "rgba(235,87,87,0.04)") : "transparent"
                    }}>
                      <div style={{ flexShrink: 0, width: 30, height: 18, borderRadius: 3, background: c.do ? "rgba(111,207,151,0.1)" : "rgba(235,87,87,0.1)", border: `1px solid ${c.do ? "#6FCF9728" : "#EB575728"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: c.do ? "#6FCF97" : "#EB5757", marginTop: 2, flexShrink: 0 }}>{c.do ? "DO" : "NOT"}</div>
                      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: isNa ? "#2a2a2a" : "#999", textDecoration: isNa ? "line-through" : "none" }}>{c.text}</div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => !isNa && toggle(c.id)} style={{ width: 68, padding: "4px 0", borderRadius: 3, border: isChecked && !isNa ? `1px solid ${c.do ? "#6FCF97" : "#EB5757"}` : "1px solid #1a1a1a", background: isChecked && !isNa ? (c.do ? "rgba(111,207,151,0.12)" : "rgba(235,87,87,0.12)") : "transparent", color: isChecked && !isNa ? (c.do ? "#6FCF97" : "#EB5757") : "#333", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: isNa ? "not-allowed" : "pointer", opacity: isNa ? 0.3 : 1 }}>{isChecked ? "✓ YES" : "YES"}</button>
                        <button onClick={() => toggleNa(c.id)} style={{ width: 36, padding: "4px 0", borderRadius: 3, border: isNa ? "1px solid #333" : "1px solid #1a1a1a", background: isNa ? "rgba(255,255,255,0.04)" : "transparent", color: isNa ? "#555" : "#222", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>N/A</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Score button */}
          <div style={{ padding: "0 48px" }}>
            <button onClick={() => setSubmitted(true)} style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg, #9A7828, #C8A96E)", border: "none", borderRadius: 6, color: "#0a0a0a", fontSize: 13, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" }}>Score This Carousel</button>
          </div>

          {/* Results */}
          {submitted && (() => {
            return (
              <div style={{ padding: "24px 48px 0" }}>
                <div style={{ border: `1px solid ${band.color}35`, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ padding: "24px 28px", background: `${band.color}08`, display: "flex", alignItems: "center", gap: 28, borderBottom: `1px solid ${band.color}18` }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 72, fontWeight: 900, color: band.color, lineHeight: 1 }}>{score}</div>
                      <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>out of 10</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: band.color, marginBottom: 6 }}>{band.label}</div>
                      <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{band.sub}</div>
                    </div>
                  </div>
                  <div style={{ padding: "18px 28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                    {[["Predicted Views", pred.views], ["Expected Saves", pred.saves], ["Expected Shares", pred.shares], ["Profile Visit Rate", pred.profile]].map(([label, val]) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#d0d0d0" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {violations.length > 0 ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#EB5757", marginBottom: 12 }}>{violations.length} Rule{violations.length > 1 ? "s" : ""} Violated</div>
                    {violations.map((v, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "11px 16px", background: "#0c0c0c", border: "1px solid #141414", borderRadius: 5, marginBottom: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#EB5757", flexShrink: 0, marginTop: 5 }} />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: v.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{v.layer}</div>
                          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{v.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "14px 18px", background: "rgba(111,207,151,0.05)", border: "1px solid rgba(111,207,151,0.15)", borderRadius: 6, marginBottom: 20, fontSize: 13, color: "#6FCF97" }}>✓ No violations. All rules met. Post this.</div>
                )}

                <button onClick={() => { setChecks({}); setNa({}); setSubmitted(false); }} style={{ width: "100%", padding: "12px 0", background: "transparent", border: "1px solid #1a1a1a", borderRadius: 6, color: "#333", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}>Clear & Re-Score This Carousel</button>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}