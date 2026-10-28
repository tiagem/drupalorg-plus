/**
 * Page-wide CSS options for drupal.org: a wider layout and visual polish.
 *
 * The main site caps .container-12 at 960px. Wide layout raises that to
 * 1280px, which keeps the main column readable next to a sidebar. new.drupal.org
 * has its own wide layout and is left alone.
 *
 * Polish only sets sizes, spacing and corners. Colors come from currentColor so
 * the dark theme, which mirrors the site's own stylesheets, still applies.
 *
 * Runs at document_start so the page does not jump once it has painted.
 */
(() => {
  'use strict';

  const OPTIONS = {
    wide: { cacheKey: 'dppWide', className: 'dpp-wide' },
    polish: { cacheKey: 'dppPolish', className: 'dpp-polish' },
  };

  const CSS = `
    @media (min-width: 65.625em) {
      html.dpp-wide .container-12,
      html.dpp-wide #footer .block-inner,
      html.dpp-wide #block-drupalorg-announcements .announcement,
      html.dpp-wide .node-type-guide .panel-layout .container-inner,
      html.dpp-wide .node-type-documentation .panel-layout .container-inner {
        width: min(1280px, calc(100% - 48px));
        max-width: none;
      }
      html.dpp-wide .node-type-guide .messages,
      html.dpp-wide .node-type-documentation .messages {
        max-width: none;
      }
      html.dpp-wide table.views-table {
        width: 100%;
      }
    }

    html.dpp-polish {
      --dpp-radius: 8px;
      --dpp-radius-control: 6px;
      --dpp-control-height: 34px;
      --dpp-line: color-mix(in srgb, currentColor 14%, transparent);
      --dpp-control-line: color-mix(in srgb, currentColor 24%, transparent);
    }

    html.dpp-polish #content p,
    html.dpp-polish #content li {
      text-wrap: pretty;
    }
    html.dpp-polish #page-title,
    html.dpp-polish h1.page-title {
      text-wrap: balance;
    }
    html.dpp-polish .page-inner a {
      text-underline-offset: 0.15em;
    }
    html.dpp-polish .node .field-name-body p,
    html.dpp-polish .node .field-name-body li {
      font-size: 15px;
      line-height: 1.6;
    }
    html.dpp-polish .comment .content p,
    html.dpp-polish .comment .content li {
      font-size: 14px;
      line-height: 1.6;
    }
    html.dpp-polish .comment .submitted {
      font-size: 12.5px;
    }

    html.dpp-polish .comment-wrapper > .comment {
      margin-top: 0;
      padding-block: 16px;
      border-top: 1px solid var(--dpp-line);
      border-bottom: 0;
    }
    html.dpp-polish .comment.system-message > .content {
      border-radius: var(--dpp-radius);
    }
    html.dpp-polish .comment .submitted a.merge-request {
      border-radius: var(--dpp-radius-control);
      padding: 2px 6px;
    }
    html.dpp-polish table.nodechanges-field-changes {
      border-collapse: separate;
      border-spacing: 0;
      border-radius: var(--dpp-radius);
      padding: 6px 8px;
    }
    html.dpp-polish table.nodechanges-field-changes td {
      padding: 3px 6px;
    }
    html.dpp-polish table.nodechanges-field-changes :is(.nodechanges-label, .nodechanges-old) {
      white-space: nowrap;
    }

    html.dpp-polish #content pre {
      padding: 12px 16px;
      border-radius: var(--dpp-radius-control);
      line-height: 1.5;
    }
    html.dpp-polish #content :not(pre) > code {
      padding: 0.1em 0.35em;
      border-radius: 4px;
    }
    html.dpp-polish #content .field-name-body img,
    html.dpp-polish #content .comment img:not(.picture img) {
      border-radius: var(--dpp-radius-control);
    }

    html.dpp-polish #block-project-issue-issue-metadata,
    html.dpp-polish .region-sidebar-first > .block,
    html.dpp-polish .region-sidebar-second > .block,
    html.dpp-polish .homebox-portlet-inner,
    html.dpp-polish .view-project-release-download-table .view-content .release {
      border-radius: var(--dpp-radius);
      overflow: clip;
    }
    html.dpp-polish .region-sidebar-second > .block + .block {
      margin-top: 16px;
    }
    html.dpp-polish #block-project-issue-issue-metadata .content > .flag-wrapper,
    html.dpp-polish #block-project-issue-issue-metadata #project-issue-jumplinks {
      background: transparent;
    }
    html.dpp-polish #block-project-issue-issue-metadata #project-issue-jumplinks {
      padding: 0 14px 12px;
    }
    html.dpp-polish .page-inner fieldset {
      border-radius: var(--dpp-radius);
      padding: 12px 16px;
    }
    html.dpp-polish .node-project_issue-form .issue-settings {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: 0 12px;
    }
    html.dpp-polish .node-project_issue-form .issue-settings > .form-wrapper {
      float: none;
      width: auto;
      max-width: none;
      margin-right: 0;
    }
    html.dpp-polish .node-project_issue-form .issue-settings > :is(.field-name-field-project, .field-name-field-issue-status, .field-name-field-issue-assigned) {
      grid-column: 1 / -1;
    }
    html.dpp-polish .node-project_issue-form .fieldset-wrapper > :is(.form-item-title, .issue-settings) {
      width: calc(50% - 6px);
    }
    html.dpp-polish .node-project_issue-form .fieldset-wrapper > :is(.form-item-title, .issue-settings-issue) {
      margin-right: 12px;
    }
    html.dpp-polish .node-project_issue-form .fieldset-wrapper > .form-item-title,
    html.dpp-polish .node-project_issue-form .issue-settings > .form-wrapper {
      margin-bottom: 8px;
    }
    html.dpp-polish .node-project_issue-form .issue-settings .form-item {
      padding-right: 0;
    }
    html.dpp-polish .node-project_issue-form .issue-settings select {
      width: 100%;
    }
    html.dpp-polish .views-exposed-form .views-exposed-widgets {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 8px 12px;
    }
    html.dpp-polish .views-exposed-form .views-exposed-widget {
      float: none;
      padding: 0;
    }
    html.dpp-polish .views-exposed-form .views-exposed-widget .form-submit {
      margin: 0;
    }

    @media (min-width: 65.625em) {
      html.dpp-polish .page-user .profile {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr) 280px;
        align-items: start;
        gap: 32px;
      }
      html.dpp-polish .page-user .profile > * {
        grid-column: 1 / -1;
      }
      html.dpp-polish .page-user .profile > :is(.contact, .main, .aside) {
        float: none;
        width: auto;
        margin: 0;
      }
      html.dpp-polish .page-user .profile > .contact {
        grid-column: 1;
      }
      html.dpp-polish .page-user .profile > .main {
        grid-column: 2;
      }
      html.dpp-polish .page-user .profile > .aside {
        grid-column: 3;
      }
    }
    html.dpp-polish .page-user .profile > :is(.contact, .aside) {
      padding: 20px;
      border-radius: var(--dpp-radius);
      background: color-mix(in srgb, currentColor 4%, transparent);
    }
    html.dpp-polish .page-user .profile > .aside {
      flex-direction: column;
      gap: 16px;
    }
    html.dpp-polish .page-user .profile > .aside :is(p, .field, .field-items) {
      margin: 0;
    }
    html.dpp-polish .page-user .profile > .aside > :empty {
      display: none;
    }
    html.dpp-polish .page-user .profile > .aside:not(:has(> :not(:empty))) {
      display: none;
    }
    html.dpp-polish .page-user .profile > .aside > .field-name-field-mentors + p {
      margin-top: -12px;
    }
    html.dpp-polish .page-user .profile > .main {
      padding-top: 20px;
    }
    html.dpp-polish .page-user .profile > :is(.contact, .main) > *,
    html.dpp-polish .page-user .profile .group-profile-personal > .field {
      margin: 0 0 16px;
    }
    html.dpp-polish .page-user .profile > :is(.contact, .main, .aside) > :last-child,
    html.dpp-polish .page-user .profile .group-profile-personal > .field:last-child {
      margin-bottom: 0;
    }
    html.dpp-polish .page-user .profile :is(.field-label-above > .field-label, h4) {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 700;
    }
    html.dpp-polish .page-user .profile h3 {
      margin: 8px 0 12px;
      font-size: 20px;
    }
    html.dpp-polish .page-user .profile .field-name-field-bio .field-item {
      line-height: 1.6;
    }

    html.dpp-polish table.views-table th,
    html.dpp-polish table.views-table td {
      padding: 8px 10px;
    }
    html.dpp-polish table.views-table td.views-field-title {
      width: 35%;
    }
    html.dpp-polish table.views-table td.views-field-field-issue-priority,
    html.dpp-polish table.views-table td.views-field-field-issue-category,
    html.dpp-polish table.views-table td.views-field-field-issue-version,
    html.dpp-polish table.views-table td.views-field-comment-count,
    html.dpp-polish table.views-table td.views-field-last-comment-timestamp,
    html.dpp-polish table.views-table td.views-field-created {
      white-space: nowrap;
    }
    html.dpp-polish table.views-table tbody tr:hover td {
      background-image: linear-gradient(color-mix(in srgb, currentColor 5%, transparent), color-mix(in srgb, currentColor 5%, transparent));
    }

    html.dpp-polish .page-inner :is(input.form-text, input[type="email"], input[type="url"], input[type="search"], input[type="number"], input[type="password"], select, textarea) {
      box-sizing: border-box;
      border: 1px solid var(--dpp-control-line);
      border-radius: var(--dpp-radius-control);
      font-size: 14px;
    }
    html.dpp-polish .page-inner :is(input.form-text, input[type="email"], input[type="url"], input[type="search"], input[type="number"], input[type="password"], select) {
      height: var(--dpp-control-height);
      padding: 0 10px;
    }
    html.dpp-polish .page-inner select {
      width: auto;
      max-width: 100%;
      padding: 0 6px;
    }
    html.dpp-polish .page-inner select:not([multiple]) {
      appearance: none;
      padding: 0 32px 0 10px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%23808080' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4.5 6 7.5 9 4.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 12px;
    }
    html.dpp-polish .page-inner textarea {
      padding: 8px 10px;
    }
    html.dpp-polish .page-inner .resizable-textarea textarea {
      border-radius: var(--dpp-radius-control) var(--dpp-radius-control) 0 0;
    }
    html.dpp-polish .page-inner .resizable-textarea .grippie {
      border: 1px solid var(--dpp-control-line);
      border-top: 0;
      border-radius: 0 0 var(--dpp-radius-control) var(--dpp-radius-control);
    }
    html.dpp-polish .page-inner .filter-wrapper {
      border-radius: var(--dpp-radius-control);
    }
    html.dpp-polish .page-inner :is(input, select, textarea):focus-visible {
      outline: 2px solid #0678be;
      outline-offset: 1px;
    }

    html.dpp-polish .page-inner input.form-submit,
    html.dpp-polish .page-inner a.primary-button,
    html.dpp-polish .page-inner a.button-link,
    html.dpp-polish .page-inner input[type="file"]::file-selector-button {
      box-sizing: border-box;
      height: var(--dpp-control-height);
      padding: 0 16px;
      border-radius: var(--dpp-radius-control);
      font-size: 14px;
      line-height: calc(var(--dpp-control-height) - 4px);
    }
    html.dpp-polish .page-inner :is(a.primary-button, a.button-link) {
      display: inline-block;
      text-align: center;
    }
    html.dpp-polish #block-drupalorg-issue-contribution-record .block-inner {
      padding-inline: 0;
    }
    html.dpp-polish #homebox .homebox-portlet .portlet-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }
    html.dpp-polish #homebox .homebox-portlet .portlet-header .portlet-title {
      flex: 1;
      order: -1;
    }
    html.dpp-polish #homebox .homebox-portlet .portlet-header .portlet-icon {
      float: none;
      margin: 0;
    }
    html.dpp-polish .homebox-portlet-inner a.button-link {
      margin-top: 8px;
    }
    html.dpp-polish .homebox-portlet-inner li > strong + .item-list {
      margin-top: 8px;
      padding-left: 12px;
      border-left: 2px solid var(--dpp-line);
    }
    html.dpp-polish .page-inner input[type="file"]::file-selector-button {
      border: 1px solid var(--dpp-control-line);
      background: transparent;
      color: inherit;
      margin-right: 10px;
      cursor: pointer;
    }
  `;

  function set(name, on) {
    const { cacheKey, className } = OPTIONS[name];
    document.documentElement.classList.toggle(className, on);
    try {
      localStorage.setItem(cacheKey, on ? '1' : '0');
    } catch {
      // Storage can be blocked; the class is still set.
    }
  }

  const style = document.createElement('style');
  style.id = 'dpp-layout';
  style.textContent = CSS;
  document.documentElement.appendChild(style);

  for (const { cacheKey, className } of Object.values(OPTIONS)) {
    try {
      document.documentElement.classList.toggle(className, localStorage.getItem(cacheKey) === '1');
    } catch {
      // No cache yet, or storage is blocked.
    }
  }

  chrome.storage.sync.get({ wide: false, polish: false }, (stored) => {
    for (const name of Object.keys(OPTIONS)) set(name, stored[name]);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const name of Object.keys(OPTIONS)) {
      if (changes[name]) set(name, changes[name].newValue);
    }
  });
})();
