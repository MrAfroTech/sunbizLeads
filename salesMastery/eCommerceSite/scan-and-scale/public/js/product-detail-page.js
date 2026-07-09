(function () {
  /** Subpage H1 only (card grid keeps catalog `name`). */
  var DETAIL_PAGE_TITLES = {
    districtflow: 'DistrictFlow™ for Districts',
  };

  var SCANBAND_ADDON_BODY =
    'Give every attendee a personal ordering access point. ScanBands™ work alongside any Scan & Scale deployment.';

  document.addEventListener('DOMContentLoaded', function () {
    var slug = document.body.getAttribute('data-product-slug');
    var root = document.getElementById('product-detail-root');
    var addonRoot = document.getElementById('scanband-addon-root');

    if (!slug || !root || typeof PRODUCTS === 'undefined') return;

    var p = PRODUCTS.filter(function (x) {
      return x.slug === slug;
    })[0];
    if (!p) return;

    var displayName = DETAIL_PAGE_TITLES[slug] || p.name;

    var coll = document.createElement('p');
    coll.className = 'product-detail-collection';
    coll.textContent = p.collection;

    var h1 = document.createElement('h1');
    h1.className = 'product-detail-title';
    h1.textContent = displayName;

    var photo = document.createElement('div');
    photo.className = 'product-detail-photo placeholder-block';
    photo.textContent = p.imageLabel;

    var desc = document.createElement('p');
    desc.className = 'product-detail-desc';
    desc.textContent = p.description;

    var ul = document.createElement('ul');
    ul.className = 'product-detail-includes';
    p.includes.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });

    var tiersHead = document.createElement('h2');
    tiersHead.className = 'product-detail-tiers-head';
    tiersHead.textContent = 'Pricing';

    var tiersWrap = document.createElement('div');
    tiersWrap.className = 'product-detail-tiers';
    tiersWrap.setAttribute('aria-label', 'Pricing tiers');

    p.tiers.forEach(function (tier) {
      var row = document.createElement('div');
      row.className = 'tier-row';

      var nameCol = document.createElement('div');
      nameCol.className = 'tier-name';
      nameCol.textContent = tier.label;

      var priceCol = document.createElement('div');
      priceCol.className = 'tier-price';
      priceCol.textContent = tier.priceLabel;

      var actions = document.createElement('div');
      actions.className = 'tier-actions';

      if (tier.kind === 'stripe' && tier.stripePriceKey) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-primary';
        btn.textContent = p.cta;
        btn.setAttribute('data-sns-track', 'tier_checkout_' + slug + '_' + tier.stripePriceKey);
        btn.addEventListener('click', function () {
          startCheckout(tier.stripePriceKey, btn);
        });
        actions.appendChild(btn);
      } else {
        var a = document.createElement('a');
        a.className = 'btn btn-outline';
        a.href = '/#get-started';
        a.textContent = 'Get Started';
        a.setAttribute('data-sns-track', 'tier_get_started_' + slug);
        actions.appendChild(a);
      }

      row.appendChild(nameCol);
      row.appendChild(priceCol);
      row.appendChild(actions);
      tiersWrap.appendChild(row);
    });

    root.appendChild(coll);
    root.appendChild(h1);
    root.appendChild(photo);
    root.appendChild(desc);
    root.appendChild(ul);
    root.appendChild(tiersHead);
    root.appendChild(tiersWrap);

    if (addonRoot && slug !== 'scanband') {
      var sb = PRODUCTS.filter(function (x) {
        return x.slug === 'scanband';
      })[0];
      if (sb) {
        var section = document.createElement('section');
        section.className = 'scanband-addon-section';
        section.setAttribute('aria-labelledby', 'scanband-addon-label');

        var h2 = document.createElement('h2');
        h2.className = 'scanband-addon-heading';
        h2.id = 'scanband-addon-label';
        h2.textContent = 'Add ScanBand™ to Your Deployment';

        var card = document.createElement('a');
        card.className = 'scanband-addon-card';
        card.href = '/products/wristbands';
        card.setAttribute('data-sns-track', 'scanband_addon_card_' + slug);
        card.setAttribute(
          'aria-label',
          'ScanBand for Events. Starting at ' +
            sb.startingPrice +
            '. ' +
            sb.cta
        );

        var ph = document.createElement('div');
        ph.className = 'placeholder-block';
        ph.textContent = 'Wristband Scan';

        var sd = document.createElement('p');
        sd.className = 'scanband-addon-desc';
        sd.textContent = SCANBAND_ADDON_BODY;

        var pr = document.createElement('p');
        pr.className = 'scanband-addon-price';
        pr.textContent = 'Starting at ' + sb.startingPrice;

        var cta = document.createElement('span');
        cta.className = 'btn btn-primary';
        cta.textContent = sb.cta;

        card.appendChild(ph);
        card.appendChild(sd);
        card.appendChild(pr);
        card.appendChild(cta);

        section.appendChild(h2);
        section.appendChild(card);
        addonRoot.appendChild(section);
      }
    }
  });
})();
