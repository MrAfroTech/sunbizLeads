(function () {
  /** Venue hub card order (matches prompt). */
  var CARD_ORDER = [
    'seatflow',
    'crowdflow',
    'tabflow',
    'counterflow',
    'mobileserve',
    'districtflow',
    'scanband',
  ];

  var CARD_HREF = {
    seatflow: '/products/stadiums',
    crowdflow: '/products/festivals',
    tabflow: '/products/bars',
    counterflow: '/products/qsr',
    mobileserve: '/products/food-trucks',
    districtflow: '/products/districts',
    scanband: '/products/wristbands',
  };

  /** One image per card from `public/`. */
  var CARD_IMAGE = {
    seatflow: '/stadium.jpg',
    crowdflow: '/crowdflow.jpg',
    tabflow: '/bar.jpg',
    counterflow: '/qsr.jpg',
    districtflow: '/microdownton.jpg',
    mobileserve: '/foodtruck.jpg',
    scanband: '/scanablewritband.jpg',
  };

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('products-root');
    if (!root || typeof PRODUCTS === 'undefined') return;

    var bySlug = {};
    PRODUCTS.forEach(function (p) {
      bySlug[p.slug] = p;
    });

    CARD_ORDER.forEach(function (slug) {
      var p = bySlug[slug];
      if (!p) return;

      var a = document.createElement('a');
      a.className = 'product-venue-card';
      a.href = CARD_HREF[slug];
      a.setAttribute('data-sns-track', 'venue-card-' + slug);
      a.setAttribute(
        'aria-label',
        p.name + '. Starting at ' + p.startingPrice + '. ' + p.cta
      );

      var photo = document.createElement('div');
      photo.className = 'product-venue-card__photo';
      var img = document.createElement('img');
      img.src = CARD_IMAGE[slug];
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      photo.appendChild(img);

      var body = document.createElement('div');
      body.className = 'product-venue-card__body';

      var coll = document.createElement('p');
      coll.className = 'product-venue-card__collection';
      coll.textContent = p.collection;

      var title = document.createElement('h2');
      title.className = 'product-venue-card__name';
      title.textContent = p.name;

      var price = document.createElement('p');
      price.className = 'product-venue-card__price';
      price.textContent = 'Starting at ' + p.startingPrice;

      var cta = document.createElement('span');
      cta.className = 'btn btn-primary product-venue-card__cta';
      cta.textContent = p.cta;

      body.appendChild(coll);
      body.appendChild(title);
      body.appendChild(price);
      body.appendChild(cta);

      a.appendChild(photo);
      a.appendChild(body);
      root.appendChild(a);
    });
  });
})();
