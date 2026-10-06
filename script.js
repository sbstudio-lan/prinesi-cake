/* ===== PRINESI CAKE — слой движения =====
 *
 * Правила, которым подчинён весь файл:
 *   1. Страница обязана быть читаемой без JS. Начальные состояния (opacity:0)
 *      живут под селектором `.js` и ставятся только когда скрипт жив.
 *   2. prefers-reduced-motion выключает всё — не «помягче», а полностью.
 *   3. Наклон карточек и магнитная кнопка — только для мыши. На тач-экранах
 *      они либо не работают, либо мешают.
 */

(function () {
  'use strict';

  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE_POINTER = matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  // Библиотек нет (офлайн, блокировщик, ошибка) — показываем всё как есть.
  if (typeof gsap === 'undefined' || REDUCED) {
    document.documentElement.classList.remove('js');
    var m = document.getElementById('marquee');
    if (m) m.style.overflowX = 'auto';   // лента остаётся листаемой руками
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = typeof SplitText !== 'undefined';
  if (hasSplit) gsap.registerPlugin(SplitText);

  /* ---------- Инерционный скролл ---------- */
  var lenis = null;
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    // Без этой связки ScrollTrigger считает позиции по нативному скроллу
    // и все триггеры срабатывают не там, где нужно.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // Якоря Lenis сам не перехватывает.
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2 || !document.querySelector(id)) return;
        e.preventDefault();
        lenis.scrollTo(id, { offset: -90 });
      });
    });
  }

  /* ---------- Появление хиро ---------- */
  function initHeroIntro() {
    var h1 = document.querySelector('.js-split');
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (h1 && hasSplit) {
      // Слова прячутся внутри строк с overflow:hidden — получается
      // «выезд из-под шторки», а не просто проявление.
      var split = new SplitText(h1, {
        type: 'lines,words', linesClass: 'line', wordsClass: 'word'
      });
      gsap.set(h1, { opacity: 1 });
      tl.from(split.words, {
        yPercent: 115, rotationX: -55, opacity: 0,
        duration: 0.9, stagger: 0.055, transformOrigin: '50% 100%'
      });
    } else if (h1) {
      tl.to(h1, { opacity: 1, y: 0, duration: 0.8 });
    }

    tl.fromTo('.hero-copy .js-intro',
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.09 }, '-=0.55');

    // Фото хиро: раскрываются шторкой и чуть «отъезжают» по масштабу
    tl.to('.shot-main', { opacity: 1, duration: 0.1 }, '-=0.8')
      .from('.shot-main', {
        clipPath: 'inset(0% 0% 100% 0%)', scale: 1.06,
        duration: 1.0, ease: 'power3.inOut'
      }, '<')
      .to('.shot-sub', { opacity: 1, duration: 0.1 }, '-=0.5')
      .from('.shot-sub', { x: 50, y: 18, scale: 0.94, duration: 0.8 }, '<');

    return tl;
  }

  /* ---------- Всё, что завязано на скролл ---------- */
  function initScrollFX() {
    // Полоса прогресса чтения
    gsap.to('#progress', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    });

    // Шапка прячется при движении вниз, возвращается при движении вверх
    var header = document.getElementById('header');
    ScrollTrigger.create({
      start: 'top -80',
      end: 99999,
      onUpdate: function (self) {
        header.classList.toggle('scrolled', self.scroll() > 8);
        header.classList.toggle('hidden', self.direction === 1 && self.scroll() > 400);
      }
    });

    // Параллакс в хиро — слои расходятся, сцена получает глубину.
    // Только на широких экранах: на мобильном фото лежат друг под другом
    // в одной колонке, и сдвиг по Y наезжает на соседний текст.
    gsap.matchMedia().add('(min-width: 1001px)', function () {
      gsap.to('.shot-main', {
        y: -60, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
      gsap.to('.shot-sub', {
        y: 40, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    });

    // Заголовки и подводки секций
    gsap.utils.toArray('.js-reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 0.75, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // Карточки меню — каскадом, с лёгким доворотом по X
    ScrollTrigger.batch('.js-card', {
      start: 'top 88%', once: true,
      onEnter: function (batch) {
        gsap.fromTo(batch,
          { opacity: 0, y: 48, rotationX: -8 },
          { opacity: 1, y: 0, rotationX: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
      }
    });

    // Чипы поводов
    ScrollTrigger.batch('.chips li', {
      start: 'top 92%', once: true,
      onEnter: function (batch) {
        gsap.fromTo(batch,
          { opacity: 0, scale: 0.9, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.04, ease: 'back.out(1.6)' });
      }
    });

    // Шаги: сначала прочерчивается линия, следом выскакивает кружок
    gsap.utils.toArray('.js-step').forEach(function (li, i) {
      var tl = gsap.timeline({
        scrollTrigger: { trigger: li, start: 'top 85%', once: true }
      });
      tl.to(li, { opacity: 1, duration: 0.01 })
        .fromTo(li, { '--draw': 0 }, { '--draw': 1, duration: 0.7, ease: 'power2.inOut' }, 0)
        .from(li.querySelector('.step-n'), {
          scale: 0, opacity: 0, duration: 0.55, ease: 'back.out(2)'
        }, 0.15)
        .from(li.querySelectorAll('h3, p'), {
          opacity: 0, y: 16, duration: 0.5, stagger: 0.08, ease: 'power2.out'
        }, 0.25);
    });
  }

  /* ---------- Счётчики в полосе доверия ---------- */
  function initCounters() {
    gsap.utils.toArray('.trust-item b[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var state = { v: 0 };
      gsap.to(state, {
        v: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: function () {
          // ru-RU ставит неразрывный пробел: 4 648, а не 4,648
          el.textContent = Math.round(state.v).toLocaleString('ru-RU') + suffix;
        }
      });
    });
  }

  /* ---------- 3D-наклон карточек за курсором ---------- */
  function initTilt() {
    if (!FINE_POINTER) return;
    document.querySelectorAll('.js-tilt').forEach(function (card) {
      var depth = parseFloat(card.dataset.depth || 1);
      var max = 9 * depth;
      var rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });

      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * max);
        rx(-py * max);
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  /* ---------- Магнитная кнопка ---------- */
  function initMagnetic() {
    if (!FINE_POINTER) return;
    document.querySelectorAll('.js-magnetic').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3' });
      var RADIUS = 110;

      window.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < RADIUS) { xTo(dx * 0.32); yTo(dy * 0.32); }
        else { xTo(0); yTo(0); }
      }, { passive: true });
    });
  }

  /* ---------- Бесконечная лента работ ---------- */
  function initMarquee() {
    var box = document.getElementById('marquee');
    if (!box) return;
    var track = box.querySelector('.marquee-track');
    var originals = Array.prototype.slice.call(track.children);
    if (!originals.length) return;

    // Дублируем набор: когда лента уезжает ровно на длину оригинала,
    // на его месте уже стоит копия — стык незаметен.
    originals.forEach(function (tile) {
      var copy = tile.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });

    var tween = null;
    function build() {
      if (tween) tween.kill();
      gsap.set(track, { x: 0 });
      var half = track.scrollWidth / 2;
      if (half < 10) return;
      tween = gsap.to(track, {
        x: -half,
        duration: half / 55,          // ~55 px/сек — читаемая, не суетливая скорость
        ease: 'none',
        repeat: -1
      });
    }

    // Ширину считаем только когда картинки реально загрузились.
    if (document.readyState === 'complete') build();
    else window.addEventListener('load', build);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    });

    var hovered = false;
    box.addEventListener('pointerenter', function () { hovered = true; if (tween) tween.pause(); });
    box.addEventListener('pointerleave', function () { hovered = false; if (tween) tween.resume(); });

    // За пределами экрана лента не крутится: это снимает постоянную работу
    // композитора и экономит батарею на телефоне.
    ScrollTrigger.create({
      trigger: box,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: function (self) {
        if (!tween) return;
        if (self.isActive && !hovered) tween.resume();
        else tween.pause();
      }
    });
  }

  /* ---------- Пуск ---------- */
  initLenis();
  initHeroIntro();
  initScrollFX();
  initCounters();
  initTilt();
  initMagnetic();
  initMarquee();

  // Шрифты меняют высоту текста — после их загрузки пересчитываем триггеры.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
