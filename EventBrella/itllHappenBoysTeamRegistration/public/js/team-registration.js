// Team Registration Landing - Single $50 ticket option

const TEAM_REGISTRATION = {
    id: 'team-registration-2026',
    name: 'Team Registration',
    date: '2026-01-26',
    displayDate: 'January 26–28, 2026',
    price: 50.00,
    tier: 'registration',
    descriptionBullets: [
        'Register your team for Summer Showcase 2026',
        'Full 3-day event access',
        '2 games guaranteed',
        'MVP winner every game',
        'Professional coaching from Coach Kei and Coach Lee'
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    renderRegistrationCard();
});

function renderRegistrationCard() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    const e = TEAM_REGISTRATION;
    const bulletsHtml = e.descriptionBullets.map(b => `<li>${b}</li>`).join('');

    const eventCard = document.createElement('div');
    eventCard.className = 'event-card registration-card';
    eventCard.innerHTML = `
        <div class="event-name">${e.name}</div>
        <div class="event-price">$${e.price.toFixed(2)}</div>
        <ul class="registration-description">${bulletsHtml}</ul>
        <button type="button" class="select-event-btn">Register Team</button>
    `;

    const button = eventCard.querySelector('.select-event-btn');
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        selectEvent(TEAM_REGISTRATION);
    });

    eventsGrid.appendChild(eventCard);
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








