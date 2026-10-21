/**
 * Fullscreen image gallery for drupal.org.
 *
 * Images in the page content, and links that point straight at an image file
 * (such as the attachments table of an issue), open in a viewer with arrows,
 * the image's alt text, thumbnails, keyboard and swipe navigation, and a 1:1
 * zoom. The gallery is every such image on the page, in document order, with
 * duplicates of the same file merged.
 */
(() => {
  'use strict';

  const HOST_TAG = 'dod-lightbox';
  const IMAGE_FILE = /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i;
  const EXCLUDE = [
    HOST_TAG, '#header', '#nav-header', '#footer', '#skip-link', 'nav', '[role="navigation"]',
    'button', '.user-picture', '.picture', '.drupalorg-copy-container',
  ].join(',');
  const MIN_SIZE = 64;

  const ICONS = {
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    prev: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    zoomIn: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    zoomOut: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3M8 11h6"/>',
    open: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  };

  const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const STYLES = `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; }
    [hidden] { display: none !important; }

    .lb {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      color: #f4f4f5;
      font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      opacity: 0;
      transition: opacity .2s ease;
    }
    .lb[data-open] { opacity: 1; }

    .backdrop {
      position: absolute;
      inset: 0;
      background: rgb(10 12 16 / .74);
      -webkit-backdrop-filter: blur(18px) saturate(1.2);
      backdrop-filter: blur(18px) saturate(1.2);
    }

    .bar {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
    }
    .counter {
      padding-inline: 4px;
      color: rgb(255 255 255 / .72);
      font-variant-numeric: tabular-nums;
      letter-spacing: .02em;
    }
    .actions { display: flex; gap: 6px; }

    .btn, .nav {
      display: inline-grid;
      place-items: center;
      padding: 0;
      border: 1px solid rgb(255 255 255 / .12);
      border-radius: 999px;
      background: rgb(255 255 255 / .08);
      color: inherit;
      cursor: pointer;
      transition: background-color .15s ease, transform .15s ease, opacity .15s ease;
    }
    .btn { width: 40px; height: 40px; }
    .btn svg { width: 20px; height: 20px; }
    .btn:hover, .nav:hover { background: rgb(255 255 255 / .18); }
    .btn:active, .nav:active { transform: scale(.94); }
    .btn:disabled { opacity: .35; cursor: default; background: rgb(255 255 255 / .08); transform: none; }
    .btn:focus-visible, .nav:focus-visible, .thumb:focus-visible {
      outline: 2px solid #8ec5ff;
      outline-offset: 2px;
    }

    .stage { position: relative; min-height: 0; }
    .viewport {
      position: absolute;
      inset: 4px 76px;
      display: flex;
      overflow: hidden;
      touch-action: none;
      scrollbar-width: none;
    }
    .viewport::-webkit-scrollbar { display: none; }
    .image {
      display: block;
      max-width: 100%;
      max-height: 100%;
      margin: auto;
      border-radius: 6px;
      box-shadow: 0 24px 70px rgb(0 0 0 / .45), 0 0 0 1px rgb(255 255 255 / .06);
      background: rgb(255 255 255 / .04);
      opacity: 0;
      transform: scale(.985);
      transition: opacity .22s ease, transform .22s ease;
      user-select: none;
      -webkit-user-drag: none;
    }
    .image.ready { opacity: 1; transform: none; }
    .lb[data-zoomable] .image { cursor: zoom-in; }
    .lb[data-zoomed] .viewport { overflow: auto; cursor: grab; }
    .lb[data-zoomed][data-dragging] .viewport { cursor: grabbing; }
    .lb[data-zoomed] .image {
      max-width: none;
      max-height: none;
      border-radius: 0;
      cursor: inherit;
      transition: none;
    }

    .spinner {
      position: absolute;
      inset: 50% auto auto 50%;
      width: 32px;
      height: 32px;
      margin: -16px 0 0 -16px;
      border: 3px solid rgb(255 255 255 / .2);
      border-top-color: #fff;
      border-radius: 50%;
      opacity: 0;
      transition: opacity .2s ease .15s;
      animation: spin .8s linear infinite;
      pointer-events: none;
    }
    .lb[data-loading] .spinner { opacity: 1; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .nav {
      position: absolute;
      top: 50%;
      width: 48px;
      height: 48px;
      margin-top: -24px;
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
    }
    .nav svg { width: 24px; height: 24px; }
    .prev { left: 16px; }
    .next { right: 16px; }
    .lb[data-zoomed] .nav { opacity: 0; pointer-events: none; }

    .foot {
      position: relative;
      display: grid;
      gap: 12px;
      padding: 12px 16px 16px;
    }
    .caption {
      max-width: 72ch;
      min-height: 1.5em;
      margin: 0 auto;
      color: rgb(255 255 255 / .92);
      font-size: 15px;
      text-align: center;
      text-wrap: pretty;
      overflow-wrap: anywhere;
    }
    .caption.filename { color: rgb(255 255 255 / .6); font-size: 13px; }

    .thumbs {
      display: flex;
      gap: 8px;
      justify-content: safe center;
      overflow-x: auto;
      padding: 4px;
      scrollbar-width: thin;
      scrollbar-color: rgb(255 255 255 / .25) transparent;
    }
    .thumb {
      flex: none;
      width: 64px;
      height: 48px;
      padding: 0;
      border: 0;
      border-radius: 6px;
      overflow: hidden;
      background: rgb(255 255 255 / .06);
      opacity: .5;
      cursor: pointer;
      transition: opacity .15s ease, box-shadow .15s ease;
    }
    .thumb:hover { opacity: .85; }
    .thumb[aria-current="true"] { opacity: 1; box-shadow: 0 0 0 2px #fff; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @media (max-width: 640px) {
      .viewport { inset: 0; }
      .nav { width: 40px; height: 40px; margin-top: -20px; background: rgb(0 0 0 / .35); }
      .prev { left: 8px; }
      .next { right: 8px; }
      .thumbs { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .lb, .image, .btn, .nav, .thumb, .spinner { transition: none; }
      .image { transform: none; }
    }
  `;

  let enabled = true;
  let ui = null;
  let items = [];
  let index = 0;
  let zoomed = false;
  let drag = null;
  let loadToken = 0;
  let returnFocus = null;
  let savedScroll = null;
  let closeTimer = 0;

  chrome.storage.sync.get({ lightbox: true }, (s) => { enabled = s.lightbox; });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.lightbox) enabled = changes.lightbox.newValue;
  });

  function toUrl(href) {
    try {
      return new URL(href, location.href);
    } catch {
      return null;
    }
  }

  function isImageUrl(href) {
    const url = toUrl(href);
    return !!url && /^https?:$/.test(url.protocol) && IMAGE_FILE.test(url.pathname);
  }

  function keyOf(src) {
    const url = toUrl(src);
    return url ? url.origin + url.pathname : src;
  }

  function originalOf(src) {
    const url = toUrl(src);
    const m = url && url.pathname.match(/^(.*\/files)\/styles\/[^/]+\/(?:public|private)\/(.+)$/);
    if (!m) return src;
    url.pathname = `${m[1]}/${m[2]}`;
    url.search = '';
    return url.href;
  }

  function fileName(src) {
    const url = toUrl(src);
    return url ? decodeURIComponent(url.pathname.split('/').pop()) : src;
  }

  function contentRoot() {
    return document.querySelector('#page, main, [role="main"]') || document.body;
  }

  function imageItem(img) {
    if (img.closest(EXCLUDE)) return null;
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith('data:') || src.includes('/user-pictures/')) return null;

    const link = img.closest('a[href]');
    if (link) {
      if (!isImageUrl(link.href)) return null;
      return { src: link.href, thumb: src, fallback: src, alt: img.alt.trim(), el: img };
    }
    if (/\.svg(\?|$)/i.test(src)) return null;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (img.complete && w < MIN_SIZE && h < MIN_SIZE) return null;
    return { src: originalOf(src), thumb: src, fallback: src, alt: img.alt.trim(), el: img };
  }

  function linkItem(a) {
    if (a.closest(EXCLUDE) || a.querySelector('img') || !isImageUrl(a.href)) return null;
    return { src: a.href, thumb: a.href, fallback: a.href, alt: (a.title || '').trim(), el: a };
  }

  const itemOf = (el) => (el.tagName === 'IMG' ? imageItem(el) : linkItem(el));

  function collect() {
    const list = [];
    const byKey = new Map();
    for (const el of contentRoot().querySelectorAll('img, a[href]')) {
      const item = itemOf(el);
      if (!item) continue;
      const key = keyOf(item.src);
      const seen = byKey.get(key);
      if (seen) {
        seen.els.push(el);
        if (!seen.alt && item.alt) seen.alt = item.alt;
        if (seen.thumb === seen.src && item.thumb !== item.src) seen.thumb = item.thumb;
        continue;
      }
      item.els = [el];
      byKey.set(key, item);
      list.push(item);
    }
    return list;
  }

  function targetOf(node) {
    const el = node instanceof Element ? node.closest('img, a[href]') : null;
    if (!el) return null;
    if (el.tagName === 'A') return el.querySelector('img') || el;
    return el;
  }

  document.addEventListener('click', (e) => {
    if (!enabled || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = targetOf(e.target);
    if (!target || !itemOf(target)) return;
    const list = collect();
    const i = list.findIndex((item) => item.els.includes(target));
    if (i < 0) return;
    e.preventDefault();
    e.stopPropagation();
    open(list, i, target);
  }, true);

  document.addEventListener('pointerover', (e) => {
    if (!enabled) return;
    const target = targetOf(e.target);
    if (!target || target.dataset.dodZoom) return;
    if (itemOf(target)) {
      target.dataset.dodZoom = '';
      target.style.cursor = 'zoom-in';
    }
  }, { passive: true });

  function build() {
    const host = document.createElement(HOST_TAG);
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>${STYLES}</style>
      <div class="lb" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>
        <div class="backdrop"></div>
        <div class="bar">
          <span class="counter"></span>
          <div class="actions">
            <button type="button" class="btn zoom" aria-pressed="false">${svg('zoomIn')}</button>
            <a class="btn open" target="_blank" rel="noopener" aria-label="Open original in a new tab"
              title="Open original">${svg('open')}</a>
            <button type="button" class="btn close" aria-label="Close" title="Close (Esc)">${svg('close')}</button>
          </div>
        </div>
        <div class="stage">
          <div class="viewport"><img class="image" alt="" draggable="false"></div>
          <div class="spinner"></div>
        </div>
        <button type="button" class="nav prev" aria-label="Previous image" title="Previous (←)">${svg('prev')}</button>
        <button type="button" class="nav next" aria-label="Next image" title="Next (→)">${svg('next')}</button>
        <div class="foot">
          <p class="caption"></p>
          <div class="thumbs"></div>
        </div>
        <div class="sr" aria-live="polite"></div>
      </div>`;
    document.documentElement.appendChild(host);

    const $ = (selector) => root.querySelector(selector);
    const refs = {
      host,
      root,
      lb: $('.lb'),
      backdrop: $('.backdrop'),
      counter: $('.counter'),
      zoom: $('.zoom'),
      open: $('.open'),
      close: $('.close'),
      stage: $('.stage'),
      viewport: $('.viewport'),
      image: $('.image'),
      prev: $('.prev'),
      next: $('.next'),
      foot: $('.foot'),
      bar: $('.bar'),
      caption: $('.caption'),
      thumbs: $('.thumbs'),
      live: $('.sr'),
    };

    refs.close.addEventListener('click', close);
    refs.prev.addEventListener('click', () => show(index - 1));
    refs.next.addEventListener('click', () => show(index + 1));
    refs.zoom.addEventListener('click', () => setZoom(!zoomed));
    refs.lb.addEventListener('click', (e) => {
      if (e.target === refs.backdrop || e.target === refs.bar || e.target === refs.foot) close();
    });
    refs.thumbs.addEventListener('click', (e) => {
      const thumb = e.target.closest('.thumb');
      if (thumb) show(+thumb.dataset.index);
    });

    const { viewport, image } = refs;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = {
        x: e.clientX,
        y: e.clientY,
        left: viewport.scrollLeft,
        top: viewport.scrollTop,
        moved: false,
      };
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 6) {
        drag.moved = true;
        refs.lb.toggleAttribute('data-dragging', true);
      }
      if (zoomed && drag.moved) {
        viewport.scrollLeft = drag.left - dx;
        viewport.scrollTop = drag.top - dy;
      }
    });
    viewport.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      refs.lb.removeAttribute('data-dragging');
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      const onImage = hitsImage(e.clientX, e.clientY);
      if (zoomed) {
        if (!d.moved) setZoom(false);
        return;
      }
      if (d.moved) {
        if (items.length > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
        return;
      }
      if (onImage) setZoom(true, { x: e.clientX, y: e.clientY });
      else close();
    });
    viewport.addEventListener('pointercancel', () => {
      drag = null;
      refs.lb.removeAttribute('data-dragging');
    });
    viewport.addEventListener('wheel', (e) => {
      if (!zoomed && items.length > 1 && Math.abs(e.deltaX) > 40 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        show(index + (e.deltaX > 0 ? 1 : -1));
      }
    }, { passive: false });

    function hitsImage(x, y) {
      const r = image.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    window.addEventListener('resize', () => {
      if (ui && !ui.lb.hidden) updateZoomable();
    });

    return refs;
  }

  function canZoom() {
    const { image } = ui;
    return image.naturalWidth > image.clientWidth + 1 || image.naturalHeight > image.clientHeight + 1;
  }

  function updateZoomable() {
    const zoomable = zoomed || (ui.image.classList.contains('ready') && canZoom());
    ui.lb.toggleAttribute('data-zoomable', zoomable && !zoomed);
    ui.zoom.disabled = !zoomable;
    ui.zoom.innerHTML = svg(zoomed ? 'zoomOut' : 'zoomIn');
    ui.zoom.setAttribute('aria-pressed', String(zoomed));
    ui.zoom.setAttribute('aria-label', zoomed ? 'Fit to screen' : 'Zoom to actual size');
    ui.zoom.title = zoomed ? 'Fit to screen (Z)' : 'Actual size (Z)';
  }

  function setZoom(on, point) {
    if (!ui || on === zoomed) return;
    if (on && !canZoom()) return;
    const { image, viewport, lb } = ui;
    const r = image.getBoundingClientRect();
    const fx = point ? (point.x - r.left) / r.width : 0.5;
    const fy = point ? (point.y - r.top) / r.height : 0.5;
    zoomed = on;
    lb.toggleAttribute('data-zoomed', on);
    if (on) {
      viewport.scrollLeft = fx * image.offsetWidth - viewport.clientWidth / 2;
      viewport.scrollTop = fy * image.offsetHeight - viewport.clientHeight / 2;
    } else {
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    }
    updateZoomable();
  }

  function renderThumbs() {
    ui.thumbs.replaceChildren(...items.map((item, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb';
      button.dataset.index = String(i);
      button.setAttribute('aria-label', `Image ${i + 1}${item.alt ? `: ${item.alt}` : ''}`);
      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      button.append(img);
      return button;
    }));
  }

  function show(i) {
    const n = items.length;
    index = (i + n) % n;
    const item = items[index];
    const { image, lb } = ui;

    if (zoomed) setZoom(false);
    const token = ++loadToken;
    lb.toggleAttribute('data-loading', true);
    image.classList.remove('ready');
    updateZoomable();

    image.onload = () => {
      if (token !== loadToken) return;
      lb.removeAttribute('data-loading');
      image.classList.add('ready');
      updateZoomable();
    };
    image.onerror = () => {
      if (token !== loadToken) return;
      if (item.fallback && image.getAttribute('src') !== item.fallback) {
        image.src = item.fallback;
        return;
      }
      lb.removeAttribute('data-loading');
    };
    image.alt = item.alt;
    image.removeAttribute('src');
    image.src = item.src;

    const text = item.alt || fileName(item.src);
    ui.caption.textContent = text;
    ui.caption.classList.toggle('filename', !item.alt);
    ui.counter.textContent = n > 1 ? `${index + 1} / ${n}` : '';
    ui.open.href = item.src;
    ui.live.textContent = `Image ${index + 1} of ${n}: ${text}`;

    for (const thumb of ui.thumbs.children) {
      const current = +thumb.dataset.index === index;
      thumb.setAttribute('aria-current', String(current));
      if (current) thumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    for (const step of [1, -1]) {
      if (n > 1) new Image().src = items[(index + step + n) % n].src;
    }
  }

  function lockScroll() {
    const html = document.documentElement;
    const gap = window.innerWidth - html.clientWidth;
    savedScroll = { overflow: html.style.overflow, padding: document.body.style.paddingRight };
    html.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
  }

  function unlockScroll() {
    if (!savedScroll) return;
    document.documentElement.style.overflow = savedScroll.overflow;
    document.body.style.paddingRight = savedScroll.padding;
    savedScroll = null;
  }

  function open(list, i, trigger) {
    if (!ui) ui = build();
    clearTimeout(closeTimer);
    items = list;
    returnFocus = trigger;
    const single = items.length < 2;
    ui.prev.hidden = single;
    ui.next.hidden = single;
    ui.thumbs.hidden = single;
    renderThumbs();
    if (ui.lb.hidden) lockScroll();
    ui.lb.hidden = false;
    show(i);
    requestAnimationFrame(() => ui.lb.toggleAttribute('data-open', true));
    ui.close.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey, true);
  }

  function close() {
    if (!ui || ui.lb.hidden) return;
    document.removeEventListener('keydown', onKey, true);
    ui.lb.removeAttribute('data-open');
    loadToken++;
    closeTimer = setTimeout(() => {
      if (zoomed) setZoom(false);
      ui.lb.hidden = true;
      ui.image.removeAttribute('src');
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200);
    unlockScroll();
    if (returnFocus && returnFocus.isConnected) {
      const focusable = returnFocus.closest('a[href]') || returnFocus;
      focusable.focus({ preventScroll: true });
    }
    returnFocus = null;
  }

  function trapFocus(e) {
    const focusables = [...ui.root.querySelectorAll('button, a[href]')]
      .filter((el) => !el.disabled && !el.closest('[hidden]') && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = ui.root.activeElement;
    if (e.shiftKey && (active === first || !active)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !active)) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKey(e) {
    let handled = true;
    switch (e.key) {
      case 'Escape':
        if (zoomed) setZoom(false);
        else close();
        break;
      case 'ArrowLeft':
        if (!zoomed && items.length > 1) show(index - 1);
        else handled = zoomed ? false : handled;
        break;
      case 'ArrowRight':
        if (!zoomed && items.length > 1) show(index + 1);
        else handled = zoomed ? false : handled;
        break;
      case 'Home':
        show(0);
        break;
      case 'End':
        show(items.length - 1);
        break;
      case 'z':
      case 'Z':
        if (e.metaKey || e.ctrlKey) handled = false;
        else setZoom(!zoomed);
        break;
      case 'Tab':
        trapFocus(e);
        return;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
})();
