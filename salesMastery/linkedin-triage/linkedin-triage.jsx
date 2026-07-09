import { useState, useCallback, useMemo } from "react";
import * as Papa from "papaparse";

const TIER_CONFIG = {
  1: { label: "Tier 1 — Hot ICP", color: "#FF4D00", desc: "Venues, arenas, stadiums, festivals, restaurants, bars — decision-makers" },
  2: { label: "Tier 2 — Warm", color: "#FFB800", desc: "Hospitality, F&B, events, tech — worth outreach" },
  3: { label: "Tier 3 — Low Priority", color: "#445", desc: "No obvious F&B / venue / hospitality connection" },
};

const TIER1_TITLES = [
  "general manager",
  "assistant general manager",
  "managing director",
  "managing partner",
  "executive director of operations",
  "regional director of operations",
  "director of stadium operations",
  "director of food and beverage",
  "director of food & beverage",
  "director of f&b",
  "food and beverage manager",
  "food & beverage manager",
  "f&b manager",
  "beverage manager",
  "senior beverage manager",
  "beverage director",
  "concessions manager",
  "concessions director",
  "merchandise director",
  "merchandise manager",
  "bar manager",
  "restaurant manager",
  "assistant restaurant manager",
  "proprietor",
  "owner",
  "co-owner",
  "business owner",
  "founder",
  "co-founder",
  "chief executive officer",
  "ceo",
  "chief operating officer",
  "coo",
  "chief financial officer",
  "chief revenue officer",
  "chief growth",
  "chief marketing officer",
  "president",
  "executive vp",
  "senior vice president",
  "vice president of partnerships",
  "vice president of strategy",
  "vice president of business",
  "sr. director of arena ticketing",
  "director of ticket sales",
  "director of group sales",
  "director of corporate partnerships",
  "director of partnerships",
  "director of marketing",
  "director of operations",
  "group sales manager",
  "manager of premium",
  "manager of group sales",
  "premium sales",
  "guest experience manager",
  "event manager",
  "venue manager",
  "operations supervisor",
  "game day operations",
  "gameday operations",
  "server",
  "cashier",
  "floor staff",
];

const TIER2_TITLES = [
  "account executive",
  "group sales account executive",
  "group sales",
  "ticket sales account executive",
  "ticket sales representative",
  "senior account executive",
  "inside sales representative",
  "inside sales consultant",
  "sales manager",
  "digital sales",
  "business development",
  "new business development",
  "partnerships development manager",
  "partnership marketing",
  "community relations",
  "director of community impact",
  "director of social media",
  "marketing manager",
  "manager of marketing",
  "manager of brand content",
  "manager of multimedia production",
  "social media coordinator",
  "content coordinator",
  "program manager",
  "project manager",
  "operations intern",
  "gameday operations intern",
  "championship and operations intern",
  "game operations staff",
  "production staff",
  "production team",
  "fan coordination",
  "hospitality account executive",
  "client solutions manager",
  "client relationship manager",
  "senior manager business operations",
  "senior associate",
  "associate manager",
  "operations",
  "manager",
  "director",
  "executive assistant",
  "chief of staff",
];

function scoreContact(title = "") {
  const t = title.toLowerCase();
  for (const kw of TIER1_TITLES) {
    if (t.includes(kw)) return 1;
  }
  for (const kw of TIER2_TITLES) {
    if (t.includes(kw)) return 2;
  }
  return 3;
}

