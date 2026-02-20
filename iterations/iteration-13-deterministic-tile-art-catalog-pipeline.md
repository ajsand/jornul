# Iteration 13 — Deterministic Tile Art + Catalog Pipeline

## Why this iteration exists
Large catalog views must remain fast, reliable, and visually consistent across devices while avoiding expensive on-device generation. This iteration establishes a build-time deterministic tile pipeline and a delta-sync contract so clients always resolve valid tile assets with cache-safe versioning.

## Architecture alignment (must honor)
- Tile art for catalog-scale surfaces is generated at build/publish time, not at runtime on-device.
- Determinism is required: identical ID/title/media-type inputs produce identical outputs.
- Catalog APIs remain source-of-truth for tile metadata and URI versioning.

## Claude Opus 4.5 implementation contract
1. Implement deterministic tile generation from a stable identifier hash.
2. Ensure clients only render from pre-generated tile assets for large catalog surfaces.
3. Define URI versioning and cache invalidation to support safe rollouts.
4. Align catalog delta sync behavior with `GET /v1/catalog`.

## Scope
### 1) Build-time deterministic tile generation
- Introduce/extend a build pipeline step that generates tile art from stable inputs:
  - stable item ID hash (primary seed)
  - normalized title initials
  - media type token/icon selector
  - optional deterministic pattern variant
- Deterministic visual composition rules:
  - color palette is selected from hash-derived index(es)
  - initials are normalized and consistently typeset
  - media-type icon is chosen from fixed mapping
  - optional pattern toggles from hash bit(s) and remains deterministic
- Output fixed target dimensions and formats suitable for catalog grids/cards (e.g., WebP/PNG variants as needed).

### 2) Runtime behavior: no large catalog tile generation on-device
- Remove/disable runtime generation path for catalog-scale tiles in swipe/list/grid surfaces.
- Client should only:
  - resolve `tile_uri` provided by catalog payload, or
  - use deterministic fallback URI/template when `tile_uri` is absent/invalid.
- Preserve lightweight placeholder/skeleton rendering while image loads; do not synthesize full tile art locally for catalog batches.

### 3) Asset storage, caching, and URI versioning strategy
- Store generated tiles in canonical object storage namespace (e.g., `tiles/{catalog_version}/{item_id_hash}.webp`).
- Define immutable-by-version addressing:
  - include version token in path or query (preferred path segment)
  - treat each version as immutable, long-cacheable (`Cache-Control: immutable, max-age=...`)
- Version bump triggers:
  - palette mapping changes
  - typography/icon mapping changes
  - composition algorithm changes
  - output format/dimension changes
- Document invalidation behavior:
  - clients receive new `tile_uri` when catalog/version changes
  - old assets remain cache-safe and can expire naturally

### 4) Catalog delta sync contract (`GET /v1/catalog`)
- Ensure API contract includes fields required for deterministic tile resolution:
  - `id`
  - `title`
  - `media_type`
  - `tile_uri` (preferred, versioned)
  - optional `tile_version` or global `catalog_version`
- Delta responses must include tile-relevant updates whenever any tile input or rendering version changes.
- Define client merge rules:
  - upsert changed/new items from delta
  - remove tombstoned items
  - treat changed `tile_uri` (or version field) as authoritative cache key rollover
- Document fallback contract when `tile_uri` is missing:
  - construct deterministic fallback URI from known version + ID hash
  - guarantee server-hosted fallback exists for active items

## Acceptance criteria
- Deterministic output: same `id` + normalized `title` + `media_type` always yields byte-identical tile output for a fixed tile generator version.
- Cache-safe invalidation/version bump behavior:
  - algorithm/style changes produce new versioned URI space
  - clients fetch fresh assets without stale-cache corruption
- Swipe cards and catalog views always resolve a valid tile:
  - primary `tile_uri` loads, or
  - deterministic fallback URI resolves to existing server asset.

## Verification checklist
- Deterministic render checks
  - run generator twice on identical fixture set and compare checksums (must match)
  - run cross-machine/container verification on same fixtures and compare checksums
  - verify normalization edge cases (unicode, whitespace, punctuation) produce stable initials
- Versioning/cache checks
  - simulate generator version bump and confirm URI changes for affected assets
  - validate old URIs remain retrievable during transition window
  - verify CDN/object-cache headers align with immutable versioned strategy
- Catalog delta application checks
  - replay baseline + delta sequence from `GET /v1/catalog` fixtures
  - verify upsert/delete merge outcomes and tile URI rollovers
  - validate missing/invalid `tile_uri` paths fall back to deterministic URI and load successfully

## Deliverables
- Build-time deterministic tile generation pipeline implementation + fixtures.
- Documented storage/versioning policy for tile assets.
- Updated `GET /v1/catalog` delta contract notes and client merge/fallback behavior.
- Verification artifacts proving deterministic output and correct delta application.
