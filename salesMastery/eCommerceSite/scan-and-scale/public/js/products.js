(function () {
  var STORAGE_KEY = 'sns_products_nudge_shown';
  var DELAY_MS = 30000;

  var NUDGE_HTML =
    '<div id="products-nudge" style="display:none; background:#1A2A44; border-left:4px solid #D4AF37; padding:16px 24px; margin-bottom:24px; border-radius:4px;">' +
    '<p style="font-family:\'Bebas Neue\',sans-serif; font-size:18px; color:#D4AF37; letter-spacing:1px; margin-bottom:6px;">Not Sure Which Kit Is Right for You?</p>' +
    '<p style="font-size:13px; color:rgba(255,255,255,0.8); margin-bottom:12px;">The QR Revenue Audit tells you exactly which product fits your venue — in 3 minutes.</p>' +
    '<a href="/audit" style="font-family:\'Bebas Neue\',sans-serif; font-size:15px; letter-spacing:1.5px; background:#D4AF37; color:#1A2A44; padding:10px 20px; border-radius:3px; text-decoration:none;">Start My Audit — $17</a>' +
    '</div>';

  function isProductsPage() {
    var path = window.location.pathname;
    return path === '/products' || path === '/products/' || path === '/products.html';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!isProductsPage()) return;

    var ctaClicked = false;

    document.addEventListener(
      'click',
      function (e) {
        if (e.target.closest('.product-cta')) {
          ctaClicked = true;
        }
      },
      true
    );

    setTimeout(function () {
      if (ctaClicked) return;
      if (sessionStorage.getItem(STORAGE_KEY)) return;

      var main = document.querySelector('main.page-products-main') || document.querySelector('main');
      if (!main) return;

      var wrapper = document.createElement('div');
      wrapper.innerHTML = NUDGE_HTML;
      var nudge = wrapper.firstElementChild;
      if (!nudge) return;

      main.insertBefore(nudge, main.firstChild);
      nudge.style.display = 'block';
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }, DELAY_MS);
  });
})();
