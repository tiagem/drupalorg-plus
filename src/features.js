/**
 * Optional reading tools for drupal.org. Each one follows a switch in the popup.
 *
 * Issue pages are node-type-project-issue. The status lives in
 * #sidebar-first and the related issues in #aside, both floated right.
 * Comments are .comment.
 *
 * Mentions are plain text on drupal.org. The viewer's own name comes from
 * /user, which redirects to /u/<name> when logged in.
 */
(() => {
  'use strict';

  const DEFAULTS = {
    reading: true,
    copy: true,
    apiDocs: true,
    keys: true,
    mentions: true,
    newestFirst: false,
  };

  const VIEWER_KEY = 'dppViewer';
  const VIEWER_TTL = 24 * 60 * 60 * 1000;
  const MENTION = /(^|[^\w@./:-])@([a-z0-9](?:[\w.-]*[a-z0-9_])?)(?![\w(])/gi;
  const NOT_USERS = new Set([
    'abstract', 'api', 'author', 'code', 'covers', 'coversdefaultclass', 'dataprovider', 'depends',
    'deprecated', 'endcode', 'file', 'group', 'ingroup', 'inheritdoc', 'internal', 'link', 'method',
    'param', 'property', 'return', 'returns', 'see', 'since', 'throws', 'todo', 'trigger', 'var',
  ]);

  const CSS = `
    html.dpp-reading:not(.dpp-wide) body.node-type-project-issue .container-12,
    html.dpp-reading:not(.dpp-wide) body.page-node-type-project-issue .container-12,
    html.dpp-reading:not(.dpp-wide) body.page-node-type-project-issue .l-section-container.page-inner {
      width: min(1240px, calc(100% - 32px));
      max-width: 1240px;
    }
    html.dpp-reading #page-title,
    html.dpp-reading h1.page-title {
      position: sticky;
      top: 0;
      z-index: 4;
      background: #fff;
    }
    html.dpp-reading .page-inner {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }
    html.dpp-reading .page-inner > #main {
      flex: 1 1 auto;
      float: none;
      width: auto;
      min-width: 0;
    }
    html.dpp-reading .dpp-sidebar {
      position: sticky;
      top: 12px;
      flex: 0 0 389px;
      width: 389px;
      max-height: calc(100vh - 24px);
      overflow: auto;
    }
    html.dpp-reading .dpp-sidebar > #sidebar-first,
    html.dpp-reading .dpp-sidebar > #aside {
      float: none;
      width: auto;
      position: static;
    }
    html.dpp-reading #main > #content-bottom-region {
      float: none !important;
      width: auto !important;
      clear: both;
      margin-right: 0;
    }
    a.dpp-mention {
      margin-inline: -0.1em;
      padding: 0 0.2em;
      border-radius: 4px;
      background: color-mix(in srgb, #0678be 14%, transparent);
      font-weight: 600;
      text-decoration: none;
    }
    a.dpp-mention:hover,
    a.dpp-mention:focus-visible {
      text-decoration: underline;
    }
    a.dpp-mention.dpp-mention--me {
      background: color-mix(in srgb, #f5a623 38%, transparent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, #f5a623 75%, transparent);
      color: inherit;
    }
    .comment.dpp-current {
      outline: 2px solid #0678be;
      outline-offset: 4px;
    }

    html button.dpp-btn {
      appearance: none;
      margin-left: 8px;
      padding: 0.25rem 0.75rem;
      border: 1px solid oklch(0.922 0 0) !important;
      border-radius: 999px;
      background: oklch(1 0 0) !important;
      background-image: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      color: oklch(0.145 0 0) !important;
      font: 500 12px/1.4 Inter, ui-sans-serif, system-ui, sans-serif;
      cursor: pointer;
      vertical-align: middle;
    }
    html button.dpp-btn:hover,
    html button.dpp-btn:focus-visible {
      background: oklch(0.97 0 0) !important;
      background-image: none !important;
      border-color: oklch(0.922 0 0) !important;
      color: oklch(0.145 0 0) !important;
      outline: 1px solid oklch(0.708 0 0);
      outline-offset: 2px;
    }
    .dpp-code-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      margin: 0.5em 0;
    }
    .dpp-code-wrap > pre,
    .dpp-code-wrap > div.codeblock {
      align-self: stretch;
      margin: 0;
    }

    html.dpp-api .page-inner {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }
    html.dpp-api .page-inner > #main {
      flex: 1 1 auto;
      float: none;
      width: auto;
      min-width: 0;
    }
    html.dpp-api .page-inner > #aside {
      position: sticky;
      top: 12px;
      float: none;
      flex: 0 0 min(485px, 34vw);
      width: min(485px, 34vw);
      max-height: calc(100vh - 24px);
      overflow: auto;
    }
  `;

  let settings = { ...DEFAULTS };
  let commentIndex = -1;
  let viewer = null;

  function isIssuePage() {
    const name = document.body?.className || '';
    if (/(?:^|\s)(?:node-type-project-issue|page-node-type-project-issue)(?:\s|$)/.test(name)) return true;
    return !!document.querySelector('#block-project-issue-issue-metadata');
  }

  function issueComments() {
    return [...document.querySelectorAll('.comment')].filter((el) => {
      if (el.classList.contains('token') || el.closest('pre, code')) return false;
      return !!el.querySelector(':scope > .content, :scope > .comment__content, .field-name-comment-body, .field--name-comment-body');
    });
  }

  function titleEl() {
    return document.querySelector('#page-title, h1.page-title, .page-title h1, #content-inner h1');
  }

  function makeButton(label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dpp-btn';
    button.dataset.dpp = '';
    button.textContent = label;
    return button;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-999px';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      area.remove();
      return ok;
    }
  }

  function flash(button, label) {
    const previous = button.textContent;
    button.textContent = label;
    setTimeout(() => { button.textContent = previous; }, 1200);
  }

  function reorder(parent, items) {
    const last = items.reduce((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? b : a));
    const ref = last.nextSibling;
    for (const item of items) parent.insertBefore(item, ref);
  }

  function restoreOrder() {
    document.querySelectorAll('[data-dpp-newest]').forEach((wrapper) => {
      const items = [...wrapper.children].filter((el) => el.dataset.dppOrder !== undefined);
      items.sort((a, b) => a.dataset.dppOrder - b.dataset.dppOrder);
      if (items.length) reorder(wrapper, items);
      items.forEach((el) => delete el.dataset.dppOrder);
      delete wrapper.dataset.dppNewest;
    });
  }

  function clearPage() {
    restoreOrder();
    document.querySelectorAll('a.dpp-mention').forEach((link) => {
      const parent = link.parentNode;
      link.replaceWith(link.textContent);
      parent.normalize();
    });
    document.querySelectorAll('.dpp-code-wrap').forEach((wrap) => {
      const block = wrap.querySelector('pre, div.codeblock');
      if (block) wrap.before(block);
      wrap.remove();
    });
    const bottom = document.querySelector('#content-bottom-region');
    const marker = document.querySelector('[data-dpp="bottom-marker"]');
    if (bottom && marker?.parentNode) marker.before(bottom);
    document.querySelectorAll('.dpp-sidebar').forEach((col) => {
      const parent = col.parentNode;
      while (col.firstChild) parent.insertBefore(col.firstChild, col);
      col.remove();
    });
    document.querySelectorAll('[data-dpp]').forEach((el) => el.remove());
    document.querySelectorAll('.dpp-current').forEach((el) => el.classList.remove('dpp-current'));
    document.documentElement.classList.remove('dpp-reading', 'dpp-api');
    commentIndex = -1;
  }

  function applyReading() {
    if (!isIssuePage()) return;
    document.documentElement.classList.add('dpp-reading');

    const status = document.querySelector('#sidebar-first');
    const aside = document.querySelector('#aside');
    if (!status || document.querySelector('.dpp-sidebar')) return;
    const column = document.createElement('div');
    column.className = 'dpp-sidebar';
    column.dataset.dpp = 'sidebar';
    const main = document.querySelector('.page-inner > #main');
    if (main) main.after(column);
    else status.before(column);
    column.appendChild(status);
    if (aside) column.appendChild(aside);

    // Logged-in comment form lives in #content-bottom-region, a sibling that
    // clears under both columns. As a flex item it becomes a third column.
    const form = document.querySelector('#content-bottom-region');
    if (form && main && !main.contains(form)) {
      const marker = document.createElement('span');
      marker.dataset.dpp = 'bottom-marker';
      marker.hidden = true;
      form.before(marker);
      main.appendChild(form);
    }
  }

  function codeBlock(block) {
    if (block.closest('.dpp-code-wrap, .system-message')) return false;
    if (block.tagName === 'PRE' && block.parentElement?.classList.contains('codeblock')) return false;
    const text = block.innerText.trim();
    if (!text) return false;
    const marked = block.matches('pre[class*="language-"], pre.codeblock, div.codeblock')
      || !!block.querySelector('code[class*="language-"]');
    if (marked) return true;
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.length >= 3 && text.length > 80;
  }

  function applyCopy() {
    if (isIssuePage()) {
      const title = titleEl();
      if (title && !title.querySelector('[data-dpp]')) {
        const button = makeButton('Copy link');
        button.addEventListener('click', async () => {
          const url = location.href.split('#')[0];
          if (await copyText(url)) flash(button, 'Copied');
        });
        title.appendChild(button);
      }
    }

    for (const block of document.querySelectorAll('pre, div.codeblock')) {
      if (!codeBlock(block)) continue;
      const wrap = document.createElement('div');
      wrap.className = 'dpp-code-wrap';
      block.before(wrap);
      const button = makeButton('Copy');
      button.addEventListener('click', async () => {
        if (await copyText(block.innerText.trim())) flash(button, 'Copied');
      });
      wrap.append(button, block);
    }
  }

  async function loadViewer() {
    if (!document.body.classList.contains('logged-in')) {
      try { localStorage.removeItem(VIEWER_KEY); } catch { /* Storage can be blocked. */ }
      return null;
    }
    try {
      const cached = JSON.parse(localStorage.getItem(VIEWER_KEY));
      if (cached && Date.now() - cached.at < VIEWER_TTL) return cached.name;
    } catch {
      // No cache yet, or storage is blocked.
    }
    try {
      const response = await fetch('/user', { method: 'HEAD', credentials: 'same-origin' });
      const name = new URL(response.url).pathname.match(/^\/u\/([^/]+)/)?.[1]?.toLowerCase();
      if (!name) return null;
      try { localStorage.setItem(VIEWER_KEY, JSON.stringify({ name, at: Date.now() })); } catch { /* Storage can be blocked. */ }
      return name;
    } catch {
      return null;
    }
  }

  function markViewer() {
    document.querySelectorAll('a.dpp-mention').forEach((link) => {
      link.classList.toggle('dpp-mention--me', !!viewer && link.dataset.user === viewer);
    });
  }

  function applyMentions() {
    const profiles = new Map();
    for (const link of document.querySelectorAll('a.username[href^="/u/"]')) {
      profiles.set(link.textContent.trim().toLowerCase(), link.getAttribute('href'));
    }

    const texts = [];
    for (const field of document.querySelectorAll('.field-name-body, .field-name-comment-body')) {
      const walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => (node.parentElement.closest('a, pre, code, kbd, textarea, .codeblock')
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT),
      });
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.includes('@')) texts.push(walker.currentNode);
      }
    }

    for (const node of texts) {
      const text = node.textContent;
      const parts = [];
      let last = 0;
      for (const match of text.matchAll(MENTION)) {
        const name = match[2];
        const user = name.toLowerCase();
        if (NOT_USERS.has(user) && !profiles.has(user)) continue;
        const start = match.index + match[1].length;
        parts.push(text.slice(last, start));
        const link = document.createElement('a');
        link.className = 'dpp-mention';
        link.href = profiles.get(user) || `/u/${encodeURIComponent(user)}`;
        link.dataset.user = user;
        link.textContent = `@${name}`;
        parts.push(link);
        last = start + name.length + 1;
      }
      if (!parts.length) continue;
      parts.push(text.slice(last));
      node.replaceWith(...parts.filter((part) => part !== ''));
    }
    markViewer();
  }

  function applyNewestFirst() {
    const lists = [
      ...[...document.querySelectorAll('.comment-wrapper')].map((wrapper) => [
        wrapper,
        [...wrapper.children].filter((el) => el.matches('.comment, .merge-request-activity')),
      ]),
      ...[...document.querySelectorAll('.comment-wrapper > .merge-request-activity')].map((list) => [
        list,
        [...list.children].filter((el) => el.matches('li')),
      ]),
    ];
    for (const [parent, items] of lists) {
      if (items.length < 2) continue;
      items.forEach((el, index) => { el.dataset.dppOrder = index; });
      parent.dataset.dppNewest = '';
      reorder(parent, items.reverse());
    }
  }

  function applyApi() {
    if (location.hostname !== 'api.drupal.org') return;
    document.documentElement.classList.add('dpp-api');
  }

  function lightboxOpen() {
    const host = document.querySelector('dod-lightbox');
    const dialog = host?.shadowRoot?.querySelector('.lb');
    return !!dialog && !dialog.hidden;
  }

  function onKey(event) {
    if (!settings.keys || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (lightboxOpen()) return;

    if (event.key !== 'j' && event.key !== 'k') return;
    const list = issueComments();
    if (!list.length) return;
    event.preventDefault();
    if (event.key === 'j') commentIndex = Math.min(list.length - 1, commentIndex + 1);
    else commentIndex = Math.max(0, commentIndex - 1);
    list.forEach((el) => el.classList.remove('dpp-current'));
    const current = list[commentIndex];
    current.classList.add('dpp-current');
    current.scrollIntoView({ block: 'center' });
  }

  function apply() {
    clearPage();
    if (settings.reading) applyReading();
    if (settings.copy) applyCopy();
    if (settings.apiDocs) applyApi();
    if (settings.mentions) applyMentions();
    if (settings.newestFirst) applyNewestFirst();
  }

  const style = document.createElement('style');
  style.id = 'dpp-features';
  style.textContent = CSS;
  document.documentElement.appendChild(style);
  document.addEventListener('keydown', onKey);

  function start() {
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      settings = { ...DEFAULTS, ...stored };
      apply();
    });
    loadViewer().then((name) => {
      viewer = name;
      markViewer();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      let touched = false;
      for (const key of Object.keys(DEFAULTS)) {
        if (!changes[key]) continue;
        settings[key] = changes[key].newValue;
        touched = true;
      }
      if (touched) apply();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
