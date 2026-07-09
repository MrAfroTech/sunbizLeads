import { useState, useCallback, useMemo, useEffect } from "react";
import * as Papa from "papaparse";
import { supabase } from "./src/supabase.js";

function buildInstagramProfileUrl(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  const handle = v.startsWith("@") ? v.slice(1) : v;
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

function parseCSV(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
    });
  });
}

const inlineInputStyle = {
  border: "none",
  background: "transparent",
  fontSize: 12,
  fontFamily: "inherit",
  color: "#1a1a1a",
  padding: "4px 0",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  borderBottom: "1px solid transparent",
};
const inlineInputFocusStyle = { borderBottom: "1px solid #FF4D00" };

function mapTeamRow(row) {
  return {
    id: row.id,
    team_name: row.team_name ?? "",
    league_tier: row.league_tier ?? "",
    league: row.league ?? "",
    website: row.website ?? "",
    instagram_handle: row.instagram_handle ?? "",
    outreach_tier: row.outreach_tier ?? "not_engaged",
    status: row.status ?? "none",
    called: Boolean(row.called),
    emailed: Boolean(row.emailed),
    sales_nav: Boolean(row.sales_nav),
    expanded: false,
    contacts: [],
  };
}

function mapContactRow(row) {
  return {
    id: row.id,
    contact_name: row.contact_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
  };
}

