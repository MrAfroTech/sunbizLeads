// EventBrella New Client White Lable System - Frontend JavaScript

// Initialize Stripe (Always use real Stripe API - test/production controlled by keys)
// NOTE: Publishable keys are meant to be public, but should be injected at build time
// For now, using a placeholder - should be set via environment variable at build/deploy time
const TEST_MODE = false; // Always use real Stripe (test mode via sk_test_* keys, production via sk_live_* keys)
// Get publishable key based on TEST_MODE toggle (set via window.TEST_MODE or environment)
const IS_TEST_MODE = window.TEST_MODE === 'true' || (typeof process !== 'undefined' && process.env && process.env.TEST_MODE === 'true');
const STRIPE_PUBLISHABLE_KEY = IS_TEST_MODE 
  ? (window.STRIPE_TEST_PUBLISHABLE_KEY || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY) || '')
  : (window.STRIPE_LIVE_PUBLISHABLE_KEY || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_STRIPE_LIVE_PUBLISHABLE_KEY) || '');
let stripe = null;
let stripeElements;
let cardElement;

// Initialize Stripe when it becomes available (Stripe.js loads asynchronously)
function initializeStripe() {
  if (TEST_MODE) return;
  
  if (typeof window !== 'undefined' && typeof window.Stripe !== 'undefined') {
    if (!stripe) {
      stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
      console.log('✅ Stripe initialized');
    }
    return true;
  }
  return false;
}

// Try to initialize immediately if Stripe is already loaded
initializeStripe();

// Also try when DOM is ready (in case Stripe loads after our script)
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStripe);
  } else {
    // DOM already loaded, try again
    setTimeout(initializeStripe, 100);
  }
}

// API Base URL
// For Vercel: API routes are at /api/[filename] (without .js extension)
// Example: /api/stripe-payment, /api/stripe-webhook, etc.
const API_BASE_URL = '/api';

// Current selected tier
let selectedTier = null;
let selectedEventDate = null;

// Ticket prices
const TICKET_PRICES = {
    'basic': 10.00
};

// Single-fire protection for DOMContentLoaded
if (window.eventBrellaTicketingInitialized) {
    console.warn('App already initialized');
} else {
    window.eventBrellaTicketingInitialized = true;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
        try {
            // Check for eventDate from URL parameters (for backward compatibility)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('eventDate')) {
                selectedEventDate = urlParams.get('eventDate');
                // Update date display on page load
                updateEventDateDisplay();
            }
            
            initializeEventListeners();
            // Calendar removed - scheduling handled in ticket processing
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    });
}

// Track event listeners to prevent duplicates
const eventListenersAttached = new Set();

// Initialize event listeners
function initializeEventListeners() {
    try {
    // Ticket selection buttons (Get Tickets)
        const selectButtons = document.querySelectorAll('.btn-select');
        if (selectButtons && selectButtons.length > 0) {
            selectButtons.forEach(btn => {
                if (!btn) return;
                const btnId = btn.getAttribute('data-tier') || btn.textContent;
                if (!eventListenersAttached.has(`btn-select-${btnId}`)) {
        btn.addEventListener('click', (e) => {
            const tier = e.target.getAttribute('data-tier');
                        if (tier) {
            openPaymentModal(tier);
                        }
        });
                    eventListenersAttached.add(`btn-select-${btnId}`);
                }
    });
        }

    // Modal close
    const modalClose = document.querySelector('.modal-close');
    if (modalClose && !eventListenersAttached.has('modal-close')) {
        modalClose.addEventListener('click', closePaymentModal);
        eventListenersAttached.add('modal-close');
    }
    
    // Close modal on outside click (only attach once)
    if (!eventListenersAttached.has('modal-outside-click')) {
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('paymentModal');
        if (e.target === modal) {
            closePaymentModal();
        }
    });
        eventListenersAttached.add('modal-outside-click');
    }

    // Payment form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm && !eventListenersAttached.has('payment-form')) {
        paymentForm.addEventListener('submit', handlePayment);
        eventListenersAttached.add('payment-form');
    }
    
    // Ticket count changes
    const ticketCount = document.getElementById('ticketCount');
    if (ticketCount && !eventListenersAttached.has('ticket-count')) {
        ticketCount.addEventListener('input', updateTotal);
        eventListenersAttached.add('ticket-count');
    }
    
    // Set default event date only if not already set from URL
    if (!selectedEventDate) {
        selectedEventDate = '2026-01-03'; // Default to Cassava Harvest
    }

        // Map "View Map" scroll button
        const viewMapBtn = document.querySelector('.map-btn-scroll');
        if (viewMapBtn && !eventListenersAttached.has('view-map-btn')) {
            viewMapBtn.addEventListener('click', () => {
                const mapFrame = document.getElementById('map-frame');
                if (mapFrame && typeof mapFrame.scrollIntoView === 'function') {
                    mapFrame.scrollIntoView({ behavior: 'smooth' });
                }
            });
            eventListenersAttached.add('view-map-btn');
        }

        // Calendar filters removed - no longer needed
    } catch (error) {
        console.error('Failed to initialize event listeners:', error);
    }
}

