(function () {
  var SLIDES = ['/mdt1.jpeg', '/md2.jpeg', '/md3.jpeg', '/md4.jpeg', '/md5.jpeg'];
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

  function init(wrap) {
    if (!wrap || !SLIDES.length) return;

    var a = document.createElement('div');
    var b = document.createElement('div');
    a.className = 'ms-hero-bg__layer';
    b.className = 'ms-hero-bg__layer';
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
      var i = (fromExclusive + 1 + SLIDES.length) % SLIDES.length;
      preloadBackground(SLIDES[i]).then(function (ok) {
        if (ok) cb(i);
        else preloadChain(i, triesLeft - 1, cb);
      });
    }

    function swapTo(nextIdx) {
      bg(hidden, SLIDES[nextIdx]);
      hidden.classList.add('is-visible');
      visible.classList.remove('is-visible');
      var tmp = visible;
      visible = hidden;
      hidden = tmp;
      idx = nextIdx;
    }

    preloadChain(-1, SLIDES.length, function (firstIdx) {
      if (firstIdx === null) return;
      idx = firstIdx;
      bg(visible, SLIDES[idx]);
      visible.classList.add('is-visible');

      setInterval(function () {
        preloadChain(idx, SLIDES.length, function (nextIdx) {
          if (nextIdx !== null) swapTo(nextIdx);
        });
      }, ROTATE_MS);
    });
  }

  function boot() {
    var wrap = document.querySelector('.ms-hero-bg__slides');
    init(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
