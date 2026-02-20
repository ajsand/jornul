# Iteration 03 — Deterministic Ingest Pipeline (Detect→Normalize→Extract→Tag→Theme→Ready)

## Why this iteration exists
Formalize the ingest pipeline into deterministic resumable stages with durable state transitions and robust failure handling.

## Architecture alignment (must honor)
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
- Re-running pipeline does not duplicate links/tags/themes.
- Failed stage can be retried and continue from checkpoint.

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
- Stable ingest state machine with checkpointed execution.
