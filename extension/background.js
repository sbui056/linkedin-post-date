const DEFAULTS = {
  showDates: true,
  copyCleanUrl: true,
  autoExpand: false,
  hidePromoted: false,
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

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'getPromotedCount') {
    chrome.storage.session.get('promotedCount', (data) => {
      sendResponse({ count: data.promotedCount || 0 });
    });
    return true;
  }
  if (msg.type === 'setPromotedCount') {
    chrome.storage.session.set({ promotedCount: msg.count });
  }
});
