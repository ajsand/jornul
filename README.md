# JournalLink

JournalLink is a **local-first Expo app** for capturing notes/media/links, organizing them with emergent tags, learning preference signals through swipes, and running consent-based compare sessions with optional cloud insights.

This repository is aligned to the updated architecture in `docs/ARCHITECTURE.md`.

## Product Direction

- Local-first capture/browse/search must work offline.
- Ingest is deterministic and resumable (`detect → normalize → extract → tag → theme refresh → ready/failed`).
- QR signature exchange is the baseline sync transport.
- Cloud AI is optional per action and routed through a first-party gateway (no raw provider keys required for core flow).
- Compare and cloud actions require consent + payload minimization.

See:
- `docs/ARCHITECTURE.md`
- `docs/PRODUCT.md`
- `docs/ROADMAP.md`

## Current App Surface

- **Tabs:** Inbox, Scratch, Vault/Library, Swipe, Sync, Settings
- **Core modules:** ingest pipeline, AETS tagging, swipe ranking, consent/capsule builder, local insight rendering + optional gateway path
- **Storage:** SQLite metadata + local file storage

## Tech Stack

- Expo SDK 53 + React Native 0.79 + TypeScript
- Expo Router
- Zustand
- expo-sqlite + expo-file-system
- Jest + React Native Testing Library

## Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run verify
npm run build:web
```

## Documentation Map

- `docs/ARCHITECTURE.md` — source of truth for system design
- `docs/PRODUCT.md` — product principles and core user flows
- `docs/ROADMAP.md` — delivery order and iteration mapping
- `docs/DEV_WORKFLOW.md` — day-to-day development workflow
- `docs/testing.md` + `docs/QA.md` — automated and manual test guidance
- `docs/PRIVACY.md` — privacy/security constraints

## Notes for AI Coding Agents

`CLAUDE.md` contains implementation constraints and source-of-truth precedence for autonomous coding runs. Keep changes aligned with architecture docs and avoid introducing flows that conflict with local-first + consent-first principles.
