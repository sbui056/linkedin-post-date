vibe coded with claude code.

i can now see dates on linkedin without extra effort.

# LinkedIn Post Date

See the exact date and time of any LinkedIn post. Chrome extension + online tool.

LinkedIn shows vague timestamps like "2mo ago" instead of real dates. This extension fixes that by showing the actual date and time right next to every timestamp on the page.

## Features

- **Exact Post Dates** — Shows the real date and time inline next to every LinkedIn timestamp
- **Multiple formats** — Compact (6/18, 3:42 PM), detailed (Jun 18, 2026, 3:42 PM), or ISO
- **Hover for full date** — Hover any timestamp for the complete date with day of week
- **Works everywhere** — Main feed, company pages, school pages, individual posts

## Install

### Chrome Web Store
Coming soon.

### Load Unpacked (Development)
1. Clone this repo
2. Go to `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `extension/` folder
5. Visit LinkedIn — dates appear automatically

## Online Tool

Paste any LinkedIn post URL at [sbui056.github.io/linkedin-post-date](https://sbui056.github.io/linkedin-post-date/) to get the exact date — no extension needed. The online tool extracts the precise timestamp from the post's ID.

## How It Works

**Extension:** Reads the relative timestamps on LinkedIn ("2d", "3mo", "1w") and calculates the approximate date and time. Runs entirely in the browser with no network requests.

**Online tool:** Every LinkedIn post has a 19-digit ID (e.g., in the URL `urn:li:activity:7448012321190285313`). The first 41 bits of that number encode the Unix timestamp in milliseconds:

```javascript
const binary = BigInt(postId).toString(2);
const ms = parseInt(binary.slice(0, 41), 2);
const date = new Date(ms);
```

No API access required — the date is embedded in the ID itself.

## Privacy

- Zero data collection
- Zero network requests
- All processing happens locally in your browser
- Open source — read the code yourself

Full privacy policy: [store/privacy-policy.md](store/privacy-policy.md)

## License

MIT