const SAMPLE_DATA = [
  { "First Name": "Jordan", "Last Name": "Mills", "Company": "Chase Field", "Position": "Director of Hospitality", "Connected On": "2024-03-12" },
  { "First Name": "Priya", "Last Name": "Shah", "Company": "Lollapalooza", "Position": "Festival Operations Manager", "Connected On": "2024-01-05" },
  { "First Name": "Marcus", "Last Name": "Lee", "Company": "Tap House Group", "Position": "Bar Manager", "Connected On": "2023-11-20" },
  { "First Name": "Dana", "Last Name": "Torres", "Company": "Accenture", "Position": "Senior Consultant", "Connected On": "2023-09-14" },
  { "First Name": "Chris", "Last Name": "Walton", "Company": "Toyota Center", "Position": "VP of Operations", "Connected On": "2024-05-01" },
  { "First Name": "Sarah", "Last Name": "Kim", "Company": "Shake Shack", "Position": "Regional Manager", "Connected On": "2023-07-22" },
  { "First Name": "Tom", "Last Name": "Briggs", "Company": "Google", "Position": "Software Engineer", "Connected On": "2022-12-01" },
  { "First Name": "Alexis", "Last Name": "Rowe", "Company": "Hard Rock Stadium", "Position": "Concessions Director", "Connected On": "2024-02-18" },
  { "First Name": "Nina", "Last Name": "Patel", "Company": "Coachella Valley Music", "Position": "Head of Guest Experience", "Connected On": "2024-04-10" },
  { "First Name": "Derek", "Last Name": "Holt", "Company": "Marriott Hotels", "Position": "F&B Operations Director", "Connected On": "2023-08-30" },
];

function parseCSV(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
    });
  });
}

