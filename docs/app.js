// Core algorithm (from shared/timestamp.js)
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

// UI
const urlInput = document.getElementById('urlInput');
const extractBtn = document.getElementById('extractBtn');
const resultEl = document.getElementById('result');
const errorEl = document.getElementById('error');

function extract() {
  const input = urlInput.value.trim();
  resultEl.style.display = 'none';
  errorEl.style.display = 'none';

  if (!input) {
    showError('Please paste a LinkedIn post URL or activity ID.');
    return;
  }

  const id = extractActivityId(input);
  if (!id) {
    showError('Could not find a LinkedIn post ID in that input. Try pasting the full post URL.');
    return;
  }

  const ms = activityIdToTimestamp(id);
  if (!ms) {
    showError('Could not extract a valid date from this ID. Make sure it\'s a real LinkedIn post URL.');
    return;
  }

  document.getElementById('resultShort').textContent = formatDate(ms, 'short');
  document.getElementById('resultLong').textContent = formatDate(ms, 'long');
  document.getElementById('resultISO').textContent = formatDate(ms, 'iso');
  document.getElementById('resultID').textContent = id;
  resultEl.style.display = 'block';
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

extractBtn.addEventListener('click', extract);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') extract();
});

// Auto-extract on paste (use input event — fires after value updates)
urlInput.addEventListener('input', (e) => {
  if (e.inputType === 'insertFromPaste') extract();
});
