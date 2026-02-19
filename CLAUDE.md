# CLAUDE.md

This file provides implementation guidance to Claude Code when working in this repository.

## Project Overview (Current Design)

JournalLink is a **local-first** Expo mobile app (iOS/Android primary) for capturing notes/media/links and browsing a personal vault. It adds:

1. **Fast capture** (Scratch + OS share intake)
2. **AETS emergent tagging** (user-specific tags/themes)
3. **Swipe deck** (preference bootstrap)
4. **In-person QR sync** with strict consent + minimized compare capsules
5. **Cloud AI Gateway** (AI works for all users without BYOK)
6. **Optional later OpenClaw integration** as an additive connector (never a core dependency)

## Priority Product Constraints

- **Local-first default**: SQLite + local files are primary; core capture/browse works offline.
- **AI for all users**: cloud AI is routed through JournalLink Gateway using app auth/subscription, not end-user provider keys.
- **Strict minimization and consent**: only minimized capsules/excerpts may leave device, and only after explicit consent.
- **QR-first sync**: QR signature exchange is the baseline transport. Do not block roadmap on BLE/P2P upgrades.

## Source of Truth

When in conflict, prioritize:
1. This file
2. `docs/ARCHITECTURE.md`
3. `docs/PRODUCT.md`
4. `docs/ROADMAP.md`
5. Iteration docs in `iterations/`

## Development Commands

```bash
# Start dev server
npx expo start

# Lint
npx expo lint

# Type-check
npx tsc --noEmit

# Web export sanity
npx expo export --platform web

# Install dependencies
npm install --legacy-peer-deps
```

## Architecture Guidance

### App Structure
- `app/` — Expo Router screens/tabs
- `lib/storage/` — SQLite schema, migrations, repositories
- `lib/ingest/` or related pipeline modules — detect/normalize/extract/tag/theme
- `lib/store/` — Zustand app state
- `lib/sync/` — QR signature exchange, consent session handling, capsule building
- `lib/ai/` — local fallback logic + cloud gateway client + schema validation

### Data Model Direction
Use/extend schema toward these entities:
- `items`, `item_links`, `files`, `extractions`
- `tags`, `tag_assignments`, `themes`, `theme_members`
- `swipe_catalog`, `swipe_sessions`, `swipe_events`
- `signatures`, `pending_sessions`, `session_ledger`, `compare_sessions`, `insight_cards`

Prefer additive migrations over destructive changes.

### Capture + Ingestion
Implement deterministic resumable stages:
1. detect
2. normalize
3. extract
4. tag (AETS)
5. theme refresh
6. mark ready

Scratch save must be immediate; enrichment can complete asynchronously.

## AI Architecture Rules

- **Do not implement BYOK provider key UX as primary flow.**
- App sends minimized payloads to **JournalLink Gateway** endpoints (auth required).
- Gateway handles provider routing, quotas, redaction/minimization gates.
- Insight responses must be schema-validated JSON before rendering.
- Keep robust local fallback insights when offline / gateway unavailable.

## Sync + Consent Rules

- QR signature exchange is required and should remain reliable.
- Consent must precede any cloud compare request.
- Sensitive content is excluded by default.
- Ledger what was shared at metadata level (counts/types), not raw private payload storage.

## Privacy & Security Rules (Critical)

- Never log raw note text, extracted text, or compare capsule body.
- Do not persist secrets in plaintext storage.
- Prefer short-lived tokens for gateway auth/session exchange.
- Keep “what was shared” transparency visible in UI.

## Expo / Native Strategy

- Expo Router is standard navigation approach.
- Share intake requires native extension/intent plumbing (dev builds/config plugins or stable library).
- Avoid introducing heavy native dependencies early unless tied to roadmap phase.

## Coding Expectations

- TypeScript strict mode; avoid `any` unless justified inline.
- Keep changes iteration-sized and testable.
- Add/update migrations and repository tests when schema changes.
- Prefer deterministic behavior over clever heuristics in core pipeline.

## Testing Expectations

At minimum for relevant changes:
- `npx expo lint`
- `npx tsc --noEmit`
- Targeted runtime sanity for touched flows (capture/vault/sync/insights)

If a check cannot run due to environment limitations, clearly report it.