export default function LinkedInTriage() {
  const [contacts, setContacts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTier, setActiveTier] = useState("all");
  const [search, setSearch] = useState("");
  const [outreachDays, setOutreachDays] = useState(60);
  const [dragging, setDragging] = useState(false);

  const processContacts = (raw) => {
    const scored = raw
      .filter((r) => r["First Name"] || r["Last Name"] || r["first_name"] || r["last_name"])
      .map((r, i) => {
        const name = `${r["first_name"] || r["First Name"] || ""} ${r["last_name"] || r["Last Name"] || ""}`.trim();
        const company = r["current_company"] || r["Company"] || r["company"] || "";
        const title = r["current_company_position"] || r["Position"] || r["position"] || r["Title"] || "";
        const connectedOn = r["connected_at_iso"] || r["Connected On"] || r["connected_on"] || "";
        return {
          id: i,
          name,
          company,
          title,
          connectedOn,
          tier: scoreContact(title),
          status: "pending",
        };
      })
      .sort((a, b) => a.tier - b.tier);
    setContacts(scored);
    setLoaded(true);
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const raw = await parseCSV(file);
    processContacts(raw);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchTier = activeTier === "all" || c.tier === Number(activeTier);
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase());
      return matchTier && matchSearch;
    });
  }, [contacts, activeTier, search]);

  const tierCounts = useMemo(() => ({
    1: contacts.filter((c) => c.tier === 1).length,
    2: contacts.filter((c) => c.tier === 2).length,
    3: contacts.filter((c) => c.tier === 3).length,
  }), [contacts]);

  const outreachTotal = (tierCounts[1] || 0) + (tierCounts[2] || 0);
  const perDay = outreachDays > 0 ? Math.ceil(outreachTotal / outreachDays) : 0;

  const contactedCount = contacts.filter((c) => c.status === "contacted").length;
  const repliedCount = contacts.filter((c) => c.status === "replied").length;

  const markStatus = (id, status) => {
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, status: c.status === status ? "pending" : status } : c));
  };

  const changeTier = (id, newTier) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, tier: newTier } : c))
    );
  };

  const exportCSV = () => {
    const rows = [["Name", "Company", "Title", "Tier", "Status", "Connected On"]];
    contacts.forEach((c) => {
      rows.push([c.name, c.company, c.title, c.tier, c.status, c.connectedOn]);
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seamlessly-linkedin-triage.csv";
    a.click();
  };

  const resetTool = () => {
    setContacts([]);
    setLoaded(false);
    setActiveTier("all");
    setSearch("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      color: "#1a1a1a",
      fontFamily: "'DM Mono', 'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #e0e0e0",
        padding: "22px 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#ffffff",
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#FF4D00", textTransform: "uppercase", marginBottom: 5 }}>
            Seamlessly · Sales Ops
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#1a1a1a" }}>
            LinkedIn Connection Triage
          </div>
        </div>
        {loaded && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={resetTool} style={{ background: "transparent", border: "1px solid #cccccc", color: "#888888", padding: "7px 16px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: 3 }}>
              ↩ Reset
            </button>
            <button onClick={exportCSV} style={{ background: "transparent", border: "1px solid #FF4D00", color: "#FF4D00", padding: "7px 16px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: 3 }}>
              Export CSV
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "28px 36px", maxWidth: 1080, margin: "0 auto" }}>
        {!loaded ? (
          <div>
            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("csv-input").click()}
              style={{
                border: `1.5px dashed ${dragging ? "#FF4D00" : "#cccccc"}`,
                borderRadius: 8,
                padding: "64px 40px",
                textAlign: "center",
                background: dragging ? "rgba(255,77,0,0.05)" : "#fafafa",
                transition: "all 0.2s",
                cursor: "pointer",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>📋</div>
              <div style={{ fontSize: 14, color: "#888888", marginBottom: 8 }}>
                Drop your LinkedIn <strong style={{ color: "#888888" }}>Connections.csv</strong> here
              </div>
              <div style={{ fontSize: 11, color: "#888888", marginBottom: 22, lineHeight: 1.8 }}>
                LinkedIn → Settings & Privacy → Data Privacy<br />→ Get a copy of your data → Connections → Request archive
              </div>
              <div style={{ display: "inline-block", background: "#FF4D00", color: "#fff", padding: "10px 24px", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", borderRadius: 3, cursor: "pointer" }}>
                Choose File
              </div>
              <input id="csv-input" type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            <div style={{ textAlign: "center", color: "#888888", fontSize: 11, marginBottom: 18 }}>— or —</div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => processContacts(SAMPLE_DATA)} style={{ background: "transparent", border: "1px solid #cccccc", color: "#888888", padding: "10px 24px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: 3 }}>
                Load sample data
              </button>
            </div>

            {/* ICP legend */}
            <div style={{ marginTop: 40, borderTop: "1px solid #e0e0e0", paddingTop: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888888", marginBottom: 16 }}>Scoring logic</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
                  <div key={tier} style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: 6, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                      <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#888888", lineHeight: 1.6 }}>{cfg.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards — clickable tier filters + display-only Contacted / Per Day */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
              <div
                onClick={() => setActiveTier("all")}
                style={{
                  background: "rgba(0,0,0,0.03)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom: activeTier === "all" ? "3px solid #1a1a1a" : "3px solid transparent",
                }}
              >
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Total</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>{contacts.length}</div>
              </div>
              <div
                onClick={() => setActiveTier("1")}
                style={{
                  background: "rgba(255,77,0,0.06)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom: activeTier === "1" ? "3px solid #FF4D00" : "3px solid transparent",
                }}
              >
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>🔥 Tier 1</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#FF4D00" }}>{tierCounts[1]}</div>
              </div>
              <div
                onClick={() => setActiveTier("2")}
                style={{
                  background: "rgba(255,184,0,0.06)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom: activeTier === "2" ? "3px solid #FFB800" : "3px solid transparent",
                }}
              >
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>⚡ Tier 2</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#FFB800" }}>{tierCounts[2]}</div>
              </div>
              <div
                onClick={() => setActiveTier("3")}
                style={{
                  background: "rgba(170,170,170,0.06)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom: activeTier === "3" ? "3px solid #aaaaaa" : "3px solid transparent",
                }}
              >
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>💤 Tier 3</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#aaaaaa" }}>{tierCounts[3]}</div>
              </div>
              <div style={{ background: "rgba(68,255,204,0.06)", borderRadius: 6, padding: "14px 16px", cursor: "default" }}>
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>✉ Contacted</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#44ffcc" }}>{contactedCount}</div>
              </div>
              <div style={{ background: "rgba(136,170,255,0.06)", borderRadius: 6, padding: "14px 16px", cursor: "default" }}>
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>per day ({outreachDays}d)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#88aaff" }}>{perDay}</div>
              </div>
            </div>

            {/* Outreach window + search */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#888888" }}>Outreach window:</span>
                <input
                  type="number"
                  value={outreachDays}
                  min={1}
                  onChange={(e) => setOutreachDays(Number(e.target.value))}
                  style={{ background: "#ffffff", border: "1px solid #cccccc", color: "#1a1a1a", padding: "5px 10px", width: 58, fontSize: 13, borderRadius: 3, textAlign: "center" }}
                />
                <span style={{ fontSize: 11, color: "#888888" }}>days → <strong style={{ color: "#88aaff" }}>{perDay} contacts/day</strong> (Tier 1 + 2 only)</span>
              </div>
              <input
                placeholder="Search name, company, title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cccccc",
                  color: "#1a1a1a",
                  padding: "6px 14px",
                  fontSize: 11,
                  borderRadius: 3,
                  width: 220,
                  outline: "none",
                }}
              />
            </div>

            {/* Table */}
            <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: 6, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "24px 2fr 2fr 2fr 90px 140px",
                padding: "9px 18px",
                borderBottom: "1px solid #e0e0e0",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#888888",
                gap: 8,
              }}>
                <span></span>
                <span>Name</span>
                <span>Company</span>
                <span>Title</span>
                <span>Tier</span>
                <span>Status</span>
              </div>

              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {filtered.length === 0 && (
                  <div style={{ padding: 40, textAlign: "center", color: "#888888", fontSize: 13 }}>No contacts match this filter.</div>
                )}
                {filtered.map((c) => {
                  const tierColor = c.tier === 1 ? "#FF4D00" : c.tier === 2 ? "#FFB800" : "#cccccc";
                  const statusMap = { pending: null, contacted: "#44ffcc", replied: "#FFB800", skip: "#888888" };
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "24px 2fr 2fr 2fr 90px 140px",
                        padding: "11px 18px",
                        borderBottom: "1px solid #eeeeee",
                        alignItems: "center",
                        opacity: c.status === "skip" ? 0.35 : 1,
                        gap: 8,
                        transition: "opacity 0.2s",
                      }}
                    >
                      {/* Tier dot */}
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: tierColor, boxShadow: c.tier < 3 ? `0 0 5px ${tierColor}` : "none" }} />
                      <span style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: "#888888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.company || "—"}</span>
                      <span style={{ fontSize: 10, color: "#888888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title || "—"}</span>
                      <select
                        value={c.tier}
                        onChange={(e) => changeTier(c.id, Number(e.target.value))}
                        style={{
                          border: "none",
                          background: "transparent",
                          fontSize: 11,
                          cursor: "pointer",
                          color: c.tier === 1 ? "#FF4D00" : c.tier === 2 ? "#FFB800" : "#aaaaaa",
                          fontFamily: "inherit",
                          padding: 0,
                          appearance: "auto",
                        }}
                      >
                        <option value={1}>T1</option>
                        <option value={2}>T2</option>
                        <option value={3}>T3</option>
                      </select>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[
                          { key: "contacted", icon: "✉", label: "Contacted" },
                          { key: "replied", icon: "✓", label: "Replied" },
                          { key: "skip", icon: "✕", label: "Skip" },
                        ].map(({ key, icon }) => (
                          <button
                            key={key}
                            onClick={() => markStatus(c.id, key)}
                            title={key}
                            style={{
                              background: c.status === key ? statusMap[key] : "transparent",
                              border: `1px solid ${c.status === key ? statusMap[key] : "#cccccc"}`,
                              color: c.status === key ? "#000" : "#888888",
                              padding: "3px 8px",
                              fontSize: 10,
                              cursor: "pointer",
                              borderRadius: 2,
                              fontWeight: c.status === key ? 700 : 400,
                            }}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 10, color: "#888888" }}>
              Showing {filtered.length} of {contacts.length} · ✉ = contacted · ✓ = replied · ✕ = skip
            </div>
          </>
        )}
      </div>
    </div>
  );
}
