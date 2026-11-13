(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- màn mở đầu (chỉ trang chủ, mỗi phiên một lần) ---------- */
  var opener = document.querySelector('.opener');
  function ready() { document.body.classList.add('ready'); }
  if (opener) {
    var done = false;
    var finish = function () {
      if (done) return; done = true;
      opener.classList.add('gone');
      store.set('opener-seen', '1');
      setTimeout(ready, 250);
    };
    if (reduce || store.get('opener-seen')) {
      opener.classList.add('gone');
      ready();
    } else {
      document.documentElement.style.overflow = 'hidden';
      var release = function () { document.documentElement.style.overflow = ''; };
      var t = setTimeout(function () { finish(); release(); }, 3000);
      var skip = opener.querySelector('.skip');
      if (skip) {
        skip.addEventListener('click', function () { clearTimeout(t); finish(); release(); });
        skip.focus({ preventScroll: true });
      }
    }
  } else {
    ready();
  }

  /* ---------- xuất hiện khi cuộn ---------- */
  var items = document.querySelectorAll('[data-reveal], .rise:not(.hero .rise), .draw-line');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- dải ruy băng khi chuyển trang ---------- */
  var wipe = document.createElement('div');
  wipe.className = 'wipe';
  wipe.setAttribute('aria-hidden', 'true');
  wipe.innerHTML = '<i></i><i></i><i></i>';
  document.body.appendChild(wipe);
  if (!reduce && store.get('wipe') === '1') {
    store.set('wipe', '0');
    wipe.classList.add('enter');
    setTimeout(function () { wipe.classList.remove('enter'); }, 1000);
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || reduce) return;
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    if (a.target && a.target !== '_self') return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return;
    ev.preventDefault();
    store.set('wipe', '1');
    wipe.classList.add('cover');
    setTimeout(function () { location.href = url.href; }, 560);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) wipe.classList.remove('cover'); });

  /* ---------- xem ảnh lớn ---------- */
  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.innerHTML = '<button class="close" type="button" aria-label="Đóng ảnh">×</button><img alt=""><p></p>';
  document.body.appendChild(dlg);
  var dImg = dlg.querySelector('img'), dCap = dlg.querySelector('p');
  dlg.querySelector('.close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  document.querySelectorAll('img.zoom').forEach(function (im) {
    im.setAttribute('tabindex', '0');
    im.setAttribute('role', 'button');
    var open = function () {
      dImg.src = im.currentSrc || im.src;
      dImg.alt = im.alt;
      dCap.textContent = im.alt;
      if (dlg.showModal) dlg.showModal();
    };
    im.addEventListener('click', open);
    im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  /* ---------- bầu trời sao sau kính viễn vọng ---------- */
  document.querySelectorAll('.scope canvas').forEach(function (cv) {
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    var stars = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = false;
    function size() {
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.round(w * h / 1800);
      for (var i = 0; i < n; i++) {
        // dồn sao về một dải chéo cho giống dải Ngân Hà
        var u = Math.random(), band = (Math.random() - 0.5) * (Math.random() < 0.6 ? 0.35 : 1.2);
        stars.push({ x: u * w, y: (0.75 - u * 0.5 + band) * h, r: Math.random() * 1.4 + 0.2, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.6 });
      }
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createLinearGradient(0, h, w, 0);
      g.addColorStop(0, 'rgba(157,189,234,0)');
      g.addColorStop(0.5, 'rgba(157,189,234,0.10)');
      g.addColorStop(1, 'rgba(157,189,234,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = reduce ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(s.p + t / 1000 * s.s));
        ctx.globalAlpha = a;
        ctx.fillStyle = i % 9 === 0 ? '#F6C52E' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running && !reduce) requestAnimationFrame(draw);
    }
    size();
    window.addEventListener('resize', function () { size(); if (!running) draw(0); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var was = running; running = e.isIntersecting;
          if (running && !was) requestAnimationFrame(draw);
        });
      }).observe(cv);
    }
    draw(0);
  });

  /* ---------- trang giấy rơi (không gian Tri thức) ---------- */
  document.querySelectorAll('.petals').forEach(function (box) {
    if (reduce) return;
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.setProperty('--t', (9 + Math.random() * 9) + 's');
      p.style.setProperty('--d', (-Math.random() * 15) + 's');
      p.style.setProperty('--x', ((Math.random() - 0.3) * 160) + 'px');
      p.style.transform = 'scale(' + (0.6 + Math.random() * 0.7) + ')';
      box.appendChild(p);
    }
  });
})();
