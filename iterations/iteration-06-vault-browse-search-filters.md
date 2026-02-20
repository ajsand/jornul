# Iteration 06 — Vault: High-Utility Browse, Search, and Filters

## Why this iteration exists
Transform stored content into a usable personal knowledge vault with fast retrieval.

## Architecture alignment (must honor)
- Schema references must align with CLAUDE.md §6: `items`, `media_files`, `normalized_text`, `jobs`, `sync_sessions`, and `session_ledger`.
- Vault sits on local-first metadata.
- Search/filter should work offline.
- Must leverage content + taxonomy domains.

## Claude Opus 4.5 implementation contract
1. Deliver performant local querying with predictable sort/filter behavior.
2. Ensure empty/loading/error states are polished.
3. Add tests for query correctness.

## Scope
### 1) Query model + indexing
- Add/optimize local indexes for common queries, including:
  - `items(created_at)`
  - `items(kind, created_at)`
  - `items(source_domain)`
  - `tag_assignments(tag_id)`
  - `swipe_events(media_id, created_at)`
- Implement combined filtering by:
  - kind/source/date
  - tags/themes
  - ready/failed status
- Implement FTS with `items_fts(title, normalized_text)` plus trigger-based sync maintenance on item/text create/update/delete.

### 2) Vault UI
- Search bar + advanced filter panel.
- Saved filter presets.
- Result grouping options (date/theme/tag).

### 3) Item detail enhancements
- Show normalized text snippets, media file references, and taxonomy context.
- Add quick actions: retag, retry extraction, open source.

### 4) Performance budget
- Set and validate scrolling/search latency targets.
- Add memoization/virtualization where needed.

## Acceptance criteria
- Searches and filters return correct results and remain responsive.
- FTS results come from `items_fts(title, normalized_text)` and stay in sync via triggers.
- User can pivot from result to item detail with full context.

## Verification checklist
- query correctness tests
- manual performance sanity on large local dataset
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Production-grade Vault retrieval UX.
