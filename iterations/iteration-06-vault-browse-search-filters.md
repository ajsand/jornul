# Iteration 06 — Vault: High-Utility Browse, Search, and Filters

## Why this iteration exists
Transform stored content into a usable personal knowledge vault with fast retrieval.

## Architecture alignment (must honor)
- Vault sits on local-first metadata.
- Search/filter should work offline.
- Must leverage content + taxonomy domains.

## Claude Opus 4.5 implementation contract
1. Deliver performant local querying with predictable sort/filter behavior.
2. Ensure empty/loading/error states are polished.
3. Add tests for query correctness.

## Scope
### 1) Query model + indexing
- Add/optimize local indexes for common queries.
- Implement combined filtering by:
  - kind/source/date
  - tags/themes
  - ready/failed status
- Add full-text-like query strategy appropriate for SQLite setup.

### 2) Vault UI
- Search bar + advanced filter panel.
- Saved filter presets.
- Result grouping options (date/theme/tag).

### 3) Item detail enhancements
- Show extracted snippets, links, and taxonomy context.
- Add quick actions: retag, retry extraction, open source.

### 4) Performance budget
- Set and validate scrolling/search latency targets.
- Add memoization/virtualization where needed.

## Acceptance criteria
- Searches and filters return correct results and remain responsive.
- User can pivot from result to item detail with full context.

## Verification checklist
- query correctness tests
- manual performance sanity on large local dataset
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Production-grade Vault retrieval UX.
