import React from 'react';
import './EventsList.css';

const COFFEE_EVENTS = [
    {
        id: 'coffee-winter-warmup-2024-12-07',
        name: 'Winter Warm-Up Coffee Session',
        date: '2024-12-07',
        displayDate: 'Saturday, December 7, 2024',
        time: '10:00 AM - 12:00 PM EST',
        venue: 'Coffee Conversations Collective',
        organizer: 'Coffee Conversations Collective',
        price: 25.00,
        tier: 'basic',
        icon: '☕',
        description: 'Join us for a cozy winter coffee session featuring specialty hot beverages and warm conversations. Perfect for starting your weekend with great coffee and even better company. We\'ll explore winter coffee blends, learn about different brewing methods, and connect with fellow coffee enthusiasts.'
    },
    {
        id: 'holiday-coffee-social-2024-12-21',
        name: 'Holiday Coffee Social',
        date: '2024-12-21',
        displayDate: 'Saturday, December 21, 2024',
        time: '2:00 PM - 4:00 PM EST',
        venue: 'Coffee Conversations Collective',
        organizer: 'Coffee Conversations Collective',
        price: 30.00,
        tier: 'basic',
        icon: '🎄',
        description: 'Celebrate the holiday season with festive coffee drinks, seasonal treats, and joyful conversations. This special holiday gathering includes holiday-themed coffee tastings, festive music, and an opportunity to connect with your community. Perfect for spreading holiday cheer!'
    },
    {
        id: 'new-year-conversations-2025-01-04',
        name: 'New Year Conversations & Coffee',
        date: '2025-01-04',
        displayDate: 'Saturday, January 4, 2025',
        time: '10:00 AM - 12:00 PM EST',
        venue: 'Coffee Conversations Collective',
        organizer: 'Coffee Conversations Collective',
        price: 25.00,
        tier: 'basic',
        icon: '🎊',
        description: 'Start the new year right with inspiring conversations over premium coffee. Share your goals, dreams, and aspirations with a supportive community while enjoying artisanal coffee blends. This event focuses on intention-setting, connection, and kicking off 2025 with positive energy.'
    },
    {
        id: 'coffee-connoisseur-workshop-2025-01-18',
        name: 'Coffee Connoisseur Workshop',
        date: '2025-01-18',
        displayDate: 'Saturday, January 18, 2025',
        time: '1:00 PM - 3:00 PM EST',
        venue: 'Coffee Conversations Collective',
        organizer: 'Coffee Conversations Collective',
        price: 35.00,
        tier: 'basic',
        icon: '👨‍🎓',
        description: 'Dive deep into the world of coffee with our hands-on connoisseur workshop. Learn about coffee origins, flavor profiles, cupping techniques, and advanced brewing methods. Includes coffee tastings, educational materials, and expert guidance. Perfect for both beginners and coffee enthusiasts looking to expand their knowledge.'
    }
];

function EventsList({ onSelectEvent }) {
    const handleSelectEvent = (event) => {
        // Redirect to payment page with event details (matching farmerBanks allevents.js)
        const params = new URLSearchParams({ eventDate: event.date });
        if (event.name) {
            params.set('eventName', event.name);
        }
        window.location.href = `/payment.html?${params.toString()}`;
    };

    return (
        <div className="events-list-container">
            {/* Hero Section */}
            <div className="events-hero">
                <div className="events-hero-content">
                    <h1 className="events-hero-title">☕ Coffee Conversations Collective</h1>
                    <p className="events-hero-subtitle">Join us for meaningful conversations over great coffee</p>
                    
                    <div className="events-badges">
                        <div className="event-badge">
                            <span>☕</span>
                            <span>Premium Coffee</span>
                        </div>
                        <div className="event-badge">
                            <span>💬</span>
                            <span>Engaging Conversations</span>
                        </div>
                        <div className="event-badge">
                            <span>🎯</span>
                            <span>Community Events</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Section */}
            <div className="events-content">
                <div className="events-header">
                    <h2>Upcoming Events</h2>
                    <p>Choose your event to purchase tickets</p>
                </div>

                <div className="events-grid">
                    {COFFEE_EVENTS.map((event) => (
                        <div key={event.id} className="event-card">
                            <div className="event-tooltip">{event.description}</div>
                            <div className="event-icon">{event.icon}</div>
                            <div className="event-name">{event.name}</div>
                            <div className="event-date">{event.displayDate}</div>
                            <div className="event-time">{event.time}</div>
                            <div className="event-venue">{event.venue}</div>
                            <div className="event-description">{event.description}</div>
                            <div className="event-price">${event.price.toFixed(2)}</div>
                            <button
                                className="select-event-btn"
                                onClick={() => handleSelectEvent(event)}
                            >
                                Get Tickets
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EventsList;
