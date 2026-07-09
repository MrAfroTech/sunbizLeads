/**
 * Generates Tier 1 and Tier 2 PDF assets with lead-magnet styling.
 * Run from repo root: node landingPages/scripts/generate-tier-pdfs.js
 * Requires: npm install pdfkit
 *
 * Styling matches leadMagnets. Each section measures content height first
 * so the tan box and gold bar are drawn to fit (no cut-off between sections).
 */
const fs = require('fs');
const path = require('path');

let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  console.error('Run: npm install pdfkit');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');

const colors = {
  text: '#1a1410',
  gold: '#e0b841',
  goldDark: '#d4af37',
  sectionBg: '#f5f0e6',
  sectionBorder: '#e0b841',
};

function addSection(doc, title, items, options = {}) {
  const useBullets = options.bullets || false;
  const margin = 50;
  const pageWidth = doc.page.width;
  const textWidth = pageWidth - margin * 2 - 40;
  const left = margin + 20;

  doc.font('Helvetica-Bold').fontSize(14);
  const titleHeight = doc.heightOfString(title, { width: textWidth });
  doc.font('Helvetica').fontSize(11);

  let totalHeight = 16 + titleHeight + 12;
  items.forEach((item, idx) => {
    const bulletText = useBullets ? '  •  ' + item.bullet : '  ' + (idx + 1) + '.  ' + item.bullet;
    totalHeight += doc.heightOfString(bulletText, { width: textWidth - 28 }) + 4;
    totalHeight += doc.heightOfString(item.action, { width: textWidth - 28 }) + 12;
  });
  totalHeight += 16;

  const startY = doc.y;
  doc.save();
  doc.rect(margin, startY - 6, 4, totalHeight).fill(colors.sectionBorder);
  doc.roundedRect(margin, startY - 6, pageWidth - margin * 2, totalHeight, 0, 8, 8, 0).fill(colors.sectionBg);
  doc.restore();

  doc.y = startY;
  doc.fillColor(colors.gold).font('Helvetica-Bold').fontSize(14);
  doc.text(title, left, doc.y + 4, { width: textWidth });
  doc.y += titleHeight + 12;

  doc.font('Helvetica').fontSize(11);
  items.forEach((item, i) => {
    if (useBullets) {
      doc.fillColor(colors.gold).text('  •  ', { continued: true });
    } else {
      doc.fillColor(colors.gold).text(`  ${i + 1}.  `, { continued: true });
    }
    doc.fillColor(colors.text).text(item.bullet, { width: textWidth - 28 });
    doc.moveDown(0.3);
    doc.fillColor(colors.text).text(item.action, { width: textWidth - 28, indent: 8 });
    doc.moveDown(0.6);
  });

  doc.y = startY + totalHeight - 8;
  doc.moveDown(1);
}

