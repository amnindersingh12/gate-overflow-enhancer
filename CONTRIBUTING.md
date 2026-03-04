# Contributing to GateOverflow Enhancer

First off — thanks for taking the time to contribute! Whether you're a GATE aspirant who found a bug, or a developer who wants to add a feature, all contributions are welcome.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)

---

## Code of Conduct

Be respectful. This is a community project for students. Focus on constructive feedback and collaborative improvement.

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Open a [Bug Report issue](../../issues/new?template=bug_report.md). Include:
- Steps to reproduce
- What you expected vs what happened
- Browser version and OS
- Screenshots if relevant

### 💡 Suggesting Features

Open a [Feature Request issue](../../issues/new?template=feature_request.md). Describe the problem you're trying to solve — not just the solution.

### 🌱 Good First Issues

New to the codebase? Look for issues tagged [`good first issue`](../../labels/good%20first%20issue). These are scoped, well-documented, and beginner-friendly.

### 🔧 Fixing Bugs / Building Features

1. Check [open issues](../../issues) first — it may already be tracked
2. Comment on the issue to claim it
3. Fork → Branch → Code → PR

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- A Chromium-based browser (Chrome, Edge, Brave)

### Local Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/gate-overflow-enhancer.git
cd gate-overflow-enhancer

# Install dependencies
npm install

# Build the extension
npm run build
```

### Load in Chrome (for testing)

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder
4. Visit [gateoverflow.in](https://gateoverflow.in) to test

### Rebuild after changes

```bash
npm run build
```

Then click the refresh icon on the extension in `chrome://extensions/`.

---

## Project Structure

```
src/
├── background/         # Service worker (MV3)
├── content/            # Content scripts injected into GateOverflow pages
│   ├── index.ts        # Entry point
│   ├── parser.ts       # Parses question DOM
│   ├── injector.ts     # Injects toolbar UI
│   ├── filter-panel.ts # In-page filter panel
│   └── page-loader.ts  # Handles pagination
├── popup/              # Extension popup (filter, quiz, settings)
└── shared/             # Types, storage helpers, constants
```

Key architectural points:
- **No frameworks** — vanilla TypeScript only for minimal bundle size
- **Manifest V3** — service worker, not background page
- **All storage** via `chrome.storage.local` — no server, full privacy

---

## Submitting Changes

1. **Fork** the repository
2. Create a branch: `git checkout -b fix/issue-42` or `feat/quiz-timer`
3. Make your changes with clear, focused commits
4. Run a build to verify: `npm run build`
5. Open a **Pull Request** against `main`
6. Fill in the PR template

### Commit Message Format

```
type: short description (#issue)

Examples:
fix: prevent duplicate tags on re-parse (#12)
feat: add timer to quiz mode (#34)
docs: update build instructions
refactor: extract storage helpers to shared/
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## Style Guidelines

- **TypeScript** — always type your variables and function signatures
- **No `any`** — use specific types or generics
- **Avoid DOM frameworks** — keep it vanilla TS
- **Comment intent** — explain *why*, not *what*
- Prefer `const` over `let`; avoid `var`
- Use meaningful variable names; single-letter variables only in small loops

---

## Questions?

Open a [Discussion](../../discussions) or comment on a relevant issue. We're happy to help you get started.
