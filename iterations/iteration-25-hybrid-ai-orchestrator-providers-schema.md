# Iteration 25 — AI Orchestrator: Gateway Integration + Strict Schema + Local Fallback
**Primary subagents:** journallink-ai-orchestrator  
**Support subagents:** journallink-db, journallink-mobile-ui, journallink-qa, journallink-architect

## Goal
Implement AI orchestration end-to-end:
- local fallback insights (no network)
- cloud insights via **JournalLink Gateway**
- strict JSON schema validation
- evidence pointers back to local items

## Implementation Requirements
### A) Schema
- Define `InsightResult` schema:
  - shared_topics[]
  - differences[]
  - curiosities[]
  - suggested_questions[]
  - each with evidence_ids

### B) Local fallback
- Compute overlaps:
  - tag overlap
  - swipe preference similarity
  - topic differences
- Generate deterministic conversation prompts heuristically

### C) Gateway adapter
- Use authenticated app session (subscription aware)
- Send minimized Compare Capsule
- Validate returned JSON matches schema (reject + show recoverable error otherwise)

### D) UI integration
- “Run Insights” button from Consent
- Progress states: packing → sending → validating → rendering

## Acceptance Criteria
- Works fully offline using local fallback.
- Online gateway insights render with schema-compliant output.
- Evidence links open item detail screens.

## Verification Checklist
- Offline: run insights → see local result
- Online: run insights → see structured result
- Force invalid JSON (simulate) → shows recoverable error

## Commit
`feat(ai): gateway orchestrator + schema validation + local fallback`
