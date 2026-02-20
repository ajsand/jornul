# Iteration 03 — Deterministic Ingest Pipeline (Detect→Normalize→Extract→Tag→Theme→Ready)

## Why this iteration exists
Formalize the ingest pipeline into deterministic resumable stages with durable state transitions and robust failure handling.

## Architecture alignment (must honor)
- Schema references must align with CLAUDE.md §6: `items`, `media_files`, `normalized_text`, `jobs`, `sync_sessions`, and `session_ledger`.
Pipeline stages per item:
1) detect, 2) normalize, 3) extract, 4) tag, 5) theme refresh, 6) ready/failed update.

## Claude Opus 4.5 implementation contract
1. Implement a strict finite-state machine with allowed transitions.
2. Persist stage checkpoints in storage.
3. Keep execution idempotent (safe to re-run same stage).

## Scope
### 1) Pipeline engine
- Define typed stage executor interface.
- Add stage orchestration with durable checkpoints.
- Record stage timing and failure reason codes.

### 2) Stage implementations
- `detect`: content kind, MIME, URL detection.
- `normalize`: canonical title/source normalization.
- `extract`: delegate to extraction services based on kind.
- `tag`: call local AETS baseline (improved in next iterations).
- `theme refresh`: incremental updates from tag graph.
- `ready/failed`: terminal status with diagnostics metadata.

### 3) Recovery + retries
- Stage-level retry policies.
- Poison-item protection (max retries then fail with reason).
- Resume from last successful stage after restart.

### 4) Developer diagnostics
- Add non-sensitive debug view or logs for stage lifecycle.
- Explicitly avoid raw content logging.

## Acceptance criteria
- Each item progresses through stages deterministically.
- Re-running pipeline does not duplicate `items`/`media_files`/`normalized_text` records, jobs, tags, or themes.
- Failed stage can be retried and continue from checkpoint.
- Parse all URLs found in input text and support many URLs per item.
- For each URL when online, fetch HTML with timeout controls and extract OpenGraph fields plus oEmbed when supported.
- Title synthesis is deterministic:
  - single URL input: use the extracted page title.
  - multi-URL input: generate a compact topic-cluster title.
- Tag output quality constraints are enforced:
  - noun/phrase focused tags.
  - allow multi-word entities/topics.
  - reject low-signal adjective/verb fragments.
- Offline ingest behavior is explicit:
  - derive provisional metadata from hostname/path tokens.
  - enqueue a `needs_enrichment` retry job in the `jobs` table.

## Verification checklist
- integration tests for happy path and failure path
- idempotency tests (double-run)
- tests that online URL enrichment fetches timed HTML and stores OpenGraph/oEmbed fields.
- tests that offline ingest creates provisional metadata and enqueues `needs_enrichment` in `jobs`.
- tests for deterministic title synthesis for single URL vs multi-URL inputs.
- tests that tag filtering allows noun phrases/multi-word entities and rejects low-signal adjective/verb fragments.
- tests that retry workers process `needs_enrichment` deterministically (no duplicate jobs/results across reruns).
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Stable ingest state machine with checkpointed execution.
