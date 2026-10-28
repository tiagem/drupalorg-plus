<img src="icons/drupal-logo.svg" alt="" width="48">

# Drupal++

Fullscreen image gallery, a dark theme, and reading tools for [drupal.org](https://www.drupal.org). Each one can be turned off in the popup. Load the folder unpacked from `chrome://extensions`.

**Appearance.** Light, Dark, or System. System follows the operating system.

**Wide layout.** Off by default. Pages run up to 1280px wide instead of stopping at 960px. Issue lists use the full width.

**Visual polish.** Off by default. One set of corners, heights and lines across the site: text fields, selects and buttons share a height and radius, selects get a roomier arrow, sidebar blocks, form sections, release boxes and dashboard blocks share a radius, and comments get a single line between them. The issue form's fields sit on an even grid, user profiles get three aligned columns, issue and comment text is larger, and in issue lists the filters stay on one row, the title gets more room and dates stay on one line. Colors are untouched, so the dark theme still applies.

**Image gallery.** Click an image to open it fullscreen.

**Issue reading.** The issue page gets wider, and the sidebar stays put while you scroll. The status, related issues, and contribution record stay in that column. When you are logged in, the comment form stays under the comments.

**Copy.** Copy link copies only the page address. Code blocks get a Copy button. Commit messages are left alone.

![Issue page with the sticky sidebar and copy buttons](.github/screenshots/issue-reading.png)

**API docs.** On [api.drupal.org](https://api.drupal.org), the side navigation stays fixed while you scroll.

![API page with the navigation fixed on the side](.github/screenshots/api-nav.png)

**Mentions.** An @name in an issue or a comment links to that person's profile and gets a blue highlight. When you are logged in and someone mentions you, the highlight is amber instead. Doc tags such as `@param` and anything inside code are left alone.

**Newest first.** Off by default. Comments, and the merge request activity between them, run from the latest to the oldest. Turning it off puts them back in their original order.

**Keyboard.** `j` and `k` move between comments.

![An issue in dark mode](.github/screenshots/dark-issue.png)

![The image gallery](.github/screenshots/gallery-issue.png)

![A project page in dark mode](.github/screenshots/dark-project.png)

<img src=".github/screenshots/popup-light.png" alt="Settings in light mode" width="300"> <img src=".github/screenshots/popup-dark.png" alt="Settings in dark mode" width="300">

[MIT](LICENSE). Drupal and the Drupal logo are trademarks of Dries Buytaert.
