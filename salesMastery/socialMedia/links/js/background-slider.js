(function () {
  var MANIFEST_URL = '/links/assets/backgrounds/slides.json';
  var FALLBACK_SLIDES = [
    '/links/assets/backgrounds/mdt1.jpeg',
    '/links/assets/backgrounds/md2.jpeg',
    '/links/assets/backgrounds/md3.jpeg',
    '/links/assets/backgrounds/md4.jpeg',
    '/links/assets/backgrounds/md5.jpeg',
  ];
  var ROTATE_MS = 4500;

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

  function init(wrap, slides) {
    if (!wrap || !slides || !slides.length) return;

    var a = document.createElement('div');
    var b = document.createElement('div');
    a.className = 'links-bg__layer';
    b.className = 'links-bg__layer';
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
      var i = (fromExclusive + 1 + slides.length) % slides.length;
      preloadBackground(slides[i]).then(function (ok) {
        if (ok) cb(i);
        else preloadChain(i, triesLeft - 1, cb);
      });
    }

    function swapTo(nextIdx) {
      bg(hidden, slides[nextIdx]);
      hidden.classList.add('is-visible');
      visible.classList.remove('is-visible');
      var tmp = visible;
      visible = hidden;
      hidden = tmp;
      idx = nextIdx;
    }

    preloadChain(-1, slides.length, function (firstIdx) {
      if (firstIdx === null) return;
      idx = firstIdx;
      bg(visible, slides[idx]);
      visible.classList.add('is-visible');

      setInterval(function () {
        preloadChain(idx, slides.length, function (nextIdx) {
          if (nextIdx !== null) swapTo(nextIdx);
        });
      }, ROTATE_MS);
    });
  }

  function boot() {
    var wrap = document.querySelector('.links-bg__slides');
    if (!wrap) return;

    fetch(MANIFEST_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('manifest');
        return res.json();
      })
      .then(function (data) {
        var slides = data && data.slides && data.slides.length ? data.slides : FALLBACK_SLIDES;
        init(wrap, slides);
      })
      .catch(function () {
        init(wrap, FALLBACK_SLIDES);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
