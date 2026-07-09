// All Events Page - It'll Happen Boyz Summer Showcase 2026 (single $50 Team Registration)

const MAIN_EVENT = {
    id: 'summer-showcase-2026',
    name: 'Summer Showcase 2026',
    date: '2026-01-26',
    displayDate: 'Sunday, January 26 – Tuesday, January 28, 2026',
    time: '8:00 AM - 6:00 PM',
    venue: 'TBA',
    organizer: "It'll Happen Boyz Summer Showcase",
    tiers: [
        { id: 'registration', name: 'Team Registration', price: 50 }
    ],
    description: "Register your team for Summer Showcase 2026. Full 3-day event access. 2 games guaranteed. MVP winner every game. Professional coaching from Coach Kei and Coach Lee."
};

document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
});

function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';

    const event = MAIN_EVENT;
    const t = event.tiers[0];
    const eventCard = document.createElement('div');
    eventCard.className = 'event-card';
    eventCard.innerHTML = `
        <div class="event-name" style="font-size: 1.3rem; font-weight: bold; color: #333; margin-bottom: 12px;">${event.name}</div>
        <div class="event-time">${event.time}</div>
        <div class="event-venue">${event.venue}</div>
        <div style="margin: 12px 0; padding: 12px; background: var(--bg-light, #f8f9fa); border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${event.displayDate}</div>
        </div>
        <div style="margin: 16px 0; padding: 16px; border: 2px solid var(--accent, #E63946); border-radius: 8px; text-align: center;">
            <div style="font-weight: 600;">${t.name}</div>
            <div class="event-price">$${t.price.toFixed(0)}</div>
            <a href="/?tier=${t.id}" class="select-event-btn" style="display: inline-block; margin-top: 8px; text-align: center; text-decoration: none;">Register Team</a>
        </div>
        <a href="/" class="select-event-btn" style="display: inline-block; margin-top: 12px;">View Event & Register</a>
    `;
    eventsGrid.appendChild(eventCard);
}
