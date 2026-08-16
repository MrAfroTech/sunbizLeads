// Strike After Dark — standalone payment page

const API_BASE_URL = '/api';

function onTurnstileSuccess(token) {
  console.log('Turnstile token received');
  const hiddenInput = document.getElementById('cf-token');
  if (hiddenInput) hiddenInput.value = token;
}

const TICKET_PRICES = {
  ga: 20.0,
  lane: 35.0,
  vip: 85.0,
  vip_bottle: 450.0,
  all_access: 850.0,
  // legacy tier alias
  basic: 20.0,
  // Social Lounge (price sheet)
  lounge_all_access: 25.0,
  lounge_ga: 15.0,
  lounge_ga_arcade: 20.0
};

const TIER_LABELS = {
  ga: 'General Admission',
  lane: 'Lane Reserve',
  vip: 'VIP Lane Experience',
  vip_bottle: 'VIP Lane + Bottle',
  all_access: 'All-Access',
  basic: 'General Admission',
  lounge_all_access: 'All Access Pass',
  lounge_ga: 'General Admission (Social Lounge Only)',
  lounge_ga_arcade: 'General Admission + Arcade Play Pass'
};

let selectedTier = 'ga';
let selectedEventDate = '2026-06-04';
let selectedEventId = '';
let selectedEventIsTestMode = true;

document.addEventListener('DOMContentLoaded', () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);

    selectedEventDate = urlParams.get('eventDate') || '2026-06-04';
    selectedEventId = urlParams.get('eventId') || '';
    selectedTier = urlParams.get('tier') || 'ga';
    if (!TICKET_PRICES[selectedTier]) selectedTier = 'ga';
    // Per-event mode from URL (server still resolves from event config)
    selectedEventIsTestMode = urlParams.get('isTestMode') !== 'false';

    if (urlParams.has('email')) {
      const emailField = document.getElementById('customerEmail');
      if (emailField) emailField.value = urlParams.get('email');
    }

    if (urlParams.has('name') || urlParams.has('customerName')) {
      const nameField = document.getElementById('customerName');
      if (nameField) nameField.value = urlParams.get('name') || urlParams.get('customerName');
    }

    if (urlParams.has('phone') || urlParams.has('customerPhone')) {
      const phoneField = document.getElementById('customerPhone');
      if (phoneField) phoneField.value = urlParams.get('phone') || urlParams.get('customerPhone');
    }

    const ticketCountEl = document.getElementById('ticketCount');
    if (ticketCountEl && urlParams.has('ticketCount')) {
      ticketCountEl.value = urlParams.get('ticketCount');
    }

    const notice = document.getElementById('testModeNotice');
    if (notice) notice.style.display = selectedEventIsTestMode ? 'block' : 'none';

    if (selectedEventIsTestMode) {
      const turnstile = document.getElementById('turnstileWidget');
      if (turnstile) turnstile.style.display = 'none';
    }

    updateEventDateDisplay();
    updatePageTitle();
    setupForm();
    initializeEventListeners();
    updateTotal();
  } catch (error) {
    console.error('Failed to initialize payment page:', error);
  }
});

function formatEventDateForDisplay(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getEventNameFromDate() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('eventName') || 'Bosses & Bowling';
}

function getTierLabel() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('tierName') || TIER_LABELS[selectedTier] || selectedTier;
}

function updateEventDateDisplay() {
  if (!selectedEventDate) return;

  const eventDatePill = document.getElementById('eventDate');
  if (!eventDatePill) return;

  const eventDateSpan = eventDatePill.querySelector('span:last-child');
  const eventDateSmall = eventDatePill.nextElementSibling;
  const formattedDate = formatEventDateForDisplay(selectedEventDate);
  const eventName = getEventNameFromDate();
  const tierLabel = getTierLabel();

  if (eventDateSpan) {
    eventDateSpan.textContent = `${formattedDate} • 9:00 PM - 12:00 AM EST`;
  }

  if (eventDateSmall && eventDateSmall.tagName === 'SMALL') {
    eventDateSmall.textContent = `${eventName} · ${tierLabel} · The Alley`;
  }
}

function updatePageTitle() {
  const pageTitle = document.getElementById('pageTitle');
  const subtitle = document.getElementById('tierSubtitle');
  const tierLabel = getTierLabel();

  if (pageTitle) pageTitle.textContent = `Reserve ${tierLabel}`;
  if (subtitle) subtitle.textContent = `${getEventNameFromDate()} · The Alley`;
}

