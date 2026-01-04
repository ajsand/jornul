# Iteration 32 — P2P Upgrade (Dev Build): Multipeer (iOS) + Nearby (Android)
**Primary subagents:** journallink-sync, journallink-release  
**Support subagents:** journallink-architect, journallink-mobile-ui, journallink-qa

## Goal
Replace QR-only exchange with true local device-to-device sync in person.

## Implementation Requirements
- Add native modules (or vetted libraries) for:
  - iOS Multipeer Connectivity
  - Android Nearby Connections
- Keep same session model:
  - signature exchange
  - consent
  - capsule
  - orchestrator
- Add robust connection status UI and retry.

## Acceptance Criteria
- Two devices connect over local radio/wifi without server.
- Exchanges signatures reliably.
- QR fallback remains available.

## Commit
`feat(sync): p2p transport (multipeer/nearby) with qr fallback`
