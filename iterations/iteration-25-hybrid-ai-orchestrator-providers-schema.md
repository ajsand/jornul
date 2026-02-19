# Iteration 25 — Hybrid AI Orchestrator: Providers + Strict Schema + Local Fallback
**Primary subagents:** journallink-ai-orchestrator  
**Support subagents:** journallink-db, journallink-mobile-ui, journallink-qa, journallink-architect

## Goal
Implement the AI middleman end-to-end:
- local fallback insights (no network / no keys)
- optional cloud adapters (OpenAI/Gemini/Claude) using user-supplied keys
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
- Generate “conversation prompts” heuristically

### C) Cloud adapters (BYOK)
- Settings screen stores keys in SecureStore
- Provider client builds prompt wrapper using Compare Capsule
- Validate returned JSON matches schema (reject + show error if not)

### D) UI integration
- “Run Insights” button from Consent
- Progress states: packing → calling → validating → rendering

## Acceptance Criteria
- Works fully offline using local fallback.
- With keys, cloud insights render with schema-compliant output.
- Evidence links open item detail screens.

## Verification Checklist
- Offline: run insights → see local result
- Online with key: run insights → see structured result
- Force invalid JSON (simulate) → shows recoverable error

## Commit
`feat(ai): hybrid orchestrator + provider adapters + schema validation`
