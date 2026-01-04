# Iteration 20 — Vault Browse: Faceted Filters + Fast Search
**Primary subagents:** journallink-mobile-ui, journallink-db  
**Support subagents:** journallink-aets, journallink-qa, journallink-architect

## Goal
Make the Vault truly usable:
- browse by media type, date, source
- filter by emergent tags/themes
- fast text search (and later semantic)

## Implementation Requirements
### A) Vault screen
- List/grid toggle
- Filter chips:
  - Media type
  - Tags (multi-select)
  - Date range
  - Source/domain
- Sort:
  - newest
  - oldest
  - recently updated

### B) DB queries
- Add indices for filter paths
- Avoid N+1: batch load tag chips per item

### C) Item detail
- Media preview
- Tag edit entry point
- “Show related” (same tags)

## Acceptance Criteria
- Filtering by 2+ tags works and is fast.
- Search returns results from title/text.
- Tag chips render correctly for all items.

## Verification Checklist
- Filter by “cooking” + “salmon” → expected subset
- Search “stoic” → returns matching items
- Open 20 items quickly → no lag spikes

## Commit
`feat(vault): faceted browsing + search + related items`
