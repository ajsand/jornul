# JournalLink (MVP)

JournalLink is a private, local-first journal + media vault that helps two people compare their “profiles” (built from journals + saved media) to generate conversation-ready insights. By default, everything is stored locally. Cloud AI is optional and opt-in per session.

## Core user flows (MVP)
1) Capture media fast (Quick Add / Inbox):
- Paste link/text or import files
- App stores and auto-tags with minimal user input

2) Browse & retrieve:
- Library list
- Filter by type, tag, date
- Search

3) Profile building (2 ways):
- Manual uploads (vault)
- Swipe Builder (associate / not associate with items) to build preferences fast

4) Compare Session (in-person):
- Pair with QR/short code
- Select Friend or Heart mode
- Choose topic scopes
- Consent gate: choose exactly what snippets/items are shared
- Generate Insight Card (local mock first; cloud optional)

## Privacy principles
- Local-first storage (SQLite for metadata, filesystem for files)
- No cloud calls unless user explicitly enables it for that compare session
- Cloud calls use minimized, redacted “Compare Capsule” (never upload full vault by default)
- Never log raw journal content
