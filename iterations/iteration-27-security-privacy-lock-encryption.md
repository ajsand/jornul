# Iteration 27 — Security & Privacy: App Lock, Sensitive Tagging, Local Protection
**Primary subagents:** journallink-architect, journallink-mobile-ui  
**Support subagents:** journallink-db, journallink-qa, journallink-release

## Goal
Add production-grade privacy controls:
- biometric/passcode app lock
- sensitive tag handling
- safer local storage practices

## Implementation Requirements
- Settings toggle: App Lock (FaceID/TouchID/PIN fallback)
- Sensitive items:
  - mark as sensitive
  - excluded from compare capsules by default
- Credentials:
  - store gateway auth/session tokens securely
  - avoid plaintext storage/logging of tokens
- Logging:
  - ensure no raw capsule payloads are logged

## Acceptance Criteria
- App lock works on resume.
- Sensitive content excluded by default.
- Credentials never stored in plaintext files.

## Commit
`feat(security): app lock + sensitive defaults + secure credential handling`