export default function EventSpacesTracker() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    (async () => {
      const [teamsRes, contactsRes] = await Promise.all([
        supabase.from("baseball_teams").select("*").order("id", { ascending: true }),
        supabase.from("baseball_team_contacts").select("*").order("created_at", { ascending: true }),
      ]);
      console.log("[Tracker] Load raw baseball_teams response:", {
        error: teamsRes.error,
        rowCount: teamsRes.data?.length,
        firstRowCheckboxes: teamsRes.data?.[0]
          ? {
              id: teamsRes.data[0].id,
              called: teamsRes.data[0].called,
              calledType: typeof teamsRes.data[0].called,
              emailed: teamsRes.data[0].emailed,
              emailedType: typeof teamsRes.data[0].emailed,
              sales_nav: teamsRes.data[0].sales_nav,
              sales_navType: typeof teamsRes.data[0].sales_nav,
            }
          : "no rows",
      });
      if (teamsRes.error || contactsRes.error) {
        setLoading(false);
        return;
      }
      const teams = (teamsRes.data || []).map(mapTeamRow);
      const contactsByTeam = (contactsRes.data || []).reduce((acc, c) => {
        const tid = c.team_id;
        if (!acc[tid]) acc[tid] = [];
        acc[tid].push(mapContactRow(c));
        return acc;
      }, {});
      setRecords(
        teams.map((t) => ({
          ...t,
          contacts: contactsByTeam[t.id] || [],
        }))
      );
      setLoading(false);
    })();
  }, []);

  const updateRecordLocal = (id, field, value) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const persistRecordField = (id, field, value) => {
    supabase
      .from("baseball_teams")
      .update({ [field]: value })
      .eq("id", id)
      .select()
      .then(({ data, error }) => {
        console.log("[Tracker] Update fired:", { id, field, value });
        console.log("[Tracker] Update response:", { data, error });
      });
  };

  const updateRecord = (id, field, value) => {
    updateRecordLocal(id, field, value);
    persistRecordField(id, field, value);
  };

  const toggleExpand = (teamId) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === teamId ? { ...r, expanded: !r.expanded } : r
      )
    );
  };

  const updateContactLocal = (teamId, contactId, field, value) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== teamId) return r;
        return {
          ...r,
          contacts: r.contacts.map((c) =>
            c.id === contactId ? { ...c, [field]: value } : c
          ),
        };
      })
    );
  };

  const persistContactField = (contactId, field, value) => {
    supabase
      .from("baseball_team_contacts")
      .update({ [field]: value })
      .eq("id", contactId);
  };

  const deleteContact = async (teamId, contactId) => {
    await supabase.from("baseball_team_contacts").delete().eq("id", contactId);
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== teamId) return r;
        return {
          ...r,
          contacts: r.contacts.filter((c) => c.id !== contactId),
        };
      })
    );
  };

  const addContact = async (teamId) => {
    const { data, error } = await supabase
      .from("baseball_team_contacts")
      .insert({ team_id: teamId, contact_name: "", phone: "", email: "" })
      .select()
      .single();
    if (error) return;
    const contact = mapContactRow(data);
    setRecords((prev) =>
      prev.map((r) =>
        r.id === teamId
          ? { ...r, contacts: [...r.contacts, contact] }
          : r
      )
    );
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const raw = await parseCSV(file);
    const built = raw
      .filter((r) => r.team_name != null && String(r.team_name).trim() !== "")
      .map((r) => ({
        team_name: String(r.team_name || r["team_name"] || "").trim(),
        website: String(r.website || r["website"] || "").trim(),
        instagram_handle: String(
          r.instagram_handle ||
            r["instagram_handle"] ||
            r.instagram ||
            r["instagram"] ||
            r.ig ||
            r["ig"] ||
            ""
        ).trim(),
        league: String(r.league || r["league"] || "").trim(),
        league_tier: String(r.tier != null ? r.tier : r["tier"] != null ? r["tier"] : "").trim(),
        outreach_tier: "not_engaged",
        status: "none",
        called: false,
        emailed: false,
        sales_nav: false,
      }));
    const seen = new Set();
    const uniqueRecords = built.filter((r) => {
      if (seen.has(r.team_name)) return false;
      seen.add(r.team_name);
      return true;
    });
    // Upsert only columns that exist on baseball_teams (no contact_name, email, phone)
    const { data, error } = await supabase
      .from("baseball_teams")
      .upsert(uniqueRecords, { onConflict: "team_name" })
      .select();
    if (error || !data) return;
    const teamIds = data.map((d) => d.id);
    const { data: contactsData } = await supabase
      .from("baseball_team_contacts")
      .select("*")
      .in("team_id", teamIds);
    const contactsByTeam = (contactsData || []).reduce((acc, c) => {
      const tid = c.team_id;
      if (!acc[tid]) acc[tid] = [];
      acc[tid].push(mapContactRow(c));
      return acc;
    }, {});
    setRecords(
      data.map((row) => ({
        ...mapTeamRow(row),
        contacts: contactsByTeam[row.id] || [],
      }))
    );
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "engaged" && r.outreach_tier === "engaged") ||
        (activeFilter === "not_engaged" && r.outreach_tier === "not_engaged");
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (r.team_name && r.team_name.toLowerCase().includes(q)) ||
        (r.league && r.league.toLowerCase().includes(q)) ||
        (r.league_tier && r.league_tier.toLowerCase().includes(q)) ||
        (r.instagram_handle && r.instagram_handle.toLowerCase().includes(q)) ||
        (r.contacts && r.contacts.some(
          (c) =>
            (c.contact_name && c.contact_name.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.phone && c.phone.toLowerCase().includes(q))
        ));
      return matchFilter && matchSearch;
    });
  }, [records, activeFilter, search]);

  const engagedCount = records.filter((r) => r.outreach_tier === "engaged").length;
  const notEngagedCount = records.filter((r) => r.outreach_tier === "not_engaged").length;
  const meetingBookedCount = records.filter(
    (r) => r.status === "meeting_booked"
  ).length;

  const exportCSV = () => {
    const headers = [
      "Event Space Name",
      "Tier",
      "Market",
      "Website",
      "Instagram Handle",
      "Contact Name",
      "Phone",
      "Email",
      "Outreach Tier",
      "Status",
      "Called",
      "Emailed",
      "Sales Nav",
    ];
    const rows = [];
    records.forEach((r) => {
      if (r.contacts.length === 0) {
        rows.push([
          r.team_name,
          r.league_tier,
          r.league,
          r.website,
          r.instagram_handle,
          "",
          "",
          "",
          r.outreach_tier,
          r.status,
          r.called ? "Yes" : "No",
          r.emailed ? "Yes" : "No",
          r.sales_nav ? "Yes" : "No",
        ]);
      } else {
        r.contacts.forEach((c) => {
          rows.push([
            r.team_name,
            r.league_tier,
            r.league,
            r.website,
            r.instagram_handle,
            c.contact_name,
            c.phone,
            c.email,
            r.outreach_tier,
            r.status,
            r.called ? "Yes" : "No",
            r.emailed ? "Yes" : "No",
            r.sales_nav ? "Yes" : "No",
          ]);
        });
      }
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-spaces-tracker.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableGridCols = "32px 180px 70px 120px 150px 140px 100px 130px 140px 50px 50px 50px";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        color: "#1a1a1a",
        fontFamily: "'DM Mono', 'Courier New', monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #e0e0e0",
          padding: "22px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "#FF4D00",
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Seamlessly · Sales Ops
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#1a1a1a",
            }}
          >
            Event Spaces Tracker
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 36px", maxWidth: 1200, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 40px", color: "#888888", fontSize: 14 }}>
            Loading…
          </div>
        ) : records.length === 0 ? (
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("es-csv-input").click()}
              style={{
                border: `1.5px dashed ${dragging ? "#FF4D00" : "#cccccc"}`,
                borderRadius: 8,
                padding: "64px 40px",
                textAlign: "center",
                background: dragging ? "rgba(255,77,0,0.05)" : "#fafafa",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>🏛️</div>
              <div style={{ fontSize: 14, color: "#888888", marginBottom: 8 }}>
                Drop your CSV here (columns: <strong style={{ color: "#888888" }}>tier</strong>, <strong style={{ color: "#888888" }}>league</strong>, <strong style={{ color: "#888888" }}>team_name</strong>, <strong style={{ color: "#888888" }}>website</strong>, <strong style={{ color: "#888888" }}>instagram_handle</strong>)
              </div>
              <div
                style={{
                  display: "inline-block",
                  background: "#FF4D00",
                  color: "#fff",
                  padding: "10px 24px",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderRadius: 3,
                  cursor: "pointer",
                  marginTop: 12,
                }}
              >
                Choose File
              </div>
              <input
                id="es-csv-input"
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <div
                onClick={() => setActiveFilter("all")}
                style={{
                  background: "rgba(0,0,0,0.03)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom:
                    activeFilter === "all"
                      ? "3px solid #1a1a1a"
                      : "3px solid transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#888888",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Total
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>
                  {records.length}
                </div>
              </div>
              <div
                onClick={() => setActiveFilter("engaged")}
                style={{
                  background: "rgba(255,77,0,0.06)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom:
                    activeFilter === "engaged"
                      ? "3px solid #FF4D00"
                      : "3px solid transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#888888",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Engaged
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#FF4D00" }}>
                  {engagedCount}
                </div>
              </div>
              <div
                onClick={() => setActiveFilter("not_engaged")}
                style={{
                  background: "rgba(170,170,170,0.06)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom:
                    activeFilter === "not_engaged"
                      ? "3px solid #aaaaaa"
                      : "3px solid transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#888888",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Not Engaged
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#aaaaaa" }}>
                  {notEngagedCount}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(68,255,204,0.06)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#888888",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Meeting Booked
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#44ffcc" }}>
                  {meetingBookedCount}
                </div>
              </div>
            </div>

            {/* Controls: search + export */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <input
                placeholder="Search event space, market, Instagram, contact…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cccccc",
                  color: "#1a1a1a",
                  padding: "6px 14px",
                  fontSize: 11,
                  borderRadius: 3,
                  width: 280,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={exportCSV}
                style={{
                  background: "transparent",
                  border: "1px solid #FF4D00",
                  color: "#FF4D00",
                  padding: "7px 16px",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: 3,
                  fontFamily: "inherit",
                }}
              >
                Export CSV
              </button>
            </div>

            {/* Table — header + rows in one horizontally scrollable container */}
            <div
              style={{
                overflowX: "auto",
                width: "100%",
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                background: "#ffffff",
              }}
            >
              <div style={{ minWidth: 1100 }}>
                {/* Header row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: tableGridCols,
                    padding: "9px 18px",
                    borderBottom: "1px solid #e0e0e0",
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#888888",
                    gap: 8,
                  }}
                >
                  <span style={{ width: 32 }} />
                  <span>Event Space</span>
                  <span>Tier</span>
                  <span>Market</span>
                  <span>Website</span>
                  <span>Instagram</span>
                  <span>Contacts</span>
                  <span>Outreach</span>
                  <span>Status</span>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px" }}>📞</span>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px" }}>📧</span>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px" }}>🧭</span>
                </div>
                {/* Data rows — vertically scrollable */}
                <div style={{ maxHeight: 500, overflowY: "auto" }}>
                  {filtered.length === 0 && (
                    <div
                      style={{
                        padding: 40,
                        textAlign: "center",
                        color: "#888888",
                        fontSize: 13,
                      }}
                    >
                      No records match this filter.
                    </div>
                  )}
                  {filtered.map((r) => (
                    <div key={r.id}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: tableGridCols,
                        padding: "8px 18px",
                        borderBottom: r.expanded ? "none" : "1px solid #eeeeee",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                    <button
                      type="button"
                      onClick={() => toggleExpand(r.id)}
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#555555",
                      }}
                      aria-label={r.expanded ? "Collapse" : "Expand"}
                    >
                      {r.expanded ? "▼" : "▶"}
                    </button>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#1a1a1a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.team_name || "—"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#888888",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.league_tier || "—"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#888888",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.league || "—"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.website ? (
                        <a
                          href={
                            r.website.startsWith("http")
                              ? r.website
                              : `https://${r.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#88aaff",
                            textDecoration: "none",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {r.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
                      <input
                        type="text"
                        value={r.instagram_handle || ""}
                        placeholder="ig"
                        onChange={(e) =>
                          updateRecordLocal(r.id, "instagram_handle", e.target.value)
                        }
                        onBlur={(e) =>
                          persistRecordField(r.id, "instagram_handle", e.target.value)
                        }
                        onFocus={(e) =>
                          Object.assign(e.target.style, inlineInputFocusStyle)
                        }
                        style={{
                          ...inlineInputStyle,
                          fontSize: 11,
                          minWidth: 0,
                        }}
                      />
                      {r.instagram_handle ? (
                        <a
                          href={buildInstagramProfileUrl(r.instagram_handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#88aaff",
                            textDecoration: "none",
                            flex: "0 0 auto",
                            fontSize: 11,
                          }}
                          aria-label="Open Instagram profile"
                          title="Open Instagram profile"
                        >
                          ↗
                        </a>
                      ) : null}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#888888",
                      }}
                    >
                      {r.contacts.length === 0
                        ? "No contacts"
                        : `${r.contacts.length} contact${r.contacts.length === 1 ? "" : "s"}`}
                    </span>
                    <select
                      value={r.outreach_tier}
                      onChange={(e) =>
                        updateRecord(r.id, "outreach_tier", e.target.value)
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 11,
                        cursor: "pointer",
                        color:
                          r.outreach_tier === "engaged" ? "#FF4D00" : "#aaaaaa",
                        fontFamily: "inherit",
                        padding: 0,
                        appearance: "auto",
                      }}
                    >
                      <option value="engaged">Engaged</option>
                      <option value="not_engaged">Not Engaged</option>
                    </select>
                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateRecord(r.id, "status", e.target.value)
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 11,
                        cursor: "pointer",
                        color: "#1a1a1a",
                        fontFamily: "inherit",
                        padding: 0,
                        appearance: "auto",
                      }}
                    >
                      <option value="none">None</option>
                      <option value="contacted">Contacted</option>
                      <option value="replied">Replied</option>
                      <option value="meeting_booked">Meeting Booked</option>
                    </select>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px" }}>
                      <input
                        type="checkbox"
                        checked={r.called}
                        onChange={(e) =>
                          updateRecord(r.id, "called", e.target.checked)
                        }
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px" }}>
                      <input
                        type="checkbox"
                        checked={r.emailed}
                        onChange={(e) =>
                          updateRecord(r.id, "emailed", e.target.checked)
                        }
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px" }}>
                      <input
                        type="checkbox"
                        checked={r.sales_nav}
                        onChange={(e) =>
                          updateRecord(r.id, "sales_nav", e.target.checked)
                        }
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </div>
                  {r.expanded && (
                    <div
                      style={{
                        padding: "12px 18px 16px",
                        background: "#fafafa",
                        borderBottom: "1px solid #eeeeee",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 220px 220px 60px",
                          gap: 8,
                          alignItems: "center",
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#888888",
                          marginBottom: 8,
                          paddingLeft: 32,
                        }}
                      >
                        <span>Contact Name</span>
                        <span>Phone</span>
                        <span>Email</span>
                        <span />
                      </div>
                      {r.contacts.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 220px 220px 60px",
                            gap: 8,
                            alignItems: "center",
                            paddingLeft: 32,
                            marginBottom: 6,
                          }}
                        >
                          <input
                            type="text"
                            value={c.contact_name}
                            onChange={(e) =>
                              updateContactLocal(r.id, c.id, "contact_name", e.target.value)
                            }
                            onBlur={(e) =>
                              persistContactField(c.id, "contact_name", e.target.value)
                            }
                            onFocus={(e) =>
                              Object.assign(e.target.style, inlineInputFocusStyle)
                            }
                            style={{ ...inlineInputStyle, fontSize: 11 }}
                          />
                          <input
                            type="text"
                            value={c.phone}
                            onChange={(e) =>
                              updateContactLocal(r.id, c.id, "phone", e.target.value)
                            }
                            onBlur={(e) =>
                              persistContactField(c.id, "phone", e.target.value)
                            }
                            onFocus={(e) =>
                              Object.assign(e.target.style, inlineInputFocusStyle)
                            }
                            style={{ ...inlineInputStyle, fontSize: 11 }}
                          />
                          <input
                            type="text"
                            value={c.email}
                            onChange={(e) =>
                              updateContactLocal(r.id, c.id, "email", e.target.value)
                            }
                            onBlur={(e) =>
                              persistContactField(c.id, "email", e.target.value)
                            }
                            onFocus={(e) =>
                              Object.assign(e.target.style, inlineInputFocusStyle)
                            }
                            style={{ ...inlineInputStyle, fontSize: 11 }}
                          />
                          <button
                            type="button"
                            onClick={() => deleteContact(r.id, c.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: 10,
                              color: "#cc4444",
                              background: "transparent",
                              border: "1px solid #cc4444",
                              borderRadius: 3,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                      <div style={{ paddingLeft: 32, marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => addContact(r.id)}
                          style={{
                            padding: "6px 12px",
                            fontSize: 10,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "#FF4D00",
                            background: "transparent",
                            border: "1px solid #FF4D00",
                            borderRadius: 3,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          + Add Contact
                        </button>
                      </div>
                    </div>
                  )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 10,
                color: "#888888",
              }}
            >
              Showing {filtered.length} of {records.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
