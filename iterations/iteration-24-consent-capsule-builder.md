# Iteration 24 — Consent Screen + Compare Capsule Builder
**Primary subagents:** journallink-sync, journallink-ai-orchestrator  
**Support subagents:** journallink-mobile-ui, journallink-db, journallink-qa, journallink-architect

## Goal
Add the Consent gate and build a minimized Compare Capsule:
- mode: Friend / Heart / Custom
- topic filters
- sensitive toggles
- per-item approvals (first pass: per-category approvals)
- capsule includes excerpts + aggregated swipe stats

## Implementation Requirements
### A) Consent UI
- Mode selector
- Topic chips
- Sensitive toggle (default OFF)
- Cloud toggle (default OFF) + provider selection stub (wired in Iteration 25)
- Token/cost estimate placeholder

### B) Capsule builder
- Select top relevant items per topic:
  - titles + short excerpts (truncate)
  - tags/themes evidence ids
- Include swipe summary distributions (liked/disliked themes)

### C) Ledger
- Create local session ledger row:
  - categories counts only
  - mode/provider selection
  - timestamp

## Acceptance Criteria
- Consent must be completed before any AI insights run.
- Capsule is minimized and inspectable in-app.
- Ledger is stored locally.

## Verification Checklist
- Create consent session with topic “Basketball”
- Verify capsule only includes basketball-tagged evidence
- Toggle sensitive OFF → excludes sensitive-tagged items

## Commit
`feat(compare): consent ui + minimized capsule + session ledger`
