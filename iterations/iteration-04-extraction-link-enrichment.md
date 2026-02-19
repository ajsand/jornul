# Iteration 04 — Extraction + Multi-Link Enrichment Quality Pass

## Why this iteration exists
Improve extraction fidelity and robust handling of multi-link capture so downstream tagging and vault search become useful.

## Architecture alignment (must honor)
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
- Multi-link notes produce distinct `item_links` records deterministically.
- Local extraction succeeds without network access.
- Enrichment failures degrade gracefully.

## Verification checklist
- tests for URL canonicalization/dedupe
- tests for extraction storage writes
- manual offline run
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Reliable extraction layer + multi-link enrichment readiness.
