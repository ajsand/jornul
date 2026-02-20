# Iteration 01 — Foundation: Local-First Core + Baseline App Shell

## Why this iteration exists
Establish a stable local-first foundation that all later iterations build on: navigation shell, storage schema baseline, migrations, repositories, global state slices, and deterministic status modeling.

## Architecture alignment (must honor)
- Schema references must align with CLAUDE.md §6: `items`, `media_files`, `normalized_text`, `jobs`, `sync_sessions`, and `session_ledger`.
- Local-first is primary (SQLite + local media storage).
- Screens: Inbox, Scratch, Vault, Swipe, Sync, Settings.
- Data domains seeded: content, taxonomy, swipe, sync/consent.
- No cloud dependency for core app function.

## Claude Opus 4.5 implementation contract
1. Implement exactly the required scaffolding; avoid feature creep.
2. Keep all schema changes additive and migration-backed.
3. Add tests for storage + repositories introduced here.
4. Document any deferred decisions as explicit TODOs in docs/STATUS.md.

## Scope
### 1) App shell and routing
- Ensure Expo Router tab + stack structure supports:
  - Inbox, Scratch, Vault, Swipe, Sync, Settings
  - Item detail route
  - Import route placeholder
- Add safe loading/error states for each top-level screen.

### 2) Storage baseline
- Verify/create migrations for these tables (minimum columns + timestamps):
  - `items`, `media_files`, `normalized_text`, `jobs`
  - `tags`, `tag_assignments`, `themes`, `theme_members`
  - `swipe_catalog`, `swipe_sessions`, `swipe_events`
  - `sync_sessions`, `session_ledger`, consent/capsule metadata tables
- Ensure baseline indexes exist for:
  - `items(created_at)`
  - `items(kind, created_at)`
  - `items(source_domain)`
  - `tag_assignments(tag_id)`
  - `swipe_events(media_id, created_at)`
- Add forward-only migration numbering and migration test coverage.

### 3) Repository contracts
- Create/standardize typed repository APIs for each domain.
- Enforce deterministic status enums (e.g., `saved|enriching|tagging|ready|failed`).
- Add unit/integration repository tests for insert/read/update/list.

### 4) State slices (Zustand)
- Add or normalize slices:
  - `journal` (items + ingest status)
  - `syncSession` (consent/capsule flow + sync session states)
  - `settings` (privacy, cloud toggles, diagnostics)
- Ensure state hydration is resilient after app restart.

## Acceptance criteria
- Fresh install runs migrations cleanly with `items` + `media_files` + `normalized_text` + `jobs` and sync session schema.
- App boots with all 6 core tabs without crashing.
- Core repository CRUD passes tests.
- Offline mode still supports creating and listing local items.

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
- Updated migrations + repositories + store slices + minimal screen hardening.
- `docs/STATUS.md` entry summarizing what was completed and deferred.
