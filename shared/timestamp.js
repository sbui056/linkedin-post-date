const LinkedInTimestamp = (() => {
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
      if (!isValidTimestamp(ms)) return null;
      return ms;
    } catch {
      return null;
    }
  }

  function isValidTimestamp(ms) {
    return ms > LINKEDIN_FOUNDED_MS && ms <= Date.now() + 86400000;
  }

  function formatDate(ms, format = 'short') {
    const date = new Date(ms);
    const formats = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      },
      iso: undefined,
    };

    if (format === 'iso') return date.toISOString().split('T')[0];
    return date.toLocaleDateString(undefined, formats[format] || formats.short);
  }

  function formatDateLong(ms) {
    return new Date(ms).toLocaleString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
      weekday: 'long',
    });
  }

  function getDateFromInput(input) {
    const id = extractActivityId(input);
    if (!id) return { error: 'Could not find a LinkedIn post ID' };
    const ms = activityIdToTimestamp(id);
    if (!ms) return { error: 'Could not extract a valid date from this ID' };
    return {
      id,
      timestamp: ms,
      date: new Date(ms),
      short: formatDate(ms, 'short'),
      long: formatDate(ms, 'long'),
      iso: formatDate(ms, 'iso'),
      full: formatDateLong(ms),
    };
  }

  return { extractActivityId, activityIdToTimestamp, formatDate, formatDateLong, getDateFromInput, isValidTimestamp };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkedInTimestamp;
}