// Format date for display
function formatEventDateForDisplay(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Get event name from date (lookup from URL params or default)
function getEventNameFromDate(dateString) {
    const urlParams = new URLSearchParams(window.location.search);
    const eventName = urlParams.get('eventName');
    if (eventName) return eventName;
    
    // Default event names based on date
    if (dateString === '2026-01-03') return 'Cassava Harvest';
    if (dateString === '2026-03-03') return 'Yuca Harvest';
    if (dateString === '2026-04-03') return 'Mulberry Harvest';
    return 'Harvest Experience';
}

// Update event date display in the form
function updateEventDateDisplay() {
    if (!selectedEventDate) return;
    
    const eventDatePill = document.getElementById('eventDate');
    if (!eventDatePill) return;
    
    const eventDateSpan = eventDatePill.querySelector('span:last-child');
    const eventDateSmall = eventDatePill.nextElementSibling;
    
    const formattedDate = formatEventDateForDisplay(selectedEventDate);
    const eventName = getEventNameFromDate(selectedEventDate);
    // Determine event time: Farm Tour = 9-11 AM, Harvests = 8-10 AM
    const eventTime = eventName && eventName.includes('Farm Tour') ? '9:00 AM - 11:00 AM EST' : '8:00 AM - 10:00 AM EST';
    
    if (eventDateSpan) {
        eventDateSpan.textContent = `${formattedDate} • ${eventTime}`;
    }
    
    if (eventDateSmall && eventDateSmall.tagName === 'SMALL') {
        eventDateSmall.textContent = `${eventName} on ${formattedDate}.`;
    }
}

// Open payment modal
function openPaymentModal(tier) {
    if (!tier) {
        console.error('No tier provided to openPaymentModal');
        return;
    }
    
    selectedTier = tier;
    const modal = document.getElementById('paymentModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (!modal || !modalTitle) {
        console.error('Payment modal elements not found');
        return;
    }
    
    const tierNames = {
        'basic': '$10 Harvest Ticket'
    };
    
    modalTitle.textContent = `Purchase ${tierNames[tier] || tier} Tickets`;
    
    // Update event date display if we have a selected event date
    updateEventDateDisplay();
    
    // Team registration fields are not used for the current basic tier
    const teamMemberGroup = document.getElementById('teamMemberGroup');
    const ticketCountGroup = document.getElementById('ticketCountGroup');
    const ticketCountLabel = document.getElementById('ticketCountLabel');
    const teamMemberName = document.getElementById('teamMemberName');
    const ticketCount = document.getElementById('ticketCount');
    
    if (teamMemberGroup) teamMemberGroup.style.display = 'none';
    if (teamMemberName) teamMemberName.required = false;
    if (ticketCountLabel) ticketCountLabel.textContent = 'Number of Tickets *';
    if (ticketCount) ticketCount.max = '10';
    
    // Date selection will be handled in ticket processing - no date generation on splash page
    
    // Stripe Checkout: Hide card element (not needed for redirect flow)
    const cardElementDiv = document.getElementById('cardElement');
    if (cardElementDiv) {
        cardElementDiv.style.display = 'none';
    }
    
    updateTotal();
    modal.style.display = 'block';
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    const paymentForm = document.getElementById('paymentForm');
    if (modal) modal.style.display = 'none';
    if (paymentForm) paymentForm.reset();
    selectedTier = null;
    selectedEventDate = null;
}

// Close success modal
function closeSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (successModal) successModal.style.display = 'none';
    closePaymentModal();
}

