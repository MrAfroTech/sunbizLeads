async function msStartCheckout(priceId, buttonEl) {
  var btn = buttonEl;
  var label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Redirecting…';
  try {
    var res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: priceId }),
    });
    var data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok || !data.url) {
      throw new Error(data.message || 'Checkout could not start.');
    }
    window.location.href = data.url;
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Checkout failed.');
    btn.disabled = false;
    btn.textContent = label;
  }
}