function writeTier1Pdf() {
  const outPath = path.join(root, 'tier1-revenue-rescue', 'tier1-revenue-rescue-kit.pdf');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const doc = new PDFDocument({ margin: 50, size: 'LETTER', bufferPages: true });
  doc.pipe(fs.createWriteStream(outPath));

  doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(22);
  doc.text('Tier 1 Revenue Rescue Kit', { align: 'center' });
  doc.moveDown(0.5);
  doc.fillColor(colors.gold).font('Helvetica').fontSize(14);
  doc.text('Survive & Thrive on $500k Budgets', { align: 'center' });
  doc.moveDown(1.5);

  doc.fillColor(colors.text);
  addSection(doc, 'Section 1 — The 6 Core KPIs Trapping You at Survival Level:', [
    { bullet: 'Ticket conversion rate under 60%', action: 'Action: Audit your last 10 home games and identify which ticket types — single game, group, walk-up — are converting at the lowest rate. Build a targeted game-day offer, such as a discounted bundle that includes a ticket plus a concession item, activated via text or email within 48 hours of tip-off. Time-sensitive pre-game offers consistently lift conversion without requiring you to discount your full price tier.' },
    { bullet: 'Wage ratio over 70%', action: 'Action: Map every game-day labor role against actual revenue generated per shift. Identify two to three positions where part-time or cross-trained staff can absorb duties currently held by full-time roles on non-peak days. The goal is not to cut staff — it is to align labor hours more precisely with when revenue is actually being generated.' },
    { bullet: 'ARPA between $12–18', action: 'Action: Introduce one bundled upsell at the point of ticket purchase — a ticket plus drink plus parking package priced at a slight premium to your current average transaction. Teams operating at sub-$18 ARPA typically have a checkout flow that makes individual add-ons easy to skip. Bundling at the moment of purchase is the lowest-friction path to lifting per-head spend without changing your pricing structure.' },
    { bullet: 'Sponsor revenue at 10–15% of total', action: 'Action: Build a three-tier sponsorship deck — presenting, supporting, and community partner. Price the entry-level community partner tier low enough that a local business can say yes without a lengthy approval process. Most teams at this revenue level are relying on one or two large sponsors rather than five to eight smaller ones. Spreading the base reduces churn risk and creates a natural pipeline for upselling sponsors to higher tiers as they see results.' },
    { bullet: 'Average attendance under 1,200 fans/game', action: 'Action: Pull your attendance data from the past two seasons and identify the specific game configurations that drove your highest-turnout nights — day of week, opponent type, themed night, giveaway item. Affiliated MiLB teams average roughly 4,000 fans per game; at the independent and lower-budget level, 1,200 is the threshold below which fixed operating costs become very difficult to cover from gate revenue alone. Replicate your highest-performing conditions for at least four to six games next season and build your promotional calendar around them. Themed merchandise nights and giveaway games consistently outperform generic discount-ticket nights in minor league attendance data.' },
    { bullet: 'Beer/ticket upsell loss rate at 20%+', action: 'Action: A 20% or higher upsell loss rate at this budget level is almost always a concession flow problem, not a demand problem. Map your two highest-traffic windows — the period just before tip-off and halftime — and add one mobile POS tablet or a roving vendor to those corridors specifically. Even a single additional point of sale during peak windows has been shown to meaningfully recover abandoned transactions at minimal incremental cost.' },
  ]);

  addSection(doc, 'Section 2 — 3 Fixes to Boost Revenue 30% Without Doubling Headcount:', [
    { bullet: 'Reduce wait times to recover lost upsell revenue', action: 'Action: Run a timed audit at your next two home games. Clock how long it takes a fan to complete a concession purchase from the moment they join the line. If the average exceeds five minutes, you have a throughput problem. Deploy a mobile POS tablet in your peak corridor before committing to kiosk infrastructure. Cutting wait times in half has been shown to meaningfully increase per-fan spend — the revenue recovery typically more than covers the cost of the additional device and staff member during those windows.' },
    { bullet: 'Improve ticket conversion with targeted game-day offers', action: 'Action: Set up an automated text or email to go out 36 to 48 hours before each game to anyone who visited your ticketing page but did not complete a purchase. Offer them a limited bundle — ticket plus one concession item — with a window that expires day of game. This targets warm leads who already showed purchase intent, which is a far cheaper conversion path than going back to a cold audience.' },
    { bullet: 'Diversify sponsor mix to reduce single-source reliance', action: 'Action: List every local business within a five-mile radius of your venue that serves the same demographic as your fans — restaurants, gyms, auto dealers, insurance agents, home services. Approach them with a community partner package priced under $3,000 that includes PA mentions, one social media post, and logo placement in your game program. Aim to sign five to eight of these in year one. Local sponsors at this price point rarely churn because the spend feels manageable, and you gain natural leverage to upsell them as they see consistent exposure.' },
  ]);

  addSection(doc, 'Section 3 — The Unquantifiables: 5 Plays to Build Fan Loyalty Without Big Budgets:', [
    { bullet: 'Player meet and greet experience', action: 'Action: Designate two to three players per home game to participate in a 15 to 20 minute post-game meet and greet in a defined fan zone area near the exit. Coordinate with your team manager in advance and brief players on expectations. Post signage inside the arena before tip-off so fans know to stay. This costs nothing and consistently produces organic social content — fans sharing photos and short clips — that no paid ad budget can replicate at this budget level.' },
    { bullet: 'Handwritten thank-you notes on seats', action: 'Action: Before select home games, place a short handwritten thank-you note on a random sample of seats. The gesture costs nothing and reinforces that fans are valued.' },
    { bullet: 'Local band shoutouts during warmups', action: 'Action: Partner with one to two local bands or musicians each season. Feature their name on the PA during warmups and tag them on social the day of the game. Ask them to share it with their own following. A local artist with even a modest audience extends your reach into a community segment you are unlikely to reach through traditional sports marketing, and it costs nothing beyond the coordination.' },
    { bullet: 'Creating a backyard BBQ feel where fans feel like family', action: 'Action: Identify three to five high-traffic touchpoints — entry gate, concession line, seating section — and brief staff at each to use casual, welcoming language and greet returning fans by name where possible. Small consistent gestures like remembering a season-ticket holder\'s usual order or acknowledging a fan\'s return create the kind of experience that drives word-of-mouth. This is a staff training and culture exercise, not a line item.' },
    { bullet: 'Word-of-mouth buzz that only comes from genuine intimacy', action: 'Action: Give each season-ticket holder one transferable guest pass per season to bring a first-time attendee. Track who comes in on a referral pass and follow up with those new fans directly after the game via a short personal email. Referred fans consistently show higher game-to-game retention than fans acquired through paid channels, and the program costs nothing beyond the coordination to track it.' },
  ], { bullets: true });

  doc.moveDown(1);
  doc.fillColor(colors.gold).font('Helvetica-Bold').fontSize(11);
  doc.text('Official Partner of the Orlando Pirates (Kia Center)', { align: 'center' });

  doc.end();
  console.log('Written:', outPath);
}