function setupForm() {
  const teamMemberGroup = document.getElementById('teamMemberGroup');
  const ticketCountLabel = document.getElementById('ticketCountLabel');
  const teamMemberName = document.getElementById('teamMemberName');
  const ticketCount = document.getElementById('ticketCount');
  const cardElementDiv = document.getElementById('cardElement');

  if (teamMemberGroup) teamMemberGroup.style.display = 'none';
  if (teamMemberName) teamMemberName.required = false;
  if (ticketCountLabel) ticketCountLabel.textContent = 'Quantity *';
  if (ticketCount) ticketCount.max = '10';
  if (cardElementDiv) cardElementDiv.style.display = 'none';
}

function initializeEventListeners() {
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) paymentForm.addEventListener('submit', handlePayment);

  const ticketCount = document.getElementById('ticketCount');
  if (ticketCount) {
    ticketCount.addEventListener('change', updateTotal);
    ticketCount.addEventListener('input', updateTotal);
  }
}

function updateTotal() {
  const ticketCountEl = document.getElementById('ticketCount');
  const ticketPriceEl = document.getElementById('ticketPrice');
  const ticketQuantityEl = document.getElementById('ticketQuantity');
  const totalAmountEl = document.getElementById('totalAmount');

  if (!ticketCountEl || !ticketPriceEl || !ticketQuantityEl || !totalAmountEl) return;

  const ticketCount = parseInt(ticketCountEl.value, 10) || 1;
  const price = TICKET_PRICES[selectedTier];
  if (!price) return;

  // Group packages (vip_bottle / all_access) are priced as a package unit
  const isPackage = selectedTier === 'vip_bottle' || selectedTier === 'all_access';
  const total = isPackage ? price * ticketCount : price * ticketCount;

  ticketPriceEl.textContent = `$${price.toFixed(2)}`;
  ticketQuantityEl.textContent = ticketCount;
  totalAmountEl.textContent = `$${total.toFixed(2)}`;
}

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

  submitButton.disabled = true;
  buttonText.textContent = 'Processing...';
  spinner.classList.remove('hidden');
  cardErrors.textContent = '';

  try {
    const customerName = document.getElementById('customerName')?.value || '';
    const customerEmail = document.getElementById('customerEmail')?.value || '';
    const customerPhone = document.getElementById('customerPhone')?.value || '';
    const eventDate = selectedEventDate || '2026-06-04';
    const eventName = getEventNameFromDate();
    const ticketCount = parseInt(document.getElementById('ticketCount')?.value, 10) || 1;
    const teamMemberName = document.getElementById('teamMemberName')?.value || null;

    if (!customerName || !customerEmail || !eventDate) {
      throw new Error('Please fill in all required fields');
    }

    let turnstileToken = '';
    if (!selectedEventIsTestMode) {
      turnstileToken =
        (document.getElementById('cf-token') && document.getElementById('cf-token').value) ||
        (typeof turnstile !== 'undefined' ? turnstile.getResponse() : '');
      if (!turnstileToken) {
        throw new Error('Please complete the security verification before continuing.');
      }
    }

    const paymentResponse = await fetch(`${API_BASE_URL}/stripe-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: selectedTier,
        eventId: selectedEventId || undefined,
        eventDate,
        eventName,
        customerEmail,
        customerName,
        customerPhone: customerPhone || undefined,
        ticketCount,
        teamMemberName: teamMemberName || undefined,
        cfTurnstileResponse: turnstileToken || undefined
      })
    });

    const paymentContentType = paymentResponse.headers.get('content-type') || '';
    let paymentData;
    if (!paymentContentType.includes('application/json')) {
      const rawText = await paymentResponse.text();
      throw new Error(
        `Payment service returned a non-JSON response (status ${paymentResponse.status}). ${rawText.slice(0, 140)}`
      );
    }

    paymentData = await paymentResponse.json();

    if (!paymentData.success) {
      throw new Error(paymentData.message || 'Payment initialization failed');
    }

    // Always redirect to Stripe Checkout (test keys in sandbox, live keys in production)
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
    if (typeof turnstile !== 'undefined') turnstile.reset();
  }
}

function closeSuccessModal() {
  const successModal = document.getElementById('successModal');
  if (successModal) successModal.style.display = 'none';
  window.location.href = '/tickets';
}
