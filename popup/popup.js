/**
 * Settings popup: theme mode and the image gallery switch.
 */
const DEFAULTS = { theme: 'system', lightbox: true };

const themeInputs = document.querySelectorAll('input[name="theme"]');
const lightboxInput = document.querySelector('input[name="lightbox"]');

function render({ theme, lightbox }) {
  for (const input of themeInputs) input.checked = input.value === theme;
  lightboxInput.checked = lightbox;
  document.documentElement.dataset.theme = theme;
}

chrome.storage.sync.get(DEFAULTS, render);

for (const input of themeInputs) {
  input.addEventListener('change', () => {
    document.documentElement.dataset.theme = input.value;
    chrome.storage.sync.set({ theme: input.value });
  });
}

lightboxInput.addEventListener('change', () => {
  chrome.storage.sync.set({ lightbox: lightboxInput.checked });
});
