// All Events Page - Event Selection and Payment Flow

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

// Special events (client-specific; replace names and descriptions)
const SPECIAL_EVENTS = [
    {
        id: 'CLIENT_EVENT_SLUG_FIRST',
        name: 'Cassava/Yuca Harvest',
        date: '2026-01-03',
        displayDate: 'Saturday, January 3, 2026',
        time: '8:00 AM - 10:00 AM EST',
        venue: 'CLIENT_VENUE_NAME',
        organizer: 'CLIENT_ORGANIZER_NAME',
        price: 10.00,
        tier: 'basic',
        description: 'CLIENT_SPECIAL_EVENT_DESCRIPTION'
    },
    {
        id: 'CLIENT_EVENT_SLUG_SECOND',
        name: 'CLIENT_SPECIAL_EVENT_NAME_2',
        date: '2026-03-14',
        displayDate: 'Saturday, March 14, 2026',
        time: '8:00 AM - 10:00 AM EST',
        venue: 'CLIENT_VENUE_NAME',
        organizer: 'CLIENT_ORGANIZER_NAME',
        price: 10.00,
        tier: 'basic',
        description: 'CLIENT_SPECIAL_EVENT_DESCRIPTION_2'
    }
];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
});

// Render all events
function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';

    // Render Monthly Farm Tour card with dropdown
    const monthlyCard = document.createElement('div');
    monthlyCard.className = 'event-card';
    const monthlyDescription = 'CLIENT_MONTHLY_EVENT_DESCRIPTION';
    monthlyCard.innerHTML = `
        <div class="event-tooltip">${monthlyDescription}</div>
        <div class="event-name">Monthly Farm Tour</div>
        <div class="event-time">9:00 AM - 11:00 AM EST</div>
        <div class="event-venue">CLIENT_VENUE_NAME</div>
        <div style="margin: 20px 0;">
            <label for="monthlyDateSelect" style="display: block; margin-bottom: 10px; font-weight: 600; color: var(--text-dark);">Select Date:</label>
            <select id="monthlyDateSelect" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: white; cursor: pointer;">
                <option value="">Choose a date...</option>
                ${MONTHLY_HARVEST_EVENTS.map(event => 
                    `<option value="${event.date}" data-display="${event.displayDate}">${event.displayDate}</option>`
                ).join('')}
            </select>
        </div>
        <div class="event-price">$10.00</div>
        <button class="select-event-btn" id="monthlyHarvestBtn" disabled>
            Get Tickets
        </button>
    `;

    // Handle dropdown change
    const select = monthlyCard.querySelector('#monthlyDateSelect');
    const btn = monthlyCard.querySelector('#monthlyHarvestBtn');
    
    select.addEventListener('change', (e) => {
        if (e.target.value) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    });

    // Handle button click for monthly harvest
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedDate = select.value;
        if (selectedDate) {
            const selectedEvent = MONTHLY_HARVEST_EVENTS.find(e => e.date === selectedDate);
            selectEvent({
                name: 'Farm Tour',
                date: selectedDate,
                displayDate: selectedEvent.displayDate
            });
        }
    });

    eventsGrid.appendChild(monthlyCard);

    // Render special events
    SPECIAL_EVENTS.forEach(event => {
        // Split event name into two parts (e.g., "Cassava Harvest" -> "Cassava" and "Harvest")
        const nameParts = event.name.split(' ');
        const firstName = nameParts[0]; // "Cassava", "Yuca", or "Mulberry"
        const lastName = nameParts.slice(1).join(' '); // "Harvest"
        
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            <div class="event-tooltip">${event.description || ''}</div>
            <div style="font-size: 1.3rem !important; font-weight: bold !important; color: #333 !important; margin-bottom: 12px; line-height: 1.3;">
                <div>${firstName}</div>
                <div>${lastName}</div>
            </div>
            <div class="event-time">${event.time}</div>
            <div class="event-venue">${event.venue}</div>
            <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: var(--text-dark);">Select Date:</label>
                <div style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: white; color: #333;">
                    ${event.displayDate}
                </div>
            </div>
            <div class="event-price">$${event.price.toFixed(2)}</div>
            <button class="select-event-btn" data-event-date="${event.date}">
                Get Tickets
            </button>
        `;

        // Add click handler to button - pass the full event object
        const button = eventCard.querySelector('.select-event-btn');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            selectEvent(event);
        });

        eventsGrid.appendChild(eventCard);
    });
}

// Handle event selection
function selectEvent(event) {
    // Get event date and name
    const eventDate = typeof event === 'string' ? event : event.date;
    const eventName = typeof event === 'object' ? event.name : null;
    
    // Redirect to standalone payment page with eventDate and eventName parameters
    const params = new URLSearchParams({ eventDate: eventDate });
    if (eventName) {
        params.set('eventName', eventName);
    }
    window.location.href = `/payment.html?${params.toString()}`;
}
