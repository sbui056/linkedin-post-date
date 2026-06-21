vibe coded with claude code.

i can now see dates on linkedin without extra effort.

# LinkedIn Post Date

See the exact date of any LinkedIn post. Chrome extension + online tool.

LinkedIn shows vague timestamps like "2mo ago" instead of real dates. This extension fixes that by decoding the exact creation date from each post's ID — no API calls, no servers, everything runs locally.

## Features

- **Exact Post Dates** — Shows the real date inline next to every LinkedIn timestamp
- **Copy Clean URL** — One-click copy of post links without tracking parameters
- **Auto-Expand Posts** — Automatically expands truncated "see more" text
- **Hide Promoted** — Removes sponsored posts from your feed

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

Paste any LinkedIn post URL at [sbui056.github.io/linkedin-post-date](https://sbui056.github.io/linkedin-post-date/) to get the exact date — no extension needed.

## How It Works

Every LinkedIn post has a 19-digit ID (e.g., in the URL `urn:li:activity:7448012321190285313`). The first 41 bits of that number encode the Unix timestamp in milliseconds:

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
