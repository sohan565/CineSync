# CineSync — Social Watch Party Platform (v1.0 Pro)

> Watch videos together in sub-second synchronization with real-time text chat, floating emoji reactions, and WebRTC voice & video calls.

---

## 🌟 Key Features

- **Multi-Source Video Engine:** YouTube, YouTube Shorts, Direct MP4/WebM, HLS live streams (`.m3u8`), and local video file sync.
- **Ultra-Low Drift Sync:** NTP-style clock sync and adaptive playback rate scaling keeping participants within $\le 200\text{ms}$.
- **WebRTC Voice & Video:** High-quality peer-to-peer audio and video mesh with active speaker highlights and Push-to-Talk.
- **Rich Social Chat:** Virtualized chat, typing indicators, read receipts, pinned messages, and floating emoji combo multipliers.
- **Responsive PWA:** Touch gestures, swipe drawers, landscape view, and offline shell caching.
- **Zero Installation:** Runs entirely in evergreen desktop and mobile browsers.

---

## 📁 Documentation Repository Structure

```text
docs/
├── 01-Product/         # PRD, Vision, Goals, Success Metrics, Competitor Analysis
├── 02-Features/        # Auth, Room Management, Media Player, Sync, Chat, Voice/Video, etc.
├── 03-UX/              # User Flows, Wireframes, Navigation, Design System, UI Components
├── 04-Architecture/    # Technical & Realtime Architecture, WebRTC, Sync Engine, ADRs
├── 05-Database/        # DDL Database Schema, ERD, Tables, Indexes, RLS Policies, Migrations
├── 06-API/             # REST, Realtime, Events, Authentication, Validation, Error Codes
├── 07-Development/     # Coding Standards, Git Workflow, Testing, CI/CD, Roadmap
├── 08-AI/              # AI Coding Rules, Cursor/Claude Code setup, Master Prompt Library
└── 09-Testing/         # Test Cases, QA Checklist, Browser Matrix, Performance
```

---

## 🛠️ Quick Start

```bash
# Clone the repository
git clone https://github.com/cinesync/cinesync.git

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 📄 License

[MIT License](LICENSE)
