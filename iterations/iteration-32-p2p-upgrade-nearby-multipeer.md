# Iteration 32 — Optional Integration: OpenClaw Connectors (Additive)
**Primary subagents:** journallink-sync, journallink-release  
**Support subagents:** journallink-architect, journallink-mobile-ui, journallink-qa

## Goal
Add optional advanced integrations without affecting core app reliability:
- OpenClaw Save Bot connector (chat/desktop capture)
- OpenClaw BYO agent hub connector mode for power users

## Implementation Requirements
- Keep core app flow unchanged:
  - Scratch capture
  - QR sync + consent + capsule
  - gateway insights
- Add connector endpoints/UI for optional OpenClaw ingestion.
- Security hardening:
  - scoped tokens
  - explicit “power user mode” warnings
  - clear connector enable/disable controls

## Acceptance Criteria
- Core app works fully without OpenClaw.
- Optional connector can push captured entries into user inbox flow.
- Misconfiguration warnings and token scoping are visible.

## Commit
`feat(integrations): optional openclaw connectors with scoped security controls`