function writeTier2Pdf() {
  const outPath = path.join(root, 'tier2-revenue-accelerator', 'tier2-revenue-accelerator-report.pdf');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const doc = new PDFDocument({ margin: 50, size: 'LETTER', bufferPages: true });
  doc.pipe(fs.createWriteStream(outPath));

  doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(22);
  doc.text('Tier 2 Revenue Accelerator Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fillColor(colors.gold).font('Helvetica').fontSize(14);
  doc.text('Scale from $2M to Pro Contender', { align: 'center' });
  doc.moveDown(1.5);

  doc.fillColor(colors.text);
  addSection(doc, 'Section 1 — The 7 KPIs Blocking Your Next Jump:', [
    { bullet: 'Event ROI under 2x', action: 'Action: Before booking any themed night or special event, define the exact revenue it needs to generate to justify its cost — ticket revenue, incremental concession lift, and sponsor activation fees combined. After the event, run an actual versus target comparison. Most teams at this budget level run events without a defined return threshold, which means profitable and unprofitable events look identical on the calendar. Establishing a minimum 2x return as a go/no-go filter before confirming events will, over time, eliminate the programming that drains budget without moving the needle.' },
    { bullet: 'Sponsor churn over 25%', action: 'Action: After each season, conduct a debrief call with every sponsor that did not renew. Ask directly: what would have made this worth continuing? The most common answer at this budget level is that sponsors could not measure what they received. Address this by delivering a one-page post-season performance report for each partner that documents PA mentions, estimated social impressions, logo placements, and any in-stadium activation results. Sponsors who receive documented performance data renew at significantly higher rates than those who do not.' },
    { bullet: 'ARPA between $22–30', action: 'Action: Introduce event-specific programming on two to three designated home games per season — a local DJ set, a themed food and drink menu, a pre-game watch-party format. These layered experiences give fans a reason to arrive earlier and spend more before tip-off. Teams that add even one deliberate experiential layer per event consistently report higher per-head spend on those nights compared to standard game days.' },
    { bullet: 'Attendance between 1,500–3,000', action: 'Action: Segment your attendance data by day of week, opponent, and promotional type. If you are not already doing this, start now. Most teams at this level will find that a small number of game configurations — typically weekend slots with a giveaway or themed night — drive a disproportionate share of high-attendance nights. Concentrate your promotional investment in those configurations and scale back spend on the slots that consistently underperform.' },
    { bullet: 'Sponsor revenue at 20–30% of total', action: 'Action: If sponsor revenue is at or below 30% of total, the ceiling is most likely your number of active sponsors, not the size of individual deals. Build a category exclusivity matrix — one sponsor per vertical, meaning one auto dealer, one insurance brand, one restaurant group, and so on. Sell category exclusivity as a premium and use it to justify higher contract values. This structure also makes renewal conversations easier because sponsors are not competing for the same audience attention within your inventory.' },
    { bullet: 'POS overload causing peak abandonment', action: 'Action: Identify your two highest-traffic concession windows — pre-game and halftime. At those windows specifically, deploy mobile POS operators to walk the queue and take orders before fans reach the counter. This is the most cost-effective intervention before committing to kiosk infrastructure. Research shows that 45% of fans abandon lines they perceive as too long, and that reducing wait time at peak windows increases per-fan spend significantly.' },
    { bullet: 'Estimated annual revenue leak of $500k+', action: 'Action: Do not treat this as a single problem. Break the leak into its component sources — abandoned concession transactions, unconverted ticket leads, sponsor churn, and below-benchmark per-head spend — and assign a rough dollar estimate to each. Address the largest source first. Teams that attempt to fix revenue leakage across all categories simultaneously rarely move the needle because resources and attention get spread too thin to create measurable impact in any single area.' },
  ]);

  addSection(doc, 'Section 2 — Proven Plays to Lift ARPA to $35:', [
    { bullet: 'Slash wait times at peak hours with better POS distribution', action: 'Action: Conduct a timed audit at your next home game during the pre-game and halftime windows. Count how many fans enter the concession queue and how many exit without purchasing. If you are losing more than one in four fans to line abandonment, add a mobile POS operator to that corridor before the next game. This is a same-week fix that does not require infrastructure investment — one trained staff member with a tablet is all that is needed to begin recovering those transactions.' },
    { bullet: 'Lock in sponsor retention with performance-based contracts', action: 'Action: When renewing or signing sponsors for the upcoming season, introduce a simple performance structure: a guaranteed base fee with a bonus tier unlocked when specific deliverables are hit — for example, a social post reaching a defined impression threshold, or a PA activation tied to a measurable in-game outcome. Performance-based structures reduce churn because sponsors are paying for outcomes they can see rather than making a blind annual commitment.' },
    { bullet: 'Layer in event programming to lift per-head spend', action: 'Action: Select two to three home games next season and add one deliberate experience layer — a local food vendor pop-up, a pre-game DJ set, a themed drink special tied to the night\'s promotion. Track your concession revenue on those nights against a comparable standard game night. If the per-head lift is measurable, expand the format. If it is not, adjust the layer and test again. The goal is to find the specific one or two programming additions that your fan base actually responds to, not to over-program every night.' },
  ]);

  addSection(doc, 'Section 3 — The Unquantifiables: 6 Tactics to Deepen Fan Passion:', [
    { bullet: 'Surprise player Q&As in the stands', action: 'Action: Schedule two to three unannounced mid-game or halftime player appearances in the stands per season. Coordinate timing with team staff and have an MC ready with a wireless mic. Announce it live over the PA as it happens. The unannounced element is critical — fans who capture a surprise moment share it because it feels rare and genuine, which drives organic reach that a planned, promoted appearance rarely generates.' },
    { bullet: 'Fan-voted halftime challenges', action: 'Action: Set up a QR-code voting experience accessible from fans\' phones before tip-off. Give fans two to three halftime challenge options to vote on. Display running vote totals on the scoreboard during the first half to build anticipation. Execute the winning option live at halftime. This format costs almost nothing to operate but creates sustained engagement across the entire first half because fans are invested in the result before halftime even begins.' },
    { bullet: 'Themed nights celebrating local rivalries with storytelling MCs', action: 'Action: Identify two to four culturally resonant local themes per season — a neighborhood rivalry, a regional heritage night, a community milestone. Hire or designate an MC who knows the story and can deliver it live during pre-game or halftime. Promote the theme in advance through your email list and social channels. Themed nights with a strong local narrative consistently outperform generic promotional nights in both attendance and dwell time because they give casual fans a reason to attend that exists independent of the game result.' },
    { bullet: 'Building a "we\'re building something special" camaraderie', action: 'Action: Launch a behind-the-scenes content series sent to your email list every two weeks during the season. Keep it brief — a short video or a written update of two to three paragraphs — and focus on things fans would not otherwise see: a pre-game locker room moment, a front office decision, a stadium improvement underway. Fans who feel like insiders attend more games, bring more people, and convert to season tickets at meaningfully higher rates than fans who only receive promotional messaging.' },
    { bullet: 'Turning casuals into season-ticket evangelists through insider access', action: 'Action: Pull a list of fans who attended three or more home games last season without holding a season ticket. Reach out to each one personally — a direct email or a phone call from a staff member, not an automated blast — and invite them to a single exclusive experience: an early-entry preview, a brief stadium tour, or a short meet-and-greet with a player or coach. The personal outreach is the activation. Fans who feel individually recognized by an organization convert to season tickets at a significantly higher rate than those who receive a standard sales message.' },
    { bullet: 'Organic growth fueled by emotional connection not ad spend', action: 'Action: After every home game, assign one staff member to capture and post a single authentic fan moment — a photo or a short clip — to your social channels with a personal caption. Tag the fan when possible. Set a 30-minute post-game deadline and treat it as a non-negotiable part of the post-game workflow. Fan-adjacent content consistently outperforms produced advertising content in engagement rate for teams at this budget level, and the only cost is the staff time required to capture it.' },
  ], { bullets: true });

  doc.moveDown(1);
  doc.fillColor(colors.gold).font('Helvetica-Bold').fontSize(11);
  doc.text('Official Partner of the Orlando Pirates (Kia Center)', { align: 'center' });

  doc.end();
  console.log('Written:', outPath);
}

writeTier1Pdf();
writeTier2Pdf();