// All date generation removed - splash page is simple, no date handling
// Date selection will be handled in ticket processing flow

// Update total amount
function updateTotal() {
    if (!selectedTier) return;
    
    const ticketCountEl = document.getElementById('ticketCount');
    const ticketPriceEl = document.getElementById('ticketPrice');
    const ticketQuantityEl = document.getElementById('ticketQuantity');
    const totalAmountEl = document.getElementById('totalAmount');
    
    if (!ticketCountEl || !ticketPriceEl || !ticketQuantityEl || !totalAmountEl) {
        return;
    }
    
    const ticketCount = parseInt(ticketCountEl.value) || 1;
    const price = TICKET_PRICES[selectedTier];
    if (!price) return;
    
    const total = price * ticketCount;
    
    ticketPriceEl.textContent = `$${price.toFixed(2)}`;
    ticketQuantityEl.textContent = ticketCount;
    totalAmountEl.textContent = `$${total.toFixed(2)}`;
}

// Handle payment form submission
async function handlePayment(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const buttonText = document.getElementById('buttonText');
    const spinner = document.getElementById('spinner');
    const cardErrors = document.getElementById('cardErrors');
    
    if (!submitButton || !buttonText || !spinner || !cardErrors) {
        console.error('Payment form elements not found');
        return;
    }
    
    // Disable button and show spinner
    submitButton.disabled = true;
    buttonText.textContent = 'Processing...';
    spinner.classList.remove('hidden');
    cardErrors.textContent = '';
    
    try {
        // Get form data with defensive checks
        const customerName = document.getElementById('customerName')?.value || '';
        const customerEmail = document.getElementById('customerEmail')?.value || '';
        const customerPhone = document.getElementById('customerPhone')?.value || '';
        // Use selected event date if available, otherwise default to Cassava Harvest
        const eventDate = selectedEventDate || '2026-01-03';
        const ticketCount = parseInt(document.getElementById('ticketCount')?.value) || 1;
        const teamMemberName = document.getElementById('teamMemberName')?.value || null;
        
        // Validate required fields
        if (!customerName || !customerEmail || !eventDate) {
            throw new Error('Please fill in all required fields');
        }
        
        // Step 1: Create payment intent
        const paymentResponse = await fetch(`${API_BASE_URL}/stripe-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tier: selectedTier,
                eventDate: eventDate,
                customerEmail: customerEmail,
                customerName: customerName,
                customerPhone: customerPhone || undefined,
                ticketCount: ticketCount,
                teamMemberName: teamMemberName || undefined
            })
        });

        // Ensure we got JSON back (Vercel 404s often return HTML like "The page could not be found")
        const paymentContentType = paymentResponse.headers.get('content-type') || '';
        let paymentData;
        if (!paymentContentType.includes('application/json')) {
            const rawText = await paymentResponse.text();
            throw new Error(
                `Payment service returned a non-JSON response (status ${paymentResponse.status}). ` +
                `${rawText.slice(0, 140)}`
            );
        }
        
        paymentData = await paymentResponse.json();
        
        if (!paymentData.success) {
            throw new Error(paymentData.message || 'Payment processing failed');
        }
        
        // Stripe Checkout: Redirect to session URL
        if (paymentData.sessionUrl) {
            window.location.href = paymentData.sessionUrl;
            return;
        }
        
        throw new Error('No checkout session URL received');
        
    } catch (error) {
        console.error('Critical payment error:', error);
        if (cardErrors) {
            cardErrors.textContent = error.message || 'An unexpected error occurred. Please refresh and try again.';
        }
    } finally {
        // Ensure button is re-enabled
        if (submitButton) {
        submitButton.disabled = false;
        }
        if (buttonText) {
        buttonText.textContent = 'Purchase Tickets';
        }
        if (spinner) {
        spinner.classList.add('hidden');
    }
    }
}

// Calendar section removed - scheduling will be handled in ticket processing flow
