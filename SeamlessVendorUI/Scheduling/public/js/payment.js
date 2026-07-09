// Standalone Payment Page JavaScript

// API Base URL
const API_BASE_URL = '/api';

// Current selected tier and event date
let selectedTier = 'basic';
let selectedEventDate = null;

// Ticket prices
const TICKET_PRICES = {
    'basic': 25.00
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check for eventDate from URL parameters (from /allevents selection)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('eventDate')) {
            selectedEventDate = urlParams.get('eventDate');
        }
        
        // Pre-populate contact details from URL parameters (from email campaigns)
        if (urlParams.has('email')) {
            const emailField = document.getElementById('customerEmail');
            if (emailField) {
                emailField.value = urlParams.get('email');
            }
        }
        
        if (urlParams.has('name')) {
            const nameField = document.getElementById('customerName');
            if (nameField) {
                nameField.value = urlParams.get('name');
            }
        }
        
        // Also check for 'customerName' as alternative parameter name
        if (urlParams.has('customerName') && !urlParams.has('name')) {
            const nameField = document.getElementById('customerName');
            if (nameField) {
                nameField.value = urlParams.get('customerName');
            }
        }
        
        if (urlParams.has('phone')) {
            const phoneField = document.getElementById('customerPhone');
            if (phoneField) {
                phoneField.value = urlParams.get('phone');
            }
        }
        
        // Also check for 'customerPhone' as alternative parameter name
        if (urlParams.has('customerPhone') && !urlParams.has('phone')) {
            const phoneField = document.getElementById('customerPhone');
            if (phoneField) {
                phoneField.value = urlParams.get('customerPhone');
            }
        }
        
        // Set tier
        selectedTier = 'basic';
        
        // Update event date display
        updateEventDateDisplay();
        
        // Update page title
        updatePageTitle();
        
        // Setup form
        setupForm();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Update total on load
        updateTotal();
        
    } catch (error) {
        console.error('Failed to initialize payment page:', error);
    }
});

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
    
    // Default event names based on date - Coffee Conversations events
    if (dateString === '2024-12-07') return 'Winter Warm-Up Coffee Session';
    if (dateString === '2024-12-21') return 'Holiday Coffee Social';
    if (dateString === '2025-01-04') return 'New Year Conversations & Coffee';
    if (dateString === '2025-01-18') return 'Coffee Connoisseur Workshop';
    return 'Coffee Conversation Event';
}

// Get event time from event name/date
function getEventTime(eventName, dateString) {
    if (eventName && eventName.includes('Holiday')) return '2:00 PM - 4:00 PM EST';
    if (eventName && eventName.includes('Workshop')) return '1:00 PM - 3:00 PM EST';
    return '10:00 AM - 12:00 PM EST'; // Default
}

// Update event date display
function updateEventDateDisplay() {
    if (!selectedEventDate) return;
    
    const eventDatePill = document.getElementById('eventDate');
    if (!eventDatePill) return;
    
    const eventDateSpan = eventDatePill.querySelector('span:last-child');
    const eventDateSmall = eventDatePill.nextElementSibling;
    
    const formattedDate = formatEventDateForDisplay(selectedEventDate);
    const eventName = getEventNameFromDate(selectedEventDate);
    const eventTime = getEventTime(eventName, selectedEventDate);
    
    if (eventDateSpan) {
        eventDateSpan.textContent = `${formattedDate} • ${eventTime}`;
    }
    
    if (eventDateSmall && eventDateSmall.tagName === 'SMALL') {
        eventDateSmall.textContent = `${eventName} on ${formattedDate}.`;
    }
}

// Update page title
function updatePageTitle() {
    const pageTitle = document.getElementById('pageTitle');
    if (!pageTitle) return;
    
    const eventName = getEventNameFromDate(selectedEventDate);
    pageTitle.textContent = `Purchase ${eventName} Tickets`;
}

// Setup form
function setupForm() {
    const teamMemberGroup = document.getElementById('teamMemberGroup');
    const ticketCountLabel = document.getElementById('ticketCountLabel');
    const teamMemberName = document.getElementById('teamMemberName');
    const ticketCount = document.getElementById('ticketCount');
    const cardElementDiv = document.getElementById('cardElement');
    
    if (teamMemberGroup) teamMemberGroup.style.display = 'none';
    if (teamMemberName) teamMemberName.required = false;
    if (ticketCountLabel) ticketCountLabel.textContent = 'Number of Tickets *';
    if (ticketCount) ticketCount.max = '10';
    
    // Hide card element (Stripe Checkout redirect flow)
    if (cardElementDiv) {
        cardElementDiv.style.display = 'none';
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Payment form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }
    
    // Ticket count change
    const ticketCount = document.getElementById('ticketCount');
    if (ticketCount) {
        ticketCount.addEventListener('change', updateTotal);
        ticketCount.addEventListener('input', updateTotal);
    }
}

// Update total amount
function updateTotal() {
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
    
    // Get event-specific price
    const eventName = getEventNameFromDate(selectedEventDate);
    let unitPrice = price;
    if (eventName && eventName.includes('Workshop')) {
        unitPrice = 35.00;
    } else if (eventName && eventName.includes('Holiday')) {
        unitPrice = 30.00;
    }
    
    const total = unitPrice * ticketCount;
    
    ticketPriceEl.textContent = `$${unitPrice.toFixed(2)}`;
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
        // Get form data
        const customerName = document.getElementById('customerName')?.value || '';
        const customerEmail = document.getElementById('customerEmail')?.value || '';
        const customerPhone = document.getElementById('customerPhone')?.value || '';
        const eventDate = selectedEventDate;
        const eventName = getEventNameFromDate(eventDate);
        const ticketCount = parseInt(document.getElementById('ticketCount')?.value) || 1;
        const teamMemberName = document.getElementById('teamMemberName')?.value || null;
        
        // Validate required fields
        if (!customerName || !customerEmail || !eventDate) {
            throw new Error('Please fill in all required fields');
        }
        
        // Create Stripe Checkout Session
        const paymentResponse = await fetch(`${API_BASE_URL}/stripe-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tier: selectedTier,
                eventDate: eventDate,
                eventName: eventName,
                customerEmail: customerEmail,
                customerName: customerName,
                customerPhone: customerPhone || undefined,
                ticketCount: ticketCount,
                teamMemberName: teamMemberName || undefined
            })
        });

        // Check response
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
            throw new Error(paymentData.message || 'Payment initialization failed');
        }
        
        // Redirect to Stripe Checkout
        if (paymentData.sessionUrl) {
            window.location.href = paymentData.sessionUrl;
        } else {
            throw new Error('No checkout session URL received');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        cardErrors.textContent = error.message || 'An error occurred. Please try again.';
        submitButton.disabled = false;
        buttonText.textContent = 'Purchase Tickets';
        spinner.classList.add('hidden');
    }
}

// Close success modal
function closeSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (successModal) successModal.style.display = 'none';
    // Redirect to events page after closing success modal
    window.location.href = '/allevents';
}
