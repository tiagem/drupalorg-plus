/**
 * Dark theme for drupal.org.
 *
 * Reads the site's own stylesheets through the CSSOM and writes a mirror of
 * every rule that sets a colour, with each colour shifted for a dark
 * background in the OKLab space. The mirror lives in one <style> element whose
 * media attribute does the switching: "all" for dark, the
 * prefers-color-scheme query for system, and nothing at all for light.
 */
(() => {
  'use strict';

  const CACHE_KEY = 'dodThemeCache';
  const STYLE_ID = 'dod-dark-theme';
  const MEDIA = {
    dark: 'all',
    system: '(prefers-color-scheme: dark)',
  };
  const NOT_COLORS = new Set([
    'transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'none',
  ]);
  const TOKEN = /rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}\b|\b[a-z]{3,20}\b/gi;
  const URL_PART = /(url\([^)]*\))/i;
  const LIGHT_TEXTURE = /url\([^)]*\/bg-(gray|white)-blueprint\.png/i;
  const VAR = /var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g;

  const STYLE_RULE = 1;
  const IMPORT_RULE = 3;
  const MEDIA_RULE = 4;
  const SUPPORTS_RULE = 12;

  let mode = 'system';
  let css = '';
  let rootStyle = null;

  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;

  const ctx = document.createElement('canvas').getContext('2d');
  const colorCache = new Map();
  const shiftCache = new Map();

  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

  function rgbToOklab(r, g, b) {
    r = toLinear(r / 255);
    g = toLinear(g / 255);
    b = toLinear(b / 255);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  }

  function oklabToRgb(L, a, b) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map(toSrgb);
  }

  function oklabToRgbInGamut(L, a, b) {
    let rgb = oklabToRgb(L, a, b);
    for (let i = 0; i < 24 && rgb.some((c) => c < -0.001 || c > 1.001); i++) {
      a *= 0.9;
      b *= 0.9;
      rgb = oklabToRgb(L, a, b);
    }
    return rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255));
  }

  function parseResolved(value) {
    if (value[0] === '#') {
      const n = parseInt(value.slice(1), 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    }
    const parts = value.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return null;
    return { r: +parts[0], g: +parts[1], b: +parts[2], a: parts[3] === undefined ? 1 : +parts[3] };
  }

  function resolveColor(token) {
    if (colorCache.has(token)) return colorCache.get(token);
    let color = null;
    const lower = token.toLowerCase();
    if (!NOT_COLORS.has(lower)) {
      ctx.fillStyle = '#010203';
      ctx.fillStyle = token;
      const value = ctx.fillStyle;
      if (value !== '#010203' || lower === '#010203') color = parseResolved(value);
    }
    colorCache.set(token, color);
    return color;
  }

  function shiftColor(color, kind) {
    if (color.a === 0) return null;
    if (color.a < 0.6 && kind !== 'fg') return null;

    const [L, a, b] = rgbToOklab(color.r, color.g, color.b);
    const chroma = Math.hypot(a, b);
    let L2 = L;
    let k = 1;

    if (kind === 'bg') {
      if (L > 0.6) {
        L2 = 0.22 + (1 - L) * 0.8;
        k = 0.85;
      } else {
        L2 = L * 0.85;
      }
    } else if (kind === 'fg') {
      if (L >= 0.6) return null;
      L2 = 0.93 - L * 0.5 + (chroma > 0.06 ? 0.04 : 0);
    } else if (kind === 'border') {
      if (L <= 0.6) return null;
      L2 = 0.3 + (1 - L) * 0.6;
    }

    const [r, g, bl] = oklabToRgbInGamut(L2, a * k, b * k);
    return color.a === 1 ? `rgb(${r}, ${g}, ${bl})` : `rgba(${r}, ${g}, ${bl}, ${color.a})`;
  }

  function shiftToken(token, kind) {
    const key = kind + token;
    if (shiftCache.has(key)) return shiftCache.get(key);
    const color = resolveColor(token);
    const shifted = (color && shiftColor(color, kind)) || token;
    shiftCache.set(key, shifted);
    return shifted;
  }

  function shiftValue(value, kind) {
    return value
      .split(URL_PART)
      .map((part) => (URL_PART.test(part) ? part : part.replace(TOKEN, (t) => shiftToken(t, kind))))
      .join('');
  }

  function kindOf(prop) {
    if (prop === 'color' || prop === '-webkit-text-fill-color' || prop === 'caret-color'
      || prop === 'text-decoration-color' || prop === 'fill' || prop === 'stroke') return 'fg';
    if (prop === 'background-color' || prop === 'background-image') return 'bg';
    if (prop === 'outline-color' || prop === 'column-rule-color'
      || (prop.startsWith('border') && prop.endsWith('color'))) return 'border';
    return null;
  }

  /**
   * Shorthands that can hold a longhand's colour. When a shorthand uses
   * var(), Chrome reports its longhands as empty, so the colour has to be
   * read from the shorthand.
   */
  function shorthandsOf(prop) {
    if (prop === 'background-color' || prop === 'background-image') return ['background'];
    if (prop === 'outline-color') return ['outline'];
    const side = prop.match(/^border-(top|right|bottom|left)-color$/);
    return side ? ['border-color', `border-${side[1]}`, 'border'] : [];
  }

  /**
   * Replaces var() references with the custom property's value on the root
   * element, or with the fallback, so the colour can be shifted like a literal.
   */
  function resolveVars(value) {
    for (let depth = 0; depth < 8 && value.includes('var('); depth++) {
      value = value.replace(VAR, (match, name, fallback) => (
        rootStyle.getPropertyValue(name).trim() || (fallback ? fallback.trim() : match)
      ));
    }
    return value;
  }

  function shiftStyle(style) {
    let out = '';
    const shorthandsDone = new Set();
    for (let i = 0; i < style.length; i++) {
      const longhand = style[i];
      const kind = kindOf(longhand);
      if (!kind) continue;

      let prop = longhand;
      let value = style.getPropertyValue(prop).trim();
      if (!value) {
        prop = shorthandsOf(longhand).find((s) => style.getPropertyValue(s).includes('var('));
        if (!prop || shorthandsDone.has(prop)) continue;
        shorthandsDone.add(prop);
        value = style.getPropertyValue(prop).trim();
      }

      value = resolveVars(value);
      if (value.includes('var(')) continue;
      const priority = style.getPropertyPriority(prop) ? ' !important' : '';
      const noTexture = prop.startsWith('background') && LIGHT_TEXTURE.test(value)
        ? `background-image:none${priority};`
        : '';
      if (prop === 'background-image' && (noTexture || !value.includes('gradient'))) {
        out += noTexture;
        continue;
      }
      const shifted = shiftValue(value, kind);
      if (shifted !== value) out += `${prop}:${shifted}${priority};`;
      out += noTexture;
    }
    return out;
  }

  function walk(rules, out) {
    for (const rule of rules) {
      if (rule.type === STYLE_RULE) {
        const decls = shiftStyle(rule.style);
        if (decls) out.push(`${rule.selectorText}{${decls}}`);
      } else if (rule.type === MEDIA_RULE || rule.type === SUPPORTS_RULE) {
        const inner = [];
        walk(rule.cssRules, inner);
        if (inner.length) {
          const at = rule.type === MEDIA_RULE ? '@media' : '@supports';
          out.push(`${at} ${rule.conditionText}{${inner.join('')}}`);
        }
      } else if (rule.type === IMPORT_RULE && rule.styleSheet) {
        walkSheet(rule.styleSheet, out);
      }
    }
  }

  function walkSheet(sheet, out) {
    if (sheet.ownerNode === styleEl || sheet.disabled) return;
    const media = sheet.media && sheet.media.mediaText;
    if (media && /print/.test(media) && !/screen|all/.test(media)) return;
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      return;
    }
    const inner = [];
    walk(rules, inner);
    if (!inner.length) return;
    out.push(media && media !== 'all' ? `@media ${media}{${inner.join('')}}` : inner.join(''));
  }

  function baseCss() {
    const bg = shiftColor({ r: 255, g: 255, b: 255, a: 1 }, 'bg');
    const fg = shiftColor({ r: 0, g: 0, b: 0, a: 1 }, 'fg');
    return `html{background-color:${bg};color:${fg};color-scheme:dark}`
      + 'img[src$="-black.svg"],img[src*="-black.svg?"]{filter:invert(.9)}'
      + 'img:not([src$=".svg"]){filter:brightness(.92)}';
  }

  function generate() {
    rootStyle = getComputedStyle(document.documentElement);
    const out = [baseCss()];
    for (const sheet of document.styleSheets) walkSheet(sheet, out);
    return out.join('\n');
  }

  function place() {
    if (styleEl.parentNode !== document.documentElement || styleEl.nextSibling) {
      document.documentElement.appendChild(styleEl);
    }
  }

  function apply() {
    if (mode === 'light') {
      styleEl.remove();
      return;
    }
    styleEl.media = MEDIA[mode] || MEDIA.system;
    const text = css || baseCss();
    if (styleEl.textContent !== text) styleEl.textContent = text;
    place();
  }

  function persist() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ mode, css }));
    } catch {
      // Storage can be blocked; the theme still works without the cache.
    }
  }

  let timer = 0;
  function regenerate() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (mode === 'light') return;
      const next = generate();
      if (next !== css) {
        css = next;
        persist();
      }
      apply();
    }, 30);
  }

  function setMode(next) {
    if (!MEDIA[next] && next !== 'light') next = 'system';
    mode = next;
    apply();
    persist();
    if (mode !== 'light' && document.readyState !== 'loading') regenerate();
  }

  function watchHead() {
    regenerate();
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node === styleEl) continue;
          if (node.nodeName === 'LINK' && /stylesheet/i.test(node.rel)) {
            node.addEventListener('load', regenerate, { once: true });
          } else if (node.nodeName === 'STYLE') {
            regenerate();
          }
        }
      }
    }).observe(document.head, { childList: true });
  }

  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached) {
      mode = cached.mode || mode;
      css = cached.css || '';
    }
  } catch {
    // No cache yet, or storage is blocked.
  }
  apply();

  chrome.storage.sync.get({ theme: 'system' }, ({ theme }) => setMode(theme));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.theme) setMode(changes.theme.newValue);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchHead, { once: true });
  } else {
    watchHead();
  }
  window.addEventListener('load', regenerate, { once: true });
})();
