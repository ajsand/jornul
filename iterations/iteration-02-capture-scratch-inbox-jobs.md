# Iteration 02 — Capture UX: Scratch + Bulk Import + Inbox Job Visibility

## Why this iteration exists
Deliver a fast-capture flow that saves instantly and communicates background enrichment progress clearly.

## Architecture alignment (must honor)
- Immediate save for user actions.
- Enrichment is resumable background work.
- Inbox explicitly surfaces item processing states.

## Claude Opus 4.5 implementation contract
1. Prioritize reliability over UI complexity.
2. Save first, enrich second (never block save on enrichment).
3. Avoid ingesting via unsupported OS-share assumptions in Expo Go.

## Scope
### 1) Scratch screen v1 complete
- Inputs: free text, pasted URLs, file attachments (multi-select where possible).
- `Save` creates item synchronously with minimal metadata.
- Queue background jobs for extraction/tagging after save.

### 2) Bulk import pathway
- Implement multi-file import (images/docs/audio as supported).
- Decide and implement one model:
  - one item per file, or
  - bundle item with child records.
- Persist import source metadata for debugging and analytics.

### 3) Inbox status timeline
- Show per-item state machine progress:
  - `saved` → `enriching` → `tagging` → `ready` / `failed`
- Add retry action for failed jobs.
- Show deterministic timestamps for each state transition.

### 4) Background job runner hardening
- Add chunking/backoff for large imports.
- Ensure resume after app relaunch.
- Ensure failures are isolated (one bad file doesn’t block queue).

## Acceptance criteria
- User can import at least 10 items in one action without UI freeze.
- Inbox reflects accurate real-time statuses.
- App restart mid-run resumes queue safely.

## Verification checklist
- manual bulk import (10 files)
- manual restart during processing
- job runner tests for retry/backoff/resume
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Production-usable Scratch capture flow + Inbox processing visibility.
