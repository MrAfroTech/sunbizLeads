/** Company labels from the scraped contacts CSV — keep in sync with `supabase-football-tracker-ui.sql` (function body). */

export function normalizeTeamName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export const SCRAPED_EXCLUDED_COMPANIES = [
  "Rubber Ducks",
  "Curve",
  "Sea Wolves",
  "Senators",
  "Goats",
  "Fisher Cats",
  "Sea Dogs",
  "Flying Squirrels",
  "Patriots",
  "Thunder",
  "Barons",
  "Shuckers",
  "Lookouts",
  "Blue Wahoos",
  "Smokies",
  "Sod Poodles",
  "Travelers",
  "Hooks",
  "Rough Riders",
  "Rockhounds",
  "Naturals",
  "Missions",
  "Cardinals",
  "Drillers",
  "Wind Surge",
  "Iron Birds",
  "Hot Rods",
  "Renegardes",
  "Renegades",
  "Red Sox",
  "Blue Rocks",
  "Dash",
  "Tourists",
  "Grasshoppers",
  "Grasshopers",
  "Kernels",
  "Dragons",
  "Loons",
  "Cougars",
  "Captains",
  "Lug Nuts",
  "Chiefs",
  "River Bandits",
  "Cubs",
  "WhiteCaps",
  "White Caps",
  "Rattlers",
  "Emeralds",
  "Aquasox",
  "Hops",
  "Indians",
  "Canadians",
  "Green Jackets",
  "Fireflies",
  "Shorebirds",
  "Woodpeckers",
  "Nationals",
  "Crawdads",
  "Cannon Balls",
  "Hillcats",
  "Pelicans",
  "Mauraders",
  "Marauders",
  "Threshers",
  "Tortuges",
  "Tortugas",
  "Blue Jays",
  "Hammerheads",
  "Mets",
  "Tarpons",
  "66ers",
  "Quakes",
  "Storm",
  "Rawhide",
  "Otters",
  "Y'alls",
  "Wild Cats",
  "Wild Things",
  "Boxcars",
  "Redhawks",
  "Titans",
  "Dirty Birds",
  "Dogs",
  "Goldeyes",
  "Mustangs",
  "Chuckers",
  "Chukars",
  "Hawks",
  "USBPL",
  "USPBL",
];

const EXCLUDED_NORMALIZED = new Set(
  SCRAPED_EXCLUDED_COMPANIES.map((s) => normalizeTeamName(s)).filter(Boolean)
);

export function teamNameMatchesScrapedExclusion(teamName) {
  const n = normalizeTeamName(teamName);
  if (!n) return false;
  for (const h of EXCLUDED_NORMALIZED) {
    if (n === h) return true;
    const start = n.length - h.length;
    if (start > 0 && n.endsWith(h) && n[start - 1] === " ") return true;
  }
  return false;
}
