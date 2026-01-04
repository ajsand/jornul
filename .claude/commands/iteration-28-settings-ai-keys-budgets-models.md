# Iteration 28 — Settings: Provider Keys, Budgets, Local Model Management
**Primary subagents:** journallink-mobile-ui, journallink-ai-orchestrator  
**Support subagents:** journallink-release, journallink-qa, journallink-architect

## Goal
Make AI settings production-ready:
- BYOK provider keys
- per-session budget caps
- local model management placeholders (download/delete)

## Implementation Requirements
- Settings screens:
  - OpenAI/Gemini/Anthropic key entry (SecureStore)
  - budget cap (tokens/$) for cloud calls
  - local model page (list + status, even if v1 only shows “coming soon”)
- Consent UI reads these settings and enforces caps.

## Acceptance Criteria
- Keys can be added/removed.
- Budget cap blocks sending if estimate exceeds cap.
- UI is clear and stable.

## Commit
`feat(settings): provider keys + budgets + model management`
