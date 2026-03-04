# GateOverflow GATE Prep – Chrome Extension

![GitHub issues](https://img.shields.io/github/issues/amnindersingh12/gate-overflow-enhancer)
![GitHub PRs](https://img.shields.io/github/issues-pr/amnindersingh12/gate-overflow-enhancer)
![License](https://img.shields.io/github/license/amnindersingh12/gate-overflow-enhancer)
![Good First Issues](https://img.shields.io/github/issues/amnindersingh12/gate-overflow-enhancer/good%20first%20issue?color=7057ff&label=good%20first%20issues)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)

> **After pushing to GitHub, replace `amnindersingh12` in all badge URLs with your GitHub username.**

A Chrome extension (Manifest V3) that enhances [GateOverflow.in](https://gateoverflow.in) with personal tagging, advanced filtering, and quiz features for GATE preparation.

## Features

### 🏷️ In-Page Tagging (Content Script)
- **Custom tags** – Add personal tags like "must-revise", "weak-topic", "easy" to any question
- **Mark type** – Toggle 1-mark / 2-mark designation
- **Difficulty rating** – 1–5 star difficulty rating
- **Priority** – Low / Medium / High (on detail pages)
- Automatically parses questions from list and detail pages

### 🔍 Advanced Filtering (Popup)
- Filter by GateOverflow tags and your custom tags
- AND/OR logic toggle
- Filter by subject, year range, difficulty
- Full-text search across titles and body snippets
- Clickable results that open questions on GateOverflow

### 🧠 Personal Quiz
- Start a quiz from any filtered set of questions
- Random selection of N questions
- Track correct / wrong / skipped
- Progress bar and stats summary

### 💾 Data Management
- All data stored locally via `chrome.storage.local`
- Export your data as JSON backup
- Import data from JSON file
- Manage custom tags in settings

## Build & Install

### Prerequisites
- Node.js 18+ and npm

### Build
```bash
cd gate-overflow-enhancer
npm install
npm run build
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Development (watch mode)
```bash
npm run dev
```

## Usage

1. **Browse GateOverflow** – Visit any questions page (e.g., `https://gateoverflow.in/questions?sort=gate`). The extension will automatically parse and store questions.
2. **Tag questions** – Use the toolbar that appears below each question to add custom tags, set difficulty, and mark type.
3. **Filter & Search** – Click the extension icon to open the popup. Use the Filter tab to find specific questions.
4. **Take a Quiz** – Apply filters, switch to the Quiz tab, and start a quiz session.
5. **Backup your data** – Use the Settings tab to export/import your data as JSON.

## Project Structure

```
gate-overflow-enhancer/
├── manifest.json                 # MV3 manifest
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Multi-entry build config
├── src/
│   ├── shared/
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── storage.ts            # chrome.storage helpers
│   │   └── constants.ts          # Subjects, tags, regex
│   ├── content/
│   │   ├── index.ts              # Content script entry
│   │   ├── parser.ts             # DOM parsers
│   │   ├── injector.ts           # UI injection
│   │   └── content.css           # Injected styles
│   ├── popup/
│   │   ├── popup.html            # Popup page
│   │   ├── popup.ts              # Popup logic
│   │   └── popup.css             # Popup styles
│   └── background/
│       └── service-worker.ts     # Background worker
└── public/icons/                 # Extension icons
```

## Technical Details

- **Manifest V3** – Uses service worker, not background pages
- **TypeScript** – Full type safety
- **Vite** – Fast builds with multi-entry output
- **No frameworks** – Vanilla TypeScript for minimal bundle size
- **No server changes** – Everything runs client-side as a browser overlay

---

## Contributing

Contributions are welcome! Whether you're a GATE aspirant with a feature idea or a developer looking for a bite-sized project:

- 🌱 **New to the project?** Check out [`good first issue`](../../labels/good%20first%20issue) labels
- 🐛 **Found a bug?** [Open a bug report](../../issues/new?template=bug_report.yml)
- 💡 **Have an idea?** [Open a feature request](../../issues/new?template=feature_request.yml)
- 🔧 **Ready to code?** Read [CONTRIBUTING.md](./CONTRIBUTING.md) then fork and PR

### Suggested GitHub Topics

After pushing to GitHub, go to your repository → **⚙ Settings** (gear icon near description) → add these topics to help others discover the project:

```
chrome-extension  browser-extension  manifest-v3  typescript
gate-exam  gate-preparation  gateoverflow  study-tool
vite  productivity
```
