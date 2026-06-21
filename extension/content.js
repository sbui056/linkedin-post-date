(() => {
  // ── Core timestamp algorithm (from shared/timestamp.js) ──────────────
  const LINKEDIN_FOUNDED_MS = new Date('2003-01-01').getTime();

  function extractActivityId(input) {
    if (!input || typeof input !== 'string') return null;
    input = input.trim();
    if (/^\d{19,20}$/.test(input)) return input;
    const patterns = [
      /urn:li:activity:(\d{19,20})/,
      /urn:li:ugcPost:(\d{19,20})/,
      /fsd_comment:(\d{19,20})/,
      /activity[:\-](\d{19,20})/,
      /(\d{19,20})/,
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function activityIdToTimestamp(id) {
    if (!id) return null;
    try {
      const binary = BigInt(id).toString(2);
      if (binary.length < 41) return null;
      const ms = parseInt(binary.slice(0, 41), 2);
      if (ms <= LINKEDIN_FOUNDED_MS || ms > Date.now() + 86400000) return null;
      return ms;
    } catch { return null; }
  }

  function formatDate(ms, format) {
    const date = new Date(ms);
    if (format === 'iso') return date.toISOString().split('T')[0];
    const opts = format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, opts);
  }

  function formatDateFull(ms) {
    return new Date(ms).toLocaleString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
    });
  }

  // ── Settings ─────────────────────────────────────────────────────────
  let settings = {
    showDates: true,
    copyCleanUrl: true,
    autoExpand: false,
    hidePromoted: false,
    dateFormat: 'short',
  };
  const hiddenPromotedUrns = new Set();

  chrome.storage.sync.get(settings, (stored) => {
    settings = { ...settings, ...stored };
    processAll();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const [key, { newValue }] of Object.entries(changes)) {
      settings[key] = newValue;
    }
    if ('showDates' in changes && !settings.showDates) {
      document.querySelectorAll('.lpt-date-badge').forEach(el => el.remove());
      document.querySelectorAll('[data-lpt-date]').forEach(el => el.removeAttribute('data-lpt-date'));
    }
    if ('copyCleanUrl' in changes && !settings.copyCleanUrl) {
      document.querySelectorAll('.lpt-copy-btn').forEach(el => el.remove());
      document.querySelectorAll('[data-lpt-copy]').forEach(el => el.removeAttribute('data-lpt-copy'));
    }
    if ('hidePromoted' in changes && !settings.hidePromoted) {
      document.querySelectorAll('[data-lpt-promoted]').forEach(el => {
        el.style.removeProperty('display');
        el.removeAttribute('data-lpt-promoted');
      });
      hiddenPromotedUrns.clear();
      try { chrome.runtime.sendMessage({ type: 'setPromotedCount', count: 0 }); } catch {}
    }
    processAll();
  });

  // ── Feature 1: Exact Post Dates ─────────────────────────────────────
  function processPostDates() {
    if (!settings.showDates) return;

    // Strategy 1: Find links containing activity URNs
    const activityLinks = document.querySelectorAll(
      'a[href*="/feed/update/urn:li:activity:"]:not([data-lpt-date]), ' +
      'a[href*="/feed/update/urn:li:ugcPost:"]:not([data-lpt-date])'
    );

    activityLinks.forEach(link => {
      const id = extractActivityId(link.href);
      if (!id) return;
      const ms = activityIdToTimestamp(id);
      if (!ms) return;

      // Find the timestamp text within this link or its parent
      const timestampSpan = link.querySelector('span.visually-hidden') ||
                           link.querySelector('span[aria-hidden="true"]') ||
                           link;

      if (link.closest('[data-lpt-date]')) return;

      const container = link.closest('.update-components-actor__sub-description-link') ||
                       link.closest('.feed-shared-actor__sub-description') ||
                       link.parentElement;
      if (container) container.setAttribute('data-lpt-date', '');

      const badge = document.createElement('span');
      badge.className = 'lpt-date-badge';
      badge.textContent = formatDate(ms, settings.dateFormat);
      badge.title = formatDateFull(ms);
      link.setAttribute('data-lpt-date', '');

      link.after(badge);
    });

    // Strategy 2: data-urn attributes on containers
    document.querySelectorAll('[data-urn*="urn:li:activity:"]:not([data-lpt-date-container])').forEach(el => {
      const urn = el.getAttribute('data-urn');
      const id = extractActivityId(urn);
      if (!id) return;
      const ms = activityIdToTimestamp(id);
      if (!ms) return;

      el.setAttribute('data-lpt-date-container', '');

      // Find a timestamp-like element inside
      const timeEl = el.querySelector('time') ||
                    el.querySelector('a[href*="/feed/update/"]');
      if (!timeEl || timeEl.querySelector('.lpt-date-badge') || timeEl.nextElementSibling?.classList?.contains('lpt-date-badge')) return;

      const badge = document.createElement('span');
      badge.className = 'lpt-date-badge';
      badge.textContent = formatDate(ms, settings.dateFormat);
      badge.title = formatDateFull(ms);
      timeEl.after(badge);
    });

    // Strategy 3: URL-based for single post pages
    if (/\/(feed\/update|posts)\//.test(window.location.pathname)) {
      const pageId = extractActivityId(window.location.href);
      if (pageId && !document.querySelector('.lpt-page-date')) {
        const ms = activityIdToTimestamp(pageId);
        if (ms) {
          const headerArea = document.querySelector('.feed-shared-update-v2__description-wrapper') ||
                            document.querySelector('.update-components-actor__sub-description');
          if (headerArea && !headerArea.querySelector('.lpt-date-badge')) {
            const badge = document.createElement('span');
            badge.className = 'lpt-date-badge lpt-page-date';
            badge.textContent = formatDate(ms, settings.dateFormat);
            badge.title = formatDateFull(ms);
            headerArea.appendChild(badge);
          }
        }
      }
    }
  }

  // ── Feature 2: Copy Clean Post URL ──────────────────────────────────
  function processCopyButtons() {
    if (!settings.copyCleanUrl) return;

    const postContainers = document.querySelectorAll(
      '.feed-shared-update-v2:not([data-lpt-copy]), ' +
      '[data-urn*="urn:li:activity:"]:not([data-lpt-copy])'
    );

    postContainers.forEach(container => {
      container.setAttribute('data-lpt-copy', '');

      // Find the activity ID for this post
      const urnAttr = container.getAttribute('data-urn');
      const activityLink = container.querySelector('a[href*="/feed/update/urn:li:activity:"]');
      const idSource = urnAttr || (activityLink && activityLink.href);
      const id = extractActivityId(idSource);
      if (!id) return;

      // Find the social actions bar
      const actionsBar = container.querySelector('.feed-shared-social-actions') ||
                        container.querySelector('.social-details-social-actions');
      if (!actionsBar) return;

      const btn = document.createElement('button');
      btn.className = 'lpt-copy-btn';
      btn.title = 'Copy clean post URL';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '9'); rect.setAttribute('y', '9');
      rect.setAttribute('width', '13'); rect.setAttribute('height', '13');
      rect.setAttribute('rx', '2'); rect.setAttribute('ry', '2');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
      svg.appendChild(rect);
      svg.appendChild(path);
      const label = document.createElement('span');
      label.className = 'lpt-copy-label';
      label.textContent = 'Copy link';
      btn.appendChild(svg);
      btn.appendChild(label);

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cleanUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${id}/`;
        try {
          await navigator.clipboard.writeText(cleanUrl);
          btn.classList.add('lpt-copy-success');
          btn.querySelector('.lpt-copy-label').textContent = 'Copied!';
          setTimeout(() => {
            btn.classList.remove('lpt-copy-success');
            btn.querySelector('.lpt-copy-label').textContent = 'Copy link';
          }, 2000);
        } catch {
          // Fallback
          const ta = document.createElement('textarea');
          ta.value = cleanUrl;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          btn.classList.add('lpt-copy-success');
          setTimeout(() => btn.classList.remove('lpt-copy-success'), 2000);
        }
      });

      actionsBar.appendChild(btn);
    });
  }

  // ── Feature 3: Auto-Expand "See More" ───────────────────────────────
  function processAutoExpand() {
    if (!settings.autoExpand) return;

    const seeMoreButtons = document.querySelectorAll(
      '.feed-shared-inline-show-more-text button:not([data-lpt-expanded]), ' +
      'button.see-more:not([data-lpt-expanded]), ' +
      '[data-test-id="inline-show-more-text__button"]:not([data-lpt-expanded])'
    );

    seeMoreButtons.forEach(btn => {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('see more') || text.includes('more') || text === '…more') {
        btn.setAttribute('data-lpt-expanded', 'true');
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });
  }

  // ── Feature 4: Hide Promoted Posts ──────────────────────────────────
  function processPromotedPosts() {
    if (!settings.hidePromoted) return;

    const allPosts = document.querySelectorAll(
      '.feed-shared-update-v2:not([data-lpt-promoted]), ' +
      '[data-urn*="urn:li:activity:"]:not([data-lpt-promoted])'
    );

    allPosts.forEach(post => {
      const promotedLabel = post.querySelector('.update-components-actor__sub-description .update-components-actor__supplementary-actor-info') ||
                           post.querySelector('[data-test-id="actor-supplementary-text"]');

      const allSpans = post.querySelectorAll('.update-components-actor__sub-description span, .feed-shared-actor__sub-description span');
      let isPromoted = false;
      allSpans.forEach(span => {
        const t = span.textContent.trim().toLowerCase();
        if (t === 'promoted' || t === 'sponsored') isPromoted = true;
      });

      if (promotedLabel) {
        const t = promotedLabel.textContent.trim().toLowerCase();
        if (t === 'promoted' || t === 'sponsored') isPromoted = true;
      }

      post.setAttribute('data-lpt-promoted', isPromoted ? 'hidden' : 'visible');

      if (isPromoted) {
        post.style.display = 'none';
        const urn = post.getAttribute('data-urn') || post.querySelector('[data-urn]')?.getAttribute('data-urn') || Math.random().toString();
        hiddenPromotedUrns.add(urn);
        try { chrome.runtime.sendMessage({ type: 'setPromotedCount', count: hiddenPromotedUrns.size }); } catch {}
      }
    });
  }

  // ── Main processor ──────────────────────────────────────────────────
  function processAll() {
    processPostDates();
    processCopyButtons();
    processAutoExpand();
    processPromotedPosts();
  }

  // ── MutationObserver (debounced) ────────────────────────────────────
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processAll, 150);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Handle SPA navigation
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(processAll, 500);
    }
  });
  urlObserver.observe(document.querySelector('title') || document.documentElement, {
    childList: true, subtree: true, characterData: true,
  });

  // Initial processAll() is triggered by the chrome.storage.sync.get callback above.
  // MutationObserver handles subsequent DOM changes.
})();
