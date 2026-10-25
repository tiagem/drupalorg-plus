/**
 * Settings popup. Feature switches match the keys read in src/features.js.
 */
const DEFAULTS = {
  theme: 'system',
  lightbox: true,
  reading: true,
  copy: true,
  apiDocs: true,
  keys: true,
};

const themeInputs = document.querySelectorAll('input[name="theme"]');
const switches = [...document.querySelectorAll('.switch input')];

function render(stored) {
  const settings = { ...DEFAULTS, ...stored };
  for (const input of themeInputs) input.checked = input.value === settings.theme;
  for (const input of switches) input.checked = !!settings[input.name];
  document.documentElement.dataset.theme = settings.theme;
}

chrome.storage.sync.get(DEFAULTS, render);

for (const input of themeInputs) {
  input.addEventListener('change', () => {
    document.documentElement.dataset.theme = input.value;
    chrome.storage.sync.set({ theme: input.value });
  });
}

for (const input of switches) {
  input.addEventListener('change', () => {
    chrome.storage.sync.set({ [input.name]: input.checked });
  });
}
