// Strike After Dark — tier selection → payment flow

const EVENT = {
  id: 'strike-after-dark-2026-06-04',
  date: '2026-06-04',
  name: 'Bosses & Bowling',
  displayDate: 'Thursday, June 4, 2026',
  time: '9:00 PM - 12:00 AM EST',
  venue: 'The Alley',
  // Per-event Stripe mode: true = test keys until the event is ready for live
  isTestMode: true
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tier-btn[data-tier]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tier = btn.getAttribute('data-tier');
      const tierName = btn.getAttribute('data-name') || tier;
      const qty = btn.getAttribute('data-qty') || '1';

      const params = new URLSearchParams({
        eventId: EVENT.id,
        eventDate: EVENT.date,
        eventName: EVENT.name,
        tier: tier,
        tierName: tierName,
        ticketCount: qty,
        isTestMode: EVENT.isTestMode !== false ? 'true' : 'false'
      });

      window.location.href = `/payment.html?${params.toString()}`;
    });
  });
});

// Kept for API parity with events loader
const MONTHLY_HARVEST_EVENTS = [];
const SPECIAL_EVENTS = [
  {
    id: 'strike-after-dark-2026-06-04',
    name: 'Bosses & Bowling',
    date: '2026-06-04',
    displayDate: 'Thursday, June 4, 2026',
    time: '9:00 PM - 12:00 AM EST',
    venue: 'The Alley',
    organizer: 'Strike After Dark',
    price: 20.0,
    tier: 'ga',
    isTestMode: true,
    description: 'The Ultimate Thursday Night Experience at The Alley. Good people, good music, good vibes.'
  }
];

function selectEvent(event) {
  const eventDate = typeof event === 'string' ? event : event.date;
  const eventName = typeof event === 'object' ? event.name : EVENT.name;
  const eventId = typeof event === 'object' && event.id ? event.id : EVENT.id;
  const tier = typeof event === 'object' && event.tier ? event.tier : 'ga';
  const isTestMode =
    typeof event === 'object' && typeof event.isTestMode === 'boolean'
      ? event.isTestMode
      : EVENT.isTestMode !== false;
  const params = new URLSearchParams({
    eventId,
    eventDate,
    eventName,
    tier,
    isTestMode: isTestMode ? 'true' : 'false'
  });
  window.location.href = `/payment.html?${params.toString()}`;
}
