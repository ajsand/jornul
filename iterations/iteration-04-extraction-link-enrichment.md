# Iteration 04 — Extraction + Multi-Link Enrichment Quality Pass

## Why this iteration exists
Improve extraction fidelity and robust handling of multi-link capture so downstream tagging and vault search become useful.

## Architecture alignment (must honor)
- Schema references must align with CLAUDE.md §6: `items`, `media_files`, `normalized_text`, `jobs`, `sync_sessions`, and `session_ledger`.
- Extraction feeds taxonomy quality.
- Cloud optionality must not block local flow.
- Pipeline must still work offline.

## Claude Opus 4.5 implementation contract
1. Improve local extraction first.
2. Add optional cloud enrichment hook behind explicit gating.
3. Persist extraction provenance and confidence where possible.

## Scope
### 1) Multi-link parsing + dedupe
- Parse all URLs from text bodies.
- Canonicalize + dedupe links per item.
- Preserve original ordering for UI relevance.

### 2) Local extraction adapters
- Improve per-kind extraction handlers for:
  - text notes
  - links metadata
  - file text/OCR/ASR where available
- Store extraction artifacts with source/type/version fields.

### 3) Optional enrichment hooks
- Add gateway-ready interfaces for link enrichment, but keep offline fallback path.
- Ensure failed network calls do not fail item creation.

### 4) Inbox/Vault UX touchups
- Show extraction completion badge/summary.
- Surface extraction errors with retry action.

## Acceptance criteria
- Parse all URLs found in input text and support many URLs per item.
- Multi-link notes produce distinct `item_links` records deterministically.
- For each URL when online, fetch HTML with timeout controls and extract OpenGraph fields plus oEmbed when supported.
- Title synthesis is deterministic:
  - single URL input: use the extracted page title.
  - multi-URL input: generate a compact topic-cluster title.
- Tag output quality constraints are enforced:
  - noun/phrase focused tags.
  - allow multi-word entities/topics.
  - reject low-signal adjective/verb fragments.
- Multi-link notes update canonical `items` metadata and any related `normalized_text` segments deterministically.
- Local extraction succeeds without network access.
- Offline behavior derives provisional metadata from hostname/path tokens and enqueues a `needs_enrichment` retry job in the `jobs` table.
- Enrichment failures degrade gracefully.

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
- tests for URL canonicalization/dedupe with many-link inputs
- tests for extraction storage writes
- tests that online enrichment fetches timed HTML and persists OpenGraph/oEmbed fields per URL
- tests that offline path derives provisional metadata and enqueues `needs_enrichment` in `jobs`
- tests for deterministic title synthesis for single URL vs multi-URL inputs
- tests that tag filtering allows noun phrases/multi-word entities and rejects low-signal adjective/verb fragments
- tests for deterministic retry behavior (rerun workers without duplicate `needs_enrichment` jobs/results)
- manual online run
- manual offline run
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Reliable extraction layer + multi-link enrichment readiness.
