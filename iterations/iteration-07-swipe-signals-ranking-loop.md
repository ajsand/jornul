# Iteration 07 — Swipe System: Catalog, Sessions, Preference Signals, Ranking

## Why this iteration exists
Build preference bootstrap loops that improve discovery relevance while staying transparent and local-first.

## Architecture alignment (must honor)
- Schema references must align with CLAUDE.md §6: `items`, `media_files`, `normalized_text`, `jobs`, `sync_sessions`, and `session_ledger`.
- Uses `swipe_catalog`, `swipe_sessions`, `swipe_events` domains.
- Signals support ranking and downstream insights.
- No opaque black-box behavior without inspectable rationale.

## Claude Opus 4.5 implementation contract
1. Implement deterministic session and event storage.
2. Add explainable ranking factors.
3. Keep UX fast and low-friction.

## Scope
### 1) Swipe catalog generation
- Build catalog candidates from local content + themes/tags.
- Add diversity constraints to avoid repetitive cards.

### 2) Session lifecycle
- Start/continue/end swipe sessions.
- Persist swipe events with timestamp and card metadata snapshot.

### 3) Ranking profile
- Convert swipe events into preference weights.
- Re-rank future catalog cards based on profile.
- Add decay/recentness handling.

### 4) Transparency UI
- Show “why this card” explanations.
- Add session stats/history views.

## Acceptance criteria
- Swipe actions persist reliably and influence future ranking.
- User can inspect session summaries and rationale.

## Verification checklist
- ranking unit tests
- session persistence integration tests
- manual swipe session sanity
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- End-to-end swipe preference learning loop.
