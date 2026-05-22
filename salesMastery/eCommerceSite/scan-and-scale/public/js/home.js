(function () {
  const MANIFEST_URL = '/media/pexels/manifest.json';
  const ROTATE_MS = 4500;

  async function loadManifest() {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error('manifest');
    return res.json();
  }

  /** Wait until the browser has loaded (and optionally decoded) an image URL. */
  function preloadBackground(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      function done(ok) {
        resolve(ok);
      }
      img.onload = function () {
        if (img.decode) {
          img.decode().then(function () { done(true); }).catch(function () { done(true); });
        } else {
          done(true);
        }
      };
      img.onerror = function () {
        done(false);
      };
      img.src = url;
    });
  }

  function initHero(urls) {
    var wraps = document.querySelectorAll('.home-hero__slides');
    if (!wraps.length || !urls || urls.length === 0) return;

    wraps.forEach(function (wrap) {
      wrap.innerHTML = '';
      var a = document.createElement('div');
      var b = document.createElement('div');
      a.className = 'home-hero__layer';
      b.className = 'home-hero__layer';
      wrap.appendChild(a);
      wrap.appendChild(b);

      var idx = 0;
      var visible = a;
      var hidden = b;

      function bg(el, url) {
        el.style.backgroundImage = 'url("' + url + '")';
      }

      function preloadChain(fromExclusive, triesLeft, cb) {
        if (triesLeft <= 0) {
          cb(null);
          return;
        }
        var i = (fromExclusive + 1 + urls.length) % urls.length;
        preloadBackground(urls[i]).then(function (ok) {
          if (ok) cb(i);
          else preloadChain(i, triesLeft - 1, cb);
        });
      }

      function swapTo(nextIdx) {
        bg(hidden, urls[nextIdx]);
        hidden.classList.add('is-visible');
        visible.classList.remove('is-visible');
        var tmp = visible;
        visible = hidden;
        hidden = tmp;
        idx = nextIdx;
      }

      preloadChain(-1, urls.length, function (firstIdx) {
        if (firstIdx === null) return;
        idx = firstIdx;
        bg(visible, urls[idx]);
        visible.classList.add('is-visible');
        hidden.classList.remove('is-visible');
        if (urls.length > 1) {
          preloadChain(idx, urls.length, function (secondIdx) {
            if (secondIdx !== null) bg(hidden, urls[secondIdx]);
            else bg(hidden, urls[idx]);
          });
        }
      });

      if (urls.length < 2) return;

      window.setInterval(function () {
        preloadChain(idx, urls.length, function (nextIdx) {
          if (nextIdx !== null) swapTo(nextIdx);
        });
      }, ROTATE_MS);
    });
  }

  function initTrustedMarquee() {
    var bar = document.getElementById('home-trusted');
    if (!bar) return;

    var images = bar.querySelectorAll('.home-trusted__logo');

    function hideLogo(img) {
      img.hidden = true;
    }

    function onLogoError(img) {
      console.warn('[home-trusted] Logo failed to load:', img.src);
      hideLogo(img);
    }

    function onLogoLoad(img) {
      if (img.naturalWidth > 0) {
        img.dataset.logoOk = '1';
      } else {
        onLogoError(img);
      }
    }

    images.forEach(function (img) {
      var settled = false;

      function settle(ok) {
        if (settled) return;
        settled = true;
        if (ok) onLogoLoad(img);
        else onLogoError(img);
      }

      img.addEventListener('error', function () {
        settle(false);
      });
      img.addEventListener('load', function () {
        settle(img.naturalWidth > 0);
      });

      if (img.complete) settle(img.naturalWidth > 0);
    });
  }

  function initBenefitReveal() {
    var cards = document.querySelectorAll('[data-benefit-reveal]');
    if (!cards.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach(function (card) {
        card.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var card = entry.target;
          var index = Array.prototype.indexOf.call(cards, card);
          card.style.transitionDelay = Math.min(index * 0.08, 0.48) + 's';
          card.classList.add('is-visible');
          observer.unobserve(card);
        });
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    cards.forEach(function (card) {
      observer.observe(card);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTrustedMarquee();
    initBenefitReveal();

    loadManifest()
      .then(function (data) {
        initHero(data.heroSlides || []);
      })
      .catch(function () {
        document.querySelector('.home-hero')?.classList.add('home-hero--fallback');
      });
  });
})();
