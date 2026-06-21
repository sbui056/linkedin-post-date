const DEFAULTS = {
  showDates: true,
  copyCleanUrl: true,
  autoExpand: false,
  hidePromoted: false,
  dateFormat: 'short',
};

const SETTINGS_KEYS = Object.keys(DEFAULTS);

const toggleMap = {
  showDates: 'toggle-showDates',
  copyCleanUrl: 'toggle-copyCleanUrl',
  autoExpand: 'toggle-autoExpand',
  hidePromoted: 'toggle-hidePromoted',
};

function init() {
  chrome.storage.sync.get(SETTINGS_KEYS, (settings) => {
    for (const [key, id] of Object.entries(toggleMap)) {
      const el = document.getElementById(id);
      if (el) el.checked = settings[key] ?? DEFAULTS[key];
    }

    const formatEl = document.getElementById('dateFormat');
    if (formatEl) formatEl.value = settings.dateFormat || DEFAULTS.dateFormat;

    updateDateFormatVisibility(settings.showDates ?? DEFAULTS.showDates);
  });

  for (const [key, id] of Object.entries(toggleMap)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('change', () => {
      chrome.storage.sync.set({ [key]: el.checked });
      if (key === 'showDates') updateDateFormatVisibility(el.checked);
    });
  }

  const formatEl = document.getElementById('dateFormat');
  if (formatEl) {
    formatEl.addEventListener('change', () => {
      chrome.storage.sync.set({ dateFormat: formatEl.value });
    });
  }

  chrome.runtime.sendMessage({ type: 'getPromotedCount' }, (response) => {
    if (chrome.runtime.lastError) return;
    const count = response?.count || 0;
    const countEl = document.getElementById('promotedCount');
    if (count > 0 && countEl) {
      countEl.textContent = `${count} hidden this session`;
      countEl.style.display = 'block';
    }
  });
}

function updateDateFormatVisibility(showDates) {
  const row = document.getElementById('dateFormatRow');
  if (row) row.style.display = showDates ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', init);
