document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('product-grid');
  if (!grid || typeof PRODUCTS === 'undefined') return;

  PRODUCTS.forEach((p) => {
    const art = document.createElement('article');
    art.className = 'product-card';
    art.innerHTML = [
      '<div class="placeholder-block"></div>',
      '<p class="collection-tag"></p>',
      '<h3></h3>',
      '<p class="starting-price"></p>',
      '<a class="btn btn-outline" href=""></a>',
    ].join('');
    art.querySelector('.placeholder-block').textContent = p.imageLabel;
    art.querySelector('.collection-tag').textContent = p.collection;
    art.querySelector('h3').textContent = p.name;
    art.querySelector('.starting-price').textContent = `Starting at ${p.startingPrice}`;
    const cta = art.querySelector('a');
    cta.textContent = p.cta;
    cta.href = `/products#${p.slug}`;
    grid.appendChild(art);
  });
});
