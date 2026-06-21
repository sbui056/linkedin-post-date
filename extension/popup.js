const DEFAULTS = {
  showDates: true,
  dateFormat: 'short',
};

function init() {
  chrome.storage.sync.get(Object.keys(DEFAULTS), (settings) => {
    const toggle = document.getElementById('toggle-showDates');
    if (toggle) toggle.checked = settings.showDates ?? DEFAULTS.showDates;

    const formatEl = document.getElementById('dateFormat');
    if (formatEl) formatEl.value = settings.dateFormat || DEFAULTS.dateFormat;

    updateDateFormatVisibility(settings.showDates ?? DEFAULTS.showDates);
  });

  const toggle = document.getElementById('toggle-showDates');
  if (toggle) {
    toggle.addEventListener('change', () => {
      chrome.storage.sync.set({ showDates: toggle.checked });
      updateDateFormatVisibility(toggle.checked);
    });
  }

  const formatEl = document.getElementById('dateFormat');
  if (formatEl) {
    formatEl.addEventListener('change', () => {
      chrome.storage.sync.set({ dateFormat: formatEl.value });
    });
  }
}

function updateDateFormatVisibility(showDates) {
  const row = document.getElementById('dateFormatRow');
  if (row) row.style.display = showDates ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', init);
