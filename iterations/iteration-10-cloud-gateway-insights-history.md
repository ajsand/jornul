# Iteration 10 — Cloud AI Gateway Integration + Insights Rendering + History

## Why this iteration exists
Enable AI-powered enrichment/insights for all users via first-party gateway while preserving schema safety and local fallback behavior.

## Architecture alignment (must honor)
- No primary BYOK flow.
- App calls JournalLink Gateway endpoints only.
- Gateway response must be schema-validated JSON before render.

## Claude Opus 4.5 implementation contract
1. Build a typed gateway client with auth/session handling.
2. Enforce strict response schema validation.
3. Provide graceful local fallback when offline/gateway unavailable.

## Scope
### 1) Gateway client + auth/session
- Implement typed API client for:
  - auth/billing status
  - link enrichment
  - tagging assist
  - compare insights
- Add short-lived token handling strategy.

### 2) Insight schema validation
- Define zod/io-ts schemas for each gateway response.
- Reject malformed payloads and show safe fallback UI.

### 3) Insights rendering and evidence
- Render insight cards with confidence/rationale fields.
- Persist to `insight_cards` with provenance metadata.
- Add insight history view tied to compare session.

### 4) Offline and failure fallback
- Local heuristic insight fallback when cloud unavailable.
- Retry options and clear degraded-mode messaging.

## Acceptance criteria
- Valid gateway responses render correctly and persist.
- Invalid responses are blocked and handled safely.
- Offline mode still provides non-cloud fallback output.

## Verification checklist
- Mandatory quality-gate commands (run and pass):
  - `npx expo lint`
  - `npx tsc --noEmit`
  - `npm test` (or the repository's equivalent test command)
- Iteration-specific automated tests called out in this document.
- Explicit smoke suite (must pass before sign-off):
  - Web (quick UI pass): create entry, delete entry, tag assignment, library filters/search, swipe decision updates, preference view updates.
  - Android emulator (core flows): create entry, delete entry, tag assignment, library filters/search, swipe decision updates, preference view updates.
  - iOS simulator (core flows): create entry, delete entry, tag assignment, library filters/search, swipe decision updates, preference view updates.
- Warning: Do not treat web success as production readiness for native capture/sync flows.
## Deliverables
- Production-ready gateway integration with safe rendering.
