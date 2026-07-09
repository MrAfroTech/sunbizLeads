// All Events Page - It'll Happen Boyz Summer Showcase 2026

// Single main event with tier options (links to index for checkout)
const MAIN_EVENT = {
    id: 'summer-showcase-2026',
    name: 'Summer Showcase 2026',
    date: '2026-01-26',
    displayDate: 'Sunday, January 26 – Tuesday, January 28, 2026',
    time: '8:00 AM - 6:00 PM',
    venue: 'TBA',
    organizer: "It'll Happen Boyz Summer Showcase",
    tiers: [
        { id: 'day-pass', name: 'Day Pass', price: 20 },
        { id: 'weekend-pass', name: 'Weekend Pass', price: 52 },
        { id: 'vip-day-pass', name: 'VIP Day Pass', price: 60 },
        { id: 'vip-weekend-pass', name: 'VIP Weekend Pass', price: 152 }
    ],
    description: "Where Champions Are Made. 3 days. Full regulation games. MVP winners every single game. 5U-14U athletes. Professional coaching from Coach Kei and Coach Lee."
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
});

function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';

    const event = MAIN_EVENT;
    const eventCard = document.createElement('div');
    eventCard.className = 'event-card';
    eventCard.innerHTML = `
        <div class="event-tooltip">${event.description || ''}</div>
        <div class="event-name" style="font-size: 1.3rem; font-weight: bold; color: #333; margin-bottom: 12px;">${event.name}</div>
        <div class="event-time">${event.time}</div>
        <div class="event-venue">${event.venue}</div>
        <div style="margin: 12px 0; padding: 12px; background: var(--bg-light, #f8f9fa); border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${event.displayDate}</div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0;">
            ${event.tiers.map(t => `
                <div style="flex: 1 1 120px; padding: 12px; border: 2px solid var(--border-color, #ddd); border-radius: 8px;">
                    <div style="font-weight: 600;">${t.name}</div>
                    <div class="event-price">$${t.price.toFixed(0)}</div>
                    <a href="/?tier=${t.id}" class="select-event-btn" style="display: inline-block; margin-top: 8px; text-align: center; text-decoration: none;">Get Tickets</a>
                </div>
            `).join('')}
        </div>
        <a href="/" class="select-event-btn" style="display: inline-block; margin-top: 12px;">View Event & Get Tickets</a>
    `;
    eventsGrid.appendChild(eventCard);
}
