# Current State Report (Architecture-Aligned)

**Last updated:** 2026-02-19
**Status:** Active development — Iteration 01 complete

## Iteration 01 — Foundation: Local-First Core + Baseline App Shell

**Completed:** 2026-02-19

### What was added

- **Migration 7**: 7 new tables — `item_links`, `files`, `extractions`, `themes`, `theme_members`, `signatures`, `insight_cards` — with full indexes on FK and filter columns.
- **Migration 8**: `ingest_status` column on `media_items` (`saved|enriching|tagging|ready|failed`); existing rows backfilled to `ready`.
- **Type updates**: `ItemIngestStatus`, `ExtractionStage`, `InsightKind`, `InsightSource` enums; full interfaces + Input/Filter types for all 7 new entities; `MediaItem`, `CreateMediaItemInput`, `UpdateMediaItemInput` updated with `ingest_status`.
- **6 new repositories**: `itemLinksRepo`, `filesRepo`, `extractionsRepo`, `themesRepo`, `signaturesRepo`, `insightCardsRepo` — all exported from `repositories/index.ts`.
- **`itemsRepo` updates**: `ingest_status` included in INSERT and UPDATE field-builder.
- **`useJournalStore` migration**: items typed as `MediaItemWithTags[]`; added `ingestStatusMap`, `updateItem`, `setIngestStatus`; fixed `filteredItems` tag comparison (`tag.name` not string includes).
- **`useSettingsStore` updates**: added `cloudEnabled` (default `false`), `diagnosticsEnabled` (default `false`), `isHydrated` (default `false`), and `hydrateFromMeta` bulk hydrator.
- **Settings persistence**: `app/_layout.tsx` hydrates settings from `user_meta` on boot; `settings.tsx` persists each toggle to `user_meta` via `INSERT OR REPLACE`.
- **New settings UI**: Cloud AI and Diagnostics toggles added to settings screen.
- **Screen hardening**: `scratch.tsx` — DB init loading/error guard; `sync.tsx` — error state on init failure; `swipe.tsx` — error state on session init failure.
- **Tests**: 3 new integration test files covering `itemLinksRepo`, `extractionsRepo`, `themesRepo`.

### Deferred decisions

- Cloud gateway API contracts and auth flow (iteration 10)
- BLE/P2P transport upgrade beyond QR baseline (iteration 12+)

## Executive Summary

The codebase has been consolidated around the updated architecture:

- Local-first capture and vault workflows remain the default operating mode.
- Deterministic ingest, AETS tagging, swipe ranking, and sync/consent building blocks exist in the repository structure.
- QR-first compare/session flow remains the required baseline transport.
- Cloud AI is treated as an optional boundary and must pass through a first-party gateway contract.

## Implemented Foundations

- Expo Router app shell with tabbed flows for inbox/scratch/library/swipe/sync/settings.
- SQLite + file storage data layer with repositories, migrations, and tests.
- Service layer modules for ingest, AETS, swipe ranking, and background jobs.
- Sync/signature utilities and consent/capsule-related components.

## Gaps to Close (Near-Term)

1. Tighten ingest status UX consistency across Inbox/Library detail surfaces.
2. Expand test coverage for end-to-end ingest + consent/capsule boundaries.
3. Harden privacy checks around logging, payload minimization, and secret handling.
4. Validate cloud gateway contracts with schema-validated responses only.

## Operational Checks

Use these as the default health checks for every major change:

```bash
npm run lint
npm run typecheck
npm run test
```

Optional build sanity:

```bash
npm run build:web
```

## Documentation Hygiene

Repository-level historical one-off verification markdown files were removed in favor of durable docs under `docs/` plus iteration plans under `iterations/`.
