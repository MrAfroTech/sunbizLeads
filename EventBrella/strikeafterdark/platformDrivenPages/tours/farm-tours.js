// Farm Tours Page - Platform Driven Version - Redirects to platform-driven payment

// Monthly Harvest Experience events (12 events)
const MONTHLY_HARVEST_EVENTS = [
    { id: 'harvest-2025-12-14', date: '2025-12-14', displayDate: 'Sunday, December 14, 2025' },
    { id: 'harvest-2026-01-11', date: '2026-01-11', displayDate: 'Sunday, January 11, 2026' },
    { id: 'harvest-2026-02-08', date: '2026-02-08', displayDate: 'Sunday, February 8, 2026' },
    { id: 'harvest-2026-03-08', date: '2026-03-08', displayDate: 'Sunday, March 8, 2026' },
    { id: 'harvest-2026-04-12', date: '2026-04-12', displayDate: 'Sunday, April 12, 2026' },
    { id: 'harvest-2026-05-10', date: '2026-05-10', displayDate: 'Sunday, May 10, 2026' },
    { id: 'harvest-2026-06-14', date: '2026-06-14', displayDate: 'Sunday, June 14, 2026' },
    { id: 'harvest-2026-07-12', date: '2026-07-12', displayDate: 'Sunday, July 12, 2026' },
    { id: 'harvest-2026-08-09', date: '2026-08-09', displayDate: 'Sunday, August 9, 2026' },
    { id: 'harvest-2026-09-13', date: '2026-09-13', displayDate: 'Sunday, September 13, 2026' },
    { id: 'harvest-2026-10-11', date: '2026-10-11', displayDate: 'Sunday, October 11, 2026' },
    { id: 'harvest-2026-11-08', date: '2026-11-08', displayDate: 'Sunday, November 8, 2026' }
];

// Today in YYYY-MM-DD (local date)
function getTodayYYYYMMDD() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Farm Tours end at 11 AM EST — if it's today and past 11 AM, hide the event
function isCurrentTimePast11AMEST() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false });
    const hour = parseInt(formatter.format(now), 10);
    return hour >= 11;
}

function isEventAvailable(event) {
    const today = getTodayYYYYMMDD();
    const eventDate = event.date;
    if (eventDate > today) return true;
    if (eventDate < today) return false;
    if (eventDate === today) return !isCurrentTimePast11AMEST();
    return false;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
});

// Render Farm Tour events only (past events hidden)
function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    const availableEvents = MONTHLY_HARVEST_EVENTS.filter(isEventAvailable);
    eventsGrid.innerHTML = '';

    // Render Monthly Farm Tour card only if there are available dates
    if (availableEvents.length > 0) {
        const monthlyCard = document.createElement('div');
        monthlyCard.className = 'event-card';
        const monthlyDescription = 'Get ready to experience the wonders of farm life up close and personal. Strike After Dark shares fascinating insights, stories, and a few Dad jokes. Occasionally, local celebrity farmers will drop by and share the newest planting varieties and technics. So, grab your family and friends, come on down to Bosses & Bowling for an unforgettable morning of laughter, learning, and making memories. Your appetite is requested because whatever is in season, we consume. Bring your kids, a hat, and lots of curiosity.';
        monthlyCard.innerHTML = `
            <div class="event-tooltip">${monthlyDescription}</div>
            <div class="event-name">Monthly Farm Tour</div>
            <div class="event-time">9:00 AM - 11:00 AM EST</div>
            <div class="event-venue">Bosses & Bowling</div>
            <div style="margin: 20px 0;">
                <label for="monthlyDateSelect" style="display: block; margin-bottom: 10px; font-weight: 600; color: var(--text-dark);">Select Date:</label>
                <select id="monthlyDateSelect" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: white; cursor: pointer;">
                    <option value="">Choose a date...</option>
                    ${availableEvents.map(event =>
                        `<option value="${event.date}" data-display="${event.displayDate}">${event.displayDate}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="event-price">$10.00</div>
            <button class="select-event-btn" id="monthlyHarvestBtn" disabled>
                Get Tickets
            </button>
        `;

        const select = monthlyCard.querySelector('#monthlyDateSelect');
        const btn = monthlyCard.querySelector('#monthlyHarvestBtn');

        select.addEventListener('change', (e) => {
            if (e.target.value) {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedDate = select.value;
            if (selectedDate) {
                const selectedEvent = availableEvents.find(e => e.date === selectedDate);
                if (selectedEvent) {
                    selectEvent({
                        name: 'Bosses & Bowling',
                        date: selectedDate,
                        displayDate: selectedEvent.displayDate
                    });
                }
            }
        });

        eventsGrid.appendChild(monthlyCard);
    }
}

// Handle event selection - redirect to platform-driven payment page
function selectEvent(event) {
    // Get event date and name
    const eventDate = typeof event === 'string' ? event : event.date;
    const eventName = typeof event === 'object' ? event.name : null;
    
    // Redirect to platform-driven payment page with eventDate and eventName parameters
    const params = new URLSearchParams({ eventDate: eventDate });
    if (eventName) {
        params.set('eventName', eventName);
    }
    window.location.href = `/platformDrivenPages/tours/payment.html?${params.toString()}`;
}

