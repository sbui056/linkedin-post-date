const DEFAULTS = {
  showDates: true,
  dateFormat: 'short',
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(Object.keys(DEFAULTS), (existing) => {
    const toSet = {};
    for (const [key, value] of Object.entries(DEFAULTS)) {
      if (!(key in existing)) toSet[key] = value;
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.sync.set(toSet);
    }
  });
});
