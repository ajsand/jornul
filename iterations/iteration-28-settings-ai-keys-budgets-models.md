# Iteration 28 — Settings: Gateway Account, AI Usage Controls, Privacy Defaults
**Primary subagents:** journallink-mobile-ui, journallink-ai-orchestrator  
**Support subagents:** journallink-release, journallink-qa, journallink-architect

## Goal
Make AI settings production-ready:
- gateway account/session visibility
- per-session usage/cost controls
- privacy defaults for cloud AI behavior

## Implementation Requirements
- Settings screens:
  - account status + subscription state from gateway
  - cloud AI default toggle (off by default)
  - budget/cost cap for cloud calls
  - link-fetch enrichment preference toggle
- Consent UI reads these settings and enforces caps.

## Acceptance Criteria
- User can view account/subscription status.
- Budget cap blocks sending if estimate exceeds cap.
- UI is clear and stable.

## Commit
`feat(settings): gateway account + ai budget controls + privacy defaults`
