# JournalLink Roadmap (Aligned to Updated Architecture)

## Guiding Sequence

1. Stabilize core screens and local data flows
2. Finalize deterministic ingest pipeline + status UX
3. Improve AETS tag quality + tag management
4. Integrate Cloud AI Gateway for enrichment and insights
5. Build swipe catalog/ranking loops
6. Harden QR sync + consent + capsule minimization
7. Add native share intake via dev builds
8. Release hardening + store compliance

## Iteration Mapping (Current files)

- Iteration 01: foundation local-first core shell + storage/state baseline
- Iteration 02: Scratch capture + bulk import + Inbox job visibility
- Iteration 03: deterministic ingest pipeline state machine
- Iteration 04: extraction quality + multi-link enrichment
- Iteration 05: AETS tag/theme quality + taxonomy management
- Iteration 06: Vault browse/search/filter performance
- Iteration 07: swipe catalog/session/ranking preference loop
- Iteration 08: QR signature exchange + pending compare bootstrap
- Iteration 09: consent policy + capsule builder + session ledgering
- Iteration 10: cloud gateway integration + schema-safe insights + history
- Iteration 11: security/privacy/settings/reliability hardening
- Iteration 12: native share intake + release + app/play store readiness

## Explicit Product Decisions

- QR sync remains baseline; avoid blocking on BLE/P2P.
- BYOK provider setup is not required in the primary user journey.
- Cloud AI is provided by JournalLink Gateway with subscription controls.
- OpenClaw is optional and additive only.
