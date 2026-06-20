chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    showDates: true,
    copyCleanUrl: true,
    autoExpand: false,
    hidePromoted: false,
    dateFormat: 'short',
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
