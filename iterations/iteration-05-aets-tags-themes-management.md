# Iteration 05 — AETS v2: Tag Quality, Theme Refresh, and Tag Management UX

## Why this iteration exists
Produce meaningful emergent tags/themes and give users control over taxonomy quality.

## Architecture alignment (must honor)
- Schema references must align with CLAUDE.md §6: `items`, `media_files`, `normalized_text`, `jobs`, `sync_sessions`, and `session_ledger`.
- AETS is noun-phrase oriented.
- Theme refresh is incremental.
- Tagging remains deterministic and explainable.

## Claude Opus 4.5 implementation contract
1. Favor precision and stability over aggressive recall.
2. Add explainability metadata for generated tags.
3. Keep user corrections as first-class signals.

## Scope
### 1) AETS algorithm improvements
- Noun-phrase extraction pipeline refinement.
- Stopword/domain-noise suppression.
- Tag normalization (case, singularization, punctuation rules).

### 2) Theme generation refresh
- Incremental theme updates from tag graph changes.
- Theme membership confidence scoring.
- Avoid expensive full rebuilds unless forced.

### 3) User taxonomy controls
- Screens/actions for:
  - merge tags
  - rename tag
  - pin/protect tags
  - hide noisy tags
- Apply user edits as constraints in future tagging passes.

### 4) Quality telemetry (local)
- Track non-sensitive quality counters (e.g., accepted/rejected tags).
- No raw private content in metrics.

## Acceptance criteria
- Tag noise reduced versus baseline.
- User edits persist and influence subsequent tagging.
- Themes remain stable across reprocessing.

## Verification checklist
- AETS unit tests
- integration tests for tag merge/rename propagation
- manual validation on sample dataset
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Meaningful tags/themes + user management tools.
