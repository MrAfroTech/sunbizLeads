// Harvest Experiences Page - Platform Driven Version - Redirects to platform-driven payment

// Special events (Cassava/Yuca, Sugar Cane)
const SPECIAL_EVENTS = [
    {
        id: 'cassava-harvest-2026-01-03',
        name: 'Cassava/Yuca Harvest',
        date: '2026-01-03',
        displayDate: 'Saturday, January 3, 2026',
        time: '8:00 AM - 10:00 AM EST',
        venue: '—',
        organizer: '—',
        price: 10.00,
        tier: 'basic',
        description: 'Join us for a special cassava and yuca harvest! Learn how to identify, dig, and prepare these versatile root vegetables. Both cassava and yuca (also known as cassava) are staple crops in many cultures and can be used in everything from fries to bread. Take home fresh roots and learn traditional preparation methods.'
    },
    {
        id: 'sugar-cane-harvest-2026-03-14',
        name: 'Sugar Cane Harvest',
        date: '2026-03-14',
        displayDate: 'Saturday, March 14, 2026',
        time: '8:00 AM - 10:00 AM EST',
        venue: '—',
        organizer: '—',
        price: 10.00,
        tier: 'basic',
        description: 'Harvest fresh sugar cane from the farm! Learn how to cut, process, and enjoy this sweet tropical grass. Sugar cane can be chewed fresh, juiced, or used to make syrup and other sweet treats. Experience the traditional methods of harvesting and processing sugar cane. Take home fresh stalks to enjoy!'
    }
];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
});

// Render special harvest events only
function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';

    // Render special events
    SPECIAL_EVENTS.forEach(event => {
        // Split event name into two parts (e.g., "Cassava Harvest" -> "Cassava" and "Harvest")
        const nameParts = event.name.split(' ');
        const firstName = nameParts[0]; // "Cassava", "Yuca", or "Sugar"
        const lastName = nameParts.slice(1).join(' '); // "Harvest" or "Cane Harvest"
        
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

        // Add click handler to button - pass the full event object and redirect to platform-driven payment
        const button = eventCard.querySelector('.select-event-btn');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            selectEvent(event);
        });

        eventsGrid.appendChild(eventCard);
    });
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

