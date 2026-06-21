(() => {
  const RE = /^(\d+)\s*(s|m|h|d|w|mo|yr)\s*[•·]/;
  const NOW_RE = /^(just now|now)\s*[•·]/i;
  const UNITS = {s:1e3, m:6e4, h:36e5, d:864e5, w:6048e5, mo:2592e6, yr:31536e6};

  let showDates = true;
  let dateFormat = 'short';

  const FORMATS = {
    short: {month:'numeric', day:'numeric', hour:'numeric', minute:'2-digit'},
    long: {year:'numeric', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'},
    iso: {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false},
  };

  chrome.storage.sync.get(['showDates', 'dateFormat'], (s) => {
    if ('showDates' in s) showDates = s.showDates;
    if ('dateFormat' in s) dateFormat = s.dateFormat;
    process();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.showDates) showDates = changes.showDates.newValue;
    if (changes.dateFormat) {
      dateFormat = changes.dateFormat.newValue;
      document.querySelectorAll('[data-lpt-date]').forEach(el => el.removeAttribute('data-lpt-date'));
    }
    if (changes.showDates && !showDates) {
      document.querySelectorAll('[data-lpt-date]').forEach(el => {
        el.removeAttribute('data-lpt-date');
        el.removeAttribute('title');
      });
    }
    process();
  });

  function process() {
    if (!showDates) return;
    if (!/\/(feed|posts)(\/|$|\?)/.test(location.pathname)) return;

    const fmt = FORMATS[dateFormat] || FORMATS.short;

    document.querySelectorAll('span:not([data-lpt-date])').forEach(span => {
      const text = span.childNodes[0]?.nodeValue?.trim();
      if (!text) return;

      let date;
      const match = text.match(RE);
      if (match) {
        const ms = UNITS[match[2]];
        if (!ms) return;
        date = new Date(Date.now() - parseInt(match[1]) * ms);
      } else if (NOW_RE.test(text)) {
        date = new Date();
      } else {
        return;
      }

      span.setAttribute('data-lpt-date', date.toLocaleDateString(undefined, fmt));
      span.title = date.toLocaleString(undefined, {
        weekday:'long', year:'numeric', month:'long', day:'numeric',
        hour:'numeric', minute:'2-digit'
      });
    });
  }

  setInterval(process, 5000);
  setTimeout(process, 1000);
})();
